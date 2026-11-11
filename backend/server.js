import express from 'express'
import cors from 'cors'
import multer from 'multer'
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { MongoClient } from 'mongodb';

const app = express()
dotenv.config();

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

export async function connectToMongoDB() {
  try {
    await mongoClient.connect();
    console.log("You successfully connected to MongoDB!");
    return mongoClient;
  } catch (err) {
    console.dir(err);
  }
}

app.get('/api/b2b/quote', async (req, res) => {
  try {
    const user = JSON.parse(req.query.user);
    const query = { status: "submitted", user: user.name };

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


app.post('/api/b2b/quote', upload.single('image'), async (req, res) => {

  const caption = JSON.parse(req.body.caption);
  const user = JSON.parse(req.body.user);

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

  res.status(201).json({ ok: true })
})


export async function disconnectFromMongoDB() {
  await mongoClient.close();
}

const port = 3001
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`)
})