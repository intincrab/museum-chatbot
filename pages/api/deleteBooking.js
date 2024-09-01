import { MongoClient, ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('museum_chatbot');
    try {
      const { id } = req.query;
      const result = await db.collection('bookings').deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 1) {
        res.status(200).json({ message: 'Booking deleted successfully' });
      } else {
        res.status(404).json({ message: 'Booking not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error deleting booking' });
    } finally {
      await client.close();
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

//let me cook