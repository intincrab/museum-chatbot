import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('museum_chatbot');
    try {
      const newBooking = req.body;
      const result = await db.collection('bookings').insertOne(newBooking);
      res.status(201).json({ message: 'Booking created successfully', id: result.insertedId });
    } catch (error) {
      res.status(500).json({ error: 'Error creating booking' });
    } finally {
      await client.close();
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}