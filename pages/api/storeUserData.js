import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, address, preferredDate, preferredTimeSlot, ticketCount } = req.body;

    if (!name || !address || !preferredDate || !preferredTimeSlot || !ticketCount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('museum_chatbot');

    try {
      const result = await db.collection('bookings').insertOne({
        name,
        address,
        preferredDate: new Date(preferredDate),
        preferredTimeSlot,
        ticketCount: parseInt(ticketCount),
        createdAt: new Date()
      });

      res.status(201).json({ message: 'Booking data stored successfully', id: result.insertedId });
    } catch (error) {
      res.status(500).json({ error: 'Error storing booking data' });
    } finally {
      await client.close();
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}