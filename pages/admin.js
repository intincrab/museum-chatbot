import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    async function fetchBookings() {
      const response = await fetch('/api/getBookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        console.error('Failed to fetch bookings');
      }
    }
    fetchBookings();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Booking Data</h1>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Name</th>
            <th className="border border-gray-300 p-2">Address</th>
            <th className="border border-gray-300 p-2">Preferred Date</th>
            <th className="border border-gray-300 p-2">Preferred Time Slot</th>
            <th className="border border-gray-300 p-2">Ticket Count</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking._id}>
              <td className="border border-gray-300 p-2">{booking.name}</td>
              <td className="border border-gray-300 p-2">{booking.address}</td>
              <td className="border border-gray-300 p-2">{booking.preferredDate}</td>
              <td className="border border-gray-300 p-2">{booking.preferredTimeSlot}</td>
              <td className="border border-gray-300 p-2">{booking.ticketCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}