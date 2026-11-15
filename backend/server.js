import express from 'express'
import cors from 'cors'
import multer from 'multer'
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { MongoClient } from 'mongodb';
import { registerStudent2Routes } from './routes/student2.js';
import { makeStudent5Router, student5Collection, student5Mail } from './routes/student5.js';
import { makeAuthRouter } from './routes/auth.js';
import { makeUsersRouter } from './routes/users.js';
import { protect, requireB2B } from './middleware/auth.js';
import { makeStudent3Router } from './routes/student3.js';
import { connectMongoose } from './config/mongoose.js';

const app = express()
dotenv.config();

// Student 1 - sign-in tokens cannot be made or checked without a secret
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy backend/.env.example to backend/.env and set it.');
  process.exit(1);
}

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING

const mongoClient = new MongoClient(mongoConnectionString);


const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion
});

app.use(cors())
app.use(express.json({ limit: '32kb' }));
app.use('/api/student5', makeStudent5Router({
  getCollection: student5Collection,
  sendNotification: process.env.SMTP_HOST ? student5Mail : undefined
}));
// Student 2 - Localization API and static assets
registerStudent2Routes(app);
// Student 1 - Authentication and profile management
app.use('/api/auth', makeAuthRouter());
app.use('/api/users', makeUsersRouter());
// Student 3 - Catalog, search and saved cart
app.use('/api', makeStudent3Router());
connectMongoose().catch((err) => console.warn('Catalog/cart database not connected:', err.message));

export async function connectToMongoDB() {
  try {
    await mongoClient.connect();
    console.log("You successfully connected to MongoDB!");
    return mongoClient;
  } catch (err) {
    console.dir(err);
  }
}

// Signed-in corporate partners only; each partner sees only their own quotes
app.get('/api/b2b/quote', protect, requireB2B, async (req, res) => {
  try {
    const query = { status: "submitted", userId: req.user._id };

    await connectToMongoDB()

    const quotes = await mongoClient
      .db("solcacao")
      .collection('quotes')
      .find(query)
      .toArray();

    res.status(200).json(quotes);

  } catch (error) {
    console.error("Error retrieving quotes:", error);
    res.status(500).json({ error: "Failed to retrieve quotes" });
  }
});


app.post('/api/b2b/quote', protect, requireB2B, upload.single('image'), async (req, res) => {

  const caption = JSON.parse(req.body.caption);
  const user = req.user; // from the sign-in token, not from the browser

  const params = {
    Bucket: bucketName,
    Key: req.file.originalname,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  }

  const now = new Date();
  await connectToMongoDB()
  const quote_num = await mongoClient.db("solcacao").collection('quotes').countDocuments({});

  const data = {
      _id: `q-${now.getTime().toString(36)}`,
      reference: `SC-${now.getFullYear()}-${String(quote_num + 1).padStart(4, '0')}`,
      cacaoOrigin: caption.cacaoOrigin,
      cacaoPercentage: Number(caption.cacaoPercentage),
      chocolateStyle: caption.chocolateStyle,
      packagingType: caption.packagingType,
      companyName: user.corporatePartner?.companyName || '',
      quantity: Number(caption.quantity),
      deliveryDate: caption.deliveryDate || null,
      packagingNotes: caption.packagingNotes,
      notes: caption.notes,
      user: user.name,
      userId: user._id,
      file: {
        key: params.Key,
        bucket: bucketName,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      status: 'submitted',
      createdAt: now.toISOString(),
    }

  await mongoClient.db("solcacao").collection('quotes').insertOne(data);

  disconnectFromMongoDB() 

  const command = new PutObjectCommand(params)

  await s3.send(command)

  res.status(201).json({ ok: true, request: data })
})


export async function disconnectFromMongoDB() {
  await mongoClient.close();
}

// Unexpected errors answer with JSON instead of an HTML page
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON' });
  console.error(err);
  return res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

const port = 3001
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`)
})