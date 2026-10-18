import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const MONGODB_URI = process.env.MONGODB_URI || '';

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

// User Registration with Profile Avatar
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const existing = await db.collection('users').findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;
    const userDoc = {
      name: name.trim(),
      email: cleanEmail,
      password, // in real production you would hash with bcrypt
      avatar: avatar || defaultAvatar,
      createdAt: new Date(),
    };
    const result = await db.collection('users').insertOne(userDoc);
    res.json({
      success: true,
      user: {
        id: result.insertedId,
        name: userDoc.name,
        email: userDoc.email,
        avatar: userDoc.avatar,
      },
      token: Buffer.from(`${cleanEmail}:${userDoc.name}`).toString('base64'),
    });
  } catch (e) {
    console.error('Registration failed:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User Login with Profile Avatar
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await db.collection('users').findOne({ email: cleanEmail });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || defaultAvatar,
      },
      token: Buffer.from(`${cleanEmail}:${user.name}`).toString('base64'),
    });
  } catch (e) {
    console.error('Login failed:', e);
    res.status(500).json({ error: 'Login failed' });
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

// Save review
app.post('/api/reviews', async (req, res) => {
  try {
    const { spotId, spotName, rating, reviewText, author } = req.body;
    const doc = {
      spotId,
      spotName,
      rating: Number(rating) || 5,
      reviewText,
      author: author || 'Hadhy',
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

// Save community uploaded spot
app.post('/api/places', async (req, res) => {
  try {
    const spot = req.body;
    if (!spot || !spot.name) return res.status(400).json({ error: 'Name required' });
    // Duplicate guard: same name OR same lat/lng (within tiny tolerance)
    const tolerance = 0.00001;
    const query = {
      $or: [
        { name: spot.name },
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
    const doc = { ...spot, createdAt: new Date() };
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
    if (!url) return res.status(400).json({ error: 'URL required' });

    let finalUrl = url.trim();
    if (finalUrl.includes('goo.gl') || finalUrl.includes('maps.app.goo.gl')) {
      try {
        const resp = await fetch(finalUrl, { method: 'HEAD', redirect: 'follow' });
        if (resp.url) finalUrl = resp.url;
      } catch (headErr) {
        try {
          const resp = await fetch(finalUrl, { method: 'GET', redirect: 'follow' });
          if (resp.url) finalUrl = resp.url;
        } catch {}
      }
    }

    let lat = null, lng = null, placeName = null;

    // Pattern 1: @lat,lng
    const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      lat = parseFloat(atMatch[1]);
      lng = parseFloat(atMatch[2]);
    }

    // Pattern 2: !3dlat!4dlng
    if (!lat) {
      const dMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (dMatch) {
        lat = parseFloat(dMatch[1]);
        lng = parseFloat(dMatch[2]);
      }
    }

    // Pattern 3: query=lat,lng or q=lat,lng or ll=lat,lng or search/lat,lng
    if (!lat) {
      const qMatch = finalUrl.match(/[?&/](?:query|q|ll|search)[=/](-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
      if (qMatch) {
        lat = parseFloat(qMatch[1]);
        lng = parseFloat(qMatch[2]);
      }
    }

    // Extract place name if present in URL
    const placeMatch = finalUrl.match(/\/place\/([^/@?]+)/);
    if (placeMatch) {
      placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    res.json({ success: true, finalUrl, lat, lng, placeName });
  } catch (err) {
    console.error('Maps resolve error:', err);
    res.status(500).json({ error: err.message });
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
