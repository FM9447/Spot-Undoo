import 'dotenv/config';
import dns from 'node:dns';
try { dns.setDefaultResultOrder('ipv4first'); } catch {}
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MongoClient, ObjectId } from 'mongodb';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const MONGODB_URI = process.env.MONGODB_URI || '';
const JWT_SECRET = process.env.JWT_SECRET || 'spot_undoo_kerala_secure_jwt_secret_2026';

let client;
let db;

async function getDb() {
  if (db) return db;
  if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI not set');
    return null;
  }
  if (!client) {
    client = new MongoClient(MONGODB_URI);
  }
  await client.connect();
  db = client.db('spot_undo');
  return db;
}

if (MONGODB_URI) {
  getDb().then(() => console.log('✅ Connected to MongoDB Atlas (spot_undo)')).catch(err => console.error('MongoDB connection error:', err));
}

// Ensure DB is connected for serverless invocations
app.use(async (req, res, next) => {
  if (!db && MONGODB_URI) {
    try {
      await getDb();
    } catch (e) {
      console.warn('DB connect error in middleware:', e.message);
    }
  }
  next();
});

// Server-side XSS Sanitizer for reviews and places
function sanitizeInputText(input) {
  if (typeof input !== 'string') return input || '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[&<>"'/]/g, (match) => {
      const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
      return entities[match];
    })
    .trim();
}

// In-memory sliding rate limiters to stop brute-force & spam
function createRateLimiter(windowMs, maxAttempts, name) {
  const store = new Map();
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = store.get(ip) || { count: 0, resetTime: now + windowMs };
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count++;
    }
    store.set(ip, record);

    if (record.count > maxAttempts) {
      const waitSecs = Math.ceil((record.resetTime - now) / 1000);
      return res.status(429).json({
        error: `Rate limit reached for ${name}. Please wait ${waitSecs}s before retrying.`,
      });
    }
    next();
  };
}

const rateLimitAuth = createRateLimiter(5 * 60 * 1000, 5, 'login attempts');
const rateLimitOtp = createRateLimiter(60 * 1000, 3, 'OTP requests');
const rateLimitReviews = createRateLimiter(60 * 1000, 5, 'reviews');
const rateLimitPlaces = createRateLimiter(60 * 1000, 5, 'spot submissions');

// In-memory Timing-Safe OTP Store
const otpStore = new Map();

// User Registration with Bcrypt Password Hashing and JWT
app.post('/api/auth/register', rateLimitAuth, async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;
    if (!name || !email || !password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Name, valid email, and password (min 4 characters) required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const existing = await db.collection('users').findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userDoc = {
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      avatar: avatar || defaultAvatar,
      createdAt: new Date(),
    };
    const result = await db.collection('users').insertOne(userDoc);
    const token = jwt.sign(
      { id: result.insertedId.toString(), email: cleanEmail, name: userDoc.name },
      JWT_SECRET,
      { expiresIn: '14d' }
    );
    res.json({
      success: true,
      user: {
        id: result.insertedId,
        name: userDoc.name,
        email: userDoc.email,
        avatar: userDoc.avatar,
      },
      token,
    });
  } catch (e) {
    console.error('Registration failed:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User Login with Bcrypt Verification & Automatic Legacy Migration
app.post('/api/auth/login', rateLimitAuth, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await db.collection('users').findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let isMatch = false;
    if (user.password && user.password.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else if (user.password === password) {
      // Legacy plaintext migration: upgrade to bcrypt hash
      isMatch = true;
      const upgradedHash = await bcrypt.hash(password, 10);
      await db.collection('users').updateOne({ _id: user._id }, { $set: { password: upgradedHash } });
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '14d' }
    );
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || defaultAvatar,
      },
      token,
    });
  } catch (e) {
    console.error('Login failed:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Firebase Social (Google) / Anonymous Sign-In Endpoint
app.post('/api/auth/firebase-login', async (req, res) => {
  try {
    const { email, name, avatar, uid, isAnonymous } = req.body;
    const cleanEmail = (email || `anon_${uid ? uid.slice(0, 8) : Date.now()}@spotundoo.test`).toLowerCase().trim();
    const cleanName = name || (isAnonymous ? 'Anonymous Tester' : 'Explorer');
    const cleanAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;

    let user = await db.collection('users').findOne({ email: cleanEmail });
    if (!user) {
      const userDoc = {
        name: cleanName,
        email: cleanEmail,
        avatar: cleanAvatar,
        firebaseUid: uid || '',
        isAnonymous: !!isAnonymous,
        createdAt: new Date(),
      };
      const result = await db.collection('users').insertOne(userDoc);
      user = { ...userDoc, _id: result.insertedId };
    } else {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date(), avatar: cleanAvatar } }
      );
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name, isAnonymous: !!isAnonymous },
      JWT_SECRET,
      { expiresIn: '14d' }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isAnonymous: !!isAnonymous,
      },
      token,
    });
  } catch (e) {
    console.error('Firebase login error:', e);
    res.status(500).json({ error: 'Social authentication failed' });
  }
});

// Timing-Safe OTP Send Endpoint
app.post('/api/auth/otp/send', rateLimitOtp, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid email required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    // Cryptographically secure 6-digit random code
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest();

    otpStore.set(cleanEmail, {
      hash: hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min expiry
      attempts: 0,
    });

    console.log(`🔒 [Timing-Safe OTP] Generated verification code for ${cleanEmail}: ${rawOtp}`);
    res.json({
      success: true,
      message: 'OTP sent successfully (valid for 5 minutes)',
      // Provide preview in development/test environment
      debugOtp: process.env.NODE_ENV !== 'production' ? rawOtp : undefined,
    });
  } catch (e) {
    console.error('OTP send failed:', e);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
});

// Timing-Safe OTP Verify Endpoint (Eliminating timing-attack vulnerabilities)
app.post('/api/auth/otp/verify', rateLimitAuth, async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Email and 6-digit code required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const record = otpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({ error: 'No active OTP found. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    record.attempts++;
    if (record.attempts > 5) {
      otpStore.delete(cleanEmail);
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    // Constant-time cryptographic comparison
    const candidateHash = crypto.createHash('sha256').update(code.trim()).digest();
    const isMatch = crypto.timingSafeEqual(candidateHash, record.hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // Verification succeeded: wipe used OTP
    otpStore.delete(cleanEmail);

    // Find or create verified user
    let user = await db.collection('users').findOne({ email: cleanEmail });
    if (!user) {
      const userDoc = {
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
        emailVerified: true,
        createdAt: new Date(),
      };
      const result = await db.collection('users').insertOne(userDoc);
      user = { ...userDoc, _id: result.insertedId };
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name, emailVerified: true },
      JWT_SECRET,
      { expiresIn: '14d' }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      token,
    });
  } catch (e) {
    console.error('OTP verify failed:', e);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// Update Profile (Avatar & Name)
app.put('/api/auth/profile', async (req, res) => {
  try {
    const { email, name, avatar } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const cleanEmail = email.toLowerCase().trim();
    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (avatar) updateFields.avatar = avatar;

    const result = await db.collection('users').findOneAndUpdate(
      { email: cleanEmail },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    res.json({ success: true, user: result.value });
  } catch (e) {
    console.error('Profile update failed:', e);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Save generated plans with user-specific ownership
app.post('/api/plans', async (req, res) => {
  try {
    const { hub, plans, prompt, imageUrl, userEmail } = req.body;
    if (!hub || !Array.isArray(plans)) {
      return res.status(400).json({ error: 'hub and plans required' });
    }
    const doc = {
      hub,
      plans,
      prompt: prompt || '',
      imageUrl: imageUrl || null,
      userEmail: (userEmail || 'guest@spotundoo.local').toLowerCase().trim(),
      createdAt: new Date(),
    };
    const result = await db.collection('plans').insertOne(doc);
    res.json({ success: true, insertedId: result.insertedId });
  } catch (e) {
    console.error('Failed to save plan:', e);
    res.status(500).json({ error: 'Failed to save plan' });
  }
});

// Get user-specific plan history
app.get('/api/plans', async (req, res) => {
  try {
    const { userEmail } = req.query;
    let query = {};
    if (userEmail && userEmail !== 'all') {
      const cleanEmail = userEmail.toLowerCase().trim();
      query = {
        $or: [
          { userEmail: cleanEmail },
          { userEmail: 'guest@spotundoo.local' },
          { userEmail: 'hadhy@spotundoo.local' },
          { userEmail: { $exists: false } }
        ]
      };
    }
    const docs = await db.collection('plans')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();
    res.json(docs);
  } catch (e) {
    console.error('Failed to get plans:', e);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Save review with Rate Limiting & XSS Sanitization
app.post('/api/reviews', rateLimitReviews, async (req, res) => {
  try {
    const { spotId, spotName, rating, reviewText, author } = req.body;
    if (!reviewText) return res.status(400).json({ error: 'Review text required' });
    const doc = {
      spotId: sanitizeInputText(spotId),
      spotName: sanitizeInputText(spotName),
      rating: Number(rating) || 5,
      reviewText: sanitizeInputText(reviewText),
      author: sanitizeInputText(author) || 'Local Explorer',
      createdAt: new Date(),
    };
    const result = await db.collection('reviews').insertOne(doc);
    res.json({ success: true, insertedId: result.insertedId });
  } catch (e) {
    console.error('Failed to save review:', e);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

// Get reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const { spotId, spotName } = req.query;
    let query = {};
    if (spotId || spotName) {
      const orList = [];
      if (spotId) {
        orList.push({ spotId: spotId });
        orList.push({ spotId: String(spotId) });
        if (!isNaN(spotId)) orList.push({ spotId: Number(spotId) });
        orList.push({ spotName: spotId });
      }
      if (spotName) {
        orList.push({ spotName: spotName });
      }
      query = { $or: orList };
    }
    const docs = await db.collection('reviews')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    res.json(docs);
  } catch (e) {
    console.error('Failed to get reviews:', e);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Save community uploaded spot with Rate Limiting & XSS Sanitization
app.post('/api/places', rateLimitPlaces, async (req, res) => {
  try {
    const spot = req.body;
    if (!spot || !spot.name) return res.status(400).json({ error: 'Name required' });
    const cleanName = sanitizeInputText(spot.name);
    // Duplicate guard: same name OR same lat/lng (within tiny tolerance)
    const tolerance = 0.00001;
    const query = {
      $or: [
        { name: cleanName },
        {
          lat: { $gte: spot.lat - tolerance, $lte: spot.lat + tolerance },
          lng: { $gte: spot.lng - tolerance, $lte: spot.lng + tolerance },
        },
      ],
    };
    const existing = await db.collection('places').findOne(query);
    if (existing) {
      return res.status(409).json({ error: 'Duplicate spot detected' });
    }
    const doc = {
      ...spot,
      name: cleanName,
      review: sanitizeInputText(spot.review),
      category: sanitizeInputText(spot.category),
      createdAt: new Date(),
    };
    const result = await db.collection('places').insertOne(doc);
    res.json({ success: true, insertedId: result.insertedId });
  } catch (e) {
    console.error('Failed to save place:', e);
    res.status(500).json({ error: 'Failed to save place' });
  }
});

// Get community uploaded spots
app.get('/api/places', async (req, res) => {
  try {
    const docs = await db.collection('places').find({}).sort({ createdAt: -1 }).limit(100).toArray();
    res.json(docs);
  } catch (e) {
    console.error('Failed to get places:', e);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});
// Resolve Google Maps links (including short links maps.app.goo.gl and place links)
app.post('/api/maps/resolve', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ success: false, error: 'Not a map location' });
    }

    let rawInput = url.trim();
    // Extract actual URL if text and URL are combined (e.g. from Google Maps share button)
    const urlMatch = rawInput.match(/https?:\/\/[^\s]+/);
    let targetUrl = urlMatch ? urlMatch[0] : rawInput;
    let textPrefix = urlMatch && urlMatch.index > 0 ? rawInput.slice(0, urlMatch.index).trim() : null;

    let finalUrl = targetUrl;
    let lat = null, lng = null, placeName = textPrefix || null;

    // Fast check on targetUrl before making network calls
    const checkCoords = (str) => {
      // 1. @lat,lng
      const at = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (at) return [parseFloat(at[1]), parseFloat(at[2])];

      // 2. !3dlat!4dlng
      const d = str.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (d) return [parseFloat(d[1]), parseFloat(d[2])];

      // 3. query=lat,lng / q=lat,lng / ll=lat,lng / loc:lat,lng
      const q = str.match(/[?&/](?:query|q|ll|search|loc)[=/](?:loc:)?(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
      if (q) return [parseFloat(q[1]), parseFloat(q[2])];

      // 4. geo:lat,lng
      const geo = str.match(/geo:(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (geo) return [parseFloat(geo[1]), parseFloat(geo[2])];

      // 5. OpenStreetMap #map=zoom/lat/lng
      const osm = str.match(/#map=\d+\/(-?\d+\.\d+)\/(-?\d+\.\d+)/);
      if (osm) return [parseFloat(osm[1]), parseFloat(osm[2])];

      // 6. center=lat,lng or center%3Dlat%2Clng
      const center = str.match(/(?:center=|center%3D)(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i);
      if (center) return [parseFloat(center[1]), parseFloat(center[2])];

      return [null, null];
    };

    [lat, lng] = checkCoords(targetUrl);

    // Follow redirects for short links (maps.app.goo.gl, goo.gl, etc.)
    if (!lat && (targetUrl.includes('goo.gl') || targetUrl.includes('maps.app.goo.gl') || targetUrl.includes('google.com/maps') || targetUrl.startsWith('http'))) {
      try {
        // First try HEAD with manual redirect to read Location header directly
        const headResp = await fetch(targetUrl, { method: 'HEAD', redirect: 'manual' });
        const loc = headResp.headers.get('location');
        if (loc) {
          finalUrl = loc;
          [lat, lng] = checkCoords(finalUrl);
        }

        // If still no coords, do a GET
        if (!lat) {
          const getResp = await fetch(finalUrl, { method: 'GET', redirect: 'follow' });
          if (getResp.url) {
            finalUrl = getResp.url;
            [lat, lng] = checkCoords(finalUrl);
          }
          if (!lat) {
            const bodyText = await getResp.text();
            [lat, lng] = checkCoords(bodyText);
            const appStateMatch = bodyText.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
            if (appStateMatch && !lat) {
              lat = parseFloat(appStateMatch[1]);
              lng = parseFloat(appStateMatch[2]);
            }
          }
        }
      } catch (netErr) {
        console.warn('Network resolve warning:', netErr.message);
      }
    }

    // Extract place name if present in URL
    const placeMatch = finalUrl.match(/\/place\/([^/@?]+)/);
    if (placeMatch) {
      placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    // High-precision geocoding via OpenStreetMap Nominatim for exact place/town coordinates
    if (placeName && (!lat || finalUrl.includes('/place/'))) {
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'SpotUndoo/1.0' } }
        );
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          if (nomData && nomData[0] && nomData[0].lat && nomData[0].lon) {
            lat = parseFloat(parseFloat(nomData[0].lat).toFixed(5));
            lng = parseFloat(parseFloat(nomData[0].lon).toFixed(5));
          }
        }
      } catch (nomErr) {
        console.warn('Nominatim geocode warning:', nomErr.message);
      }
    }

    // Precise Kerala Town coordinates lookup fallback if district-wide center was returned
    const KERALA_TOWN_COORDS = {
      pattambi: [10.80486, 76.17802],
      shoranur: [10.7606, 76.2711],
      kochi: [9.9630, 76.2443],
      ernakulam: [9.9816, 76.2999],
      calicut: [11.2588, 75.7804],
      kozhikode: [11.2588, 75.7804],
      palakkad: [10.7867, 76.6548],
      trivandrum: [8.5241, 76.9366],
      thiruvananthapuram: [8.5241, 76.9366],
      kollam: [8.8932, 76.6141],
      wayanad: [11.6854, 76.1320],
      kalpetta: [11.6050, 76.0828],
    };

    if (placeName) {
      const lower = placeName.toLowerCase();
      for (const [town, coords] of Object.entries(KERALA_TOWN_COORDS)) {
        if (lower.includes(town)) {
          if (!lat || Math.abs(lat - coords[0]) > 0.04 || Math.abs(lng - coords[1]) > 0.04) {
            lat = coords[0];
            lng = coords[1];
          }
          break;
        }
      }
    }

    // Direct raw coordinates check
    if (!lat) {
      const rawMatch = rawInput.match(/^(-?\d{1,3}\.\d+)[,\s]+(-?\d{1,3}\.\d+)$/);
      if (rawMatch) {
        lat = parseFloat(rawMatch[1]);
        lng = parseFloat(rawMatch[2]);
      }
    }

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return res.json({ success: true, finalUrl, lat, lng, placeName });
    }

    return res.json({ success: false, error: 'Not a map location', lat: null, lng: null });
  } catch (err) {
    console.error('Maps resolve error:', err);
    res.status(500).json({ success: false, error: 'Not a map location' });
  }
});

// ElevenLabs Audio Guide Text-to-Speech
app.post('/api/audio/tts', async (req, res) => {
  try {
    const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = req.body;
    const apiKey = req.headers['x-elevenlabs-key'] || process.env.ELEVENLABS_API_KEY;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    if (!apiKey) {
      return res.status(503).json({ error: 'No ElevenLabs API key configured' });
    }

    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      return res.status(elevenRes.status).json({ error: `ElevenLabs error: ${errText}` });
    }

    const audioBuffer = await elevenRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});

// AI Itinerary Planner endpoint powered by Groq (Qwen 3.8 27B)
app.post('/api/ai/plan', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'No GROQ_API_KEY configured' });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Kerala travel itinerary planner. Return ONLY a valid JSON object matching the requested schema with key "plans". Do not wrap in markdown quotes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        response_format: { type: 'json_object' }
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq API error:', errText);
      return res.status(groqRes.status).json({ error: `Groq error: ${errText}` });
    }

    const data = await groqRes.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(rawContent);
    res.json(parsed);
  } catch (err) {
    console.error('AI plan generation error:', err);
    res.status(500).json({ error: err.message || 'AI planning generation failed' });
  }
});

// Community Spot Story / Review Polisher powered by Groq (Qwen 3.8 27B)
app.post('/api/ai/enhance-story', async (req, res) => {
  try {
    const { draft, spotName, city, category, avgCost } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ error: 'No GROQ_API_KEY configured' });
    }

    const effectiveName = (spotName || '').trim() || 'Hidden Kerala Spot';
    const effectiveCity = (city || '').trim() || 'Kerala';
    const effectiveCategory = (category || '').trim() || 'Hidden Spot';
    const userDraft = (draft || '').trim();

    const prompt = userDraft
      ? `You are an editor polishing a traveler's review for "${effectiveName}" in ${effectiveCity}.
User notes: "${userDraft}".

Task: Polish the user's text into 1 to 2 clear, concise, natural sentences (under 35 words).
CRITICAL RULES:
- Strictly stick ONLY to what the user wrote.
- DO NOT invent or fabricate any details, shops, food, paths, or claims the user did NOT mention.
- Output ONLY the polished review text without quotes or markdown.`
      : `Write a short, simple, grounded 1-to-2 sentence community note for "${effectiveName}" in ${effectiveCity} (${effectiveCategory}). Keep it honest, pleasant, and under 25 words without exaggerations or fake claims. Output ONLY the text without quotes.`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 100,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq enhance-story error:', errText);
      return res.status(groqRes.status).json({ error: errText });
    }

    const data = await groqRes.json();
    const resultText = data.choices?.[0]?.message?.content?.trim() || '';
    const cleanStory = resultText.replace(/^["']|["']$/g, '').trim();

    res.json({ success: true, story: cleanStory });
  } catch (err) {
    console.error('Enhance story error:', err);
    res.status(500).json({ error: err.message || 'Story enhancement failed' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: !!db,
    groq: !!process.env.GROQ_API_KEY,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    time: new Date()
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 4000;
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 spot-undoo Backend running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
