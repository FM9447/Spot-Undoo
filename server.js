import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const MONGODB_URI = process.env.MONGODB_URI || '';
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set in .env');
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
let db;

client.connect().then(() => {
  db = client.db('spot_undo');
  console.log('✅ Connected to MongoDB Atlas (spot_undo)');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Save generated plans with hub, prompt, and image
app.post('/api/plans', async (req, res) => {
  try {
    const { hub, plans, prompt, imageUrl } = req.body;
    if (!hub || !Array.isArray(plans)) {
      return res.status(400).json({ error: 'hub and plans required' });
    }
    const doc = {
      hub,
      plans,
      prompt: prompt || '',
      imageUrl: imageUrl || null,
      createdAt: new Date(),
    };
    const result = await db.collection('plans').insertOne(doc);
    res.json({ success: true, insertedId: result.insertedId });
  } catch (e) {
    console.error('Failed to save plan:', e);
    res.status(500).json({ error: 'Failed to save plan' });
  }
});

// Get plan history
app.get('/api/plans', async (req, res) => {
  try {
    const docs = await db.collection('plans')
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: !!db, time: new Date() });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 spot-undoo Backend running on http://0.0.0.0:${PORT}`);
});
