import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('museum_chatbot');

    try {
      const bookings = await db.collection('bookings').find().toArray();
      res.status(200).json(bookings);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching booking data' });
    } finally {
      await client.close();
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}