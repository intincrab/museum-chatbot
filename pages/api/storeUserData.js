import { MongoClient } from 'mongodb';

const MAX_CAPACITY_PER_SLOT = 15;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, address, preferredDate, preferredTimeSlot, ticketCount } = req.body;

    if (!name || !address || !preferredDate || !preferredTimeSlot || !ticketCount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('museum_chatbot');

    try {
      // Check capacity for the selected date and time slot
      const existingBookings = await db.collection('bookings').aggregate([
        {
          $match: {
            preferredDate: new Date(preferredDate),
            preferredTimeSlot: preferredTimeSlot
          }
        },
        {
          $group: {
            _id: null,
            totalTickets: { $sum: "$ticketCount" }
          }
        }
      ]).toArray();

      const currentCapacity = existingBookings.length > 0 ? existingBookings[0].totalTickets : 0;
      const remainingCapacity = MAX_CAPACITY_PER_SLOT - currentCapacity;

      if (remainingCapacity < ticketCount) {
        return res.status(409).json({ 
          error: 'Capacity exceeded',
          remainingCapacity: remainingCapacity,
          suggestedSlots: await getSuggestedTimeSlots(db, preferredDate)
        });
      }

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

async function getSuggestedTimeSlots(db, date) {
  const timeSlots = ["Morning (9AM - 12PM)", "Afternoon (12PM - 4PM)", "Evening (4PM - 8PM)"];
  const suggestedSlots = [];

  for (const slot of timeSlots) {
    const bookings = await db.collection('bookings').aggregate([
      {
        $match: {
          preferredDate: new Date(date),
          preferredTimeSlot: slot
        }
      },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: "$ticketCount" }
        }
      }
    ]).toArray();

    const currentCapacity = bookings.length > 0 ? bookings[0].totalTickets : 0;
    if (currentCapacity < MAX_CAPACITY_PER_SLOT) {
      suggestedSlots.push({
        slot: slot,
        remainingCapacity: MAX_CAPACITY_PER_SLOT - currentCapacity
      });
    }
  }

  return suggestedSlots;
}