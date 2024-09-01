import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, isValid } from 'date-fns';

export default function AdminPage() {
  const [bookings, setBookings] = useState([]);
  const [newBooking, setNewBooking] = useState({
    name: '',
    address: '',
    preferredDate: '',
    preferredTimeSlot: '',
    ticketCount: 1
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      const response = await fetch('/api/getBookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        console.error('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }

  async function deleteBooking(id) {
    try {
      const response = await fetch(`/api/deleteBooking?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchBookings(); // Refresh the bookings list after deletion
      } else {
        console.error('Failed to delete booking');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  }

  async function createBooking(e) {
    e.preventDefault();
    try {
      const response = await fetch('/api/createBooking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking)
      });
      if (response.ok) {
        await fetchBookings(); // Refresh the bookings list after creation
        setNewBooking({
          name: '',
          address: '',
          preferredDate: '',
          preferredTimeSlot: '',
          ticketCount: 1
        });
      } else {
        console.error('Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  }

  function getBookingsPerDay() {
    const bookingsPerDay = bookings.reduce((acc, booking) => {
      let date;
      if (typeof booking.preferredDate === 'string') {
        date = parseISO(booking.preferredDate);
      } else if (booking.preferredDate instanceof Date) {
        date = booking.preferredDate;
      } else {
        console.error('Invalid date format:', booking.preferredDate);
        return acc; // Skip this booking
      }

      if (!isValid(date)) {
        console.error('Invalid date:', booking.preferredDate);
        return acc; // Skip this booking
      }

      const dateStr = format(date, 'yyyy-MM-dd');
      acc[dateStr] = (acc[dateStr] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(bookingsPerDay).map(([date, count]) => ({ date, count }));
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Booking Data</h1>
      
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Bookings per Day</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={getBookingsPerDay()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="text-xl font-bold mb-2">Create New Booking</h2>
      <form onSubmit={createBooking} className="mb-4">
        <input
          type="text"
          placeholder="Name"
          value={newBooking.name}
          onChange={(e) => setNewBooking({...newBooking, name: e.target.value})}
          className="border p-2 mr-2"
          required
        />
        <input
          type="text"
          placeholder="Address"
          value={newBooking.address}
          onChange={(e) => setNewBooking({...newBooking, address: e.target.value})}
          className="border p-2 mr-2"
          required
        />
        <input
          type="date"
          value={newBooking.preferredDate}
          onChange={(e) => setNewBooking({...newBooking, preferredDate: e.target.value})}
          className="border p-2 mr-2"
          required
        />
        <select
          value={newBooking.preferredTimeSlot}
          onChange={(e) => setNewBooking({...newBooking, preferredTimeSlot: e.target.value})}
          className="border p-2 mr-2"
          required
        >
          <option value="">Select time slot</option>
          <option value="Morning (9AM - 12PM)">Morning (9AM - 12PM)</option>
          <option value="Afternoon (12PM - 4PM)">Afternoon (12PM - 4PM)</option>
          <option value="Evening (4PM - 8PM)">Evening (4PM - 8PM)</option>
        </select>
        <input
          type="number"
          placeholder="Ticket Count"
          value={newBooking.ticketCount}
          onChange={(e) => setNewBooking({...newBooking, ticketCount: parseInt(e.target.value)})}
          className="border p-2 mr-2"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Create Booking</button>
      </form>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Name</th>
            <th className="border border-gray-300 p-2">Address</th>
            <th className="border border-gray-300 p-2">Preferred Date</th>
            <th className="border border-gray-300 p-2">Preferred Time Slot</th>
            <th className="border border-gray-300 p-2">Ticket Count</th>
            <th className="border border-gray-300 p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking._id}>
              <td className="border border-gray-300 p-2">{booking.name}</td>
              <td className="border border-gray-300 p-2">{booking.address}</td>
              <td className="border border-gray-300 p-2">
                {format(parseISO(booking.preferredDate), 'yyyy-MM-dd')}
              </td>
              <td className="border border-gray-300 p-2">{booking.preferredTimeSlot}</td>
              <td className="border border-gray-300 p-2">{booking.ticketCount}</td>
              <td className="border border-gray-300 p-2">
                <button onClick={() => deleteBooking(booking._id)} className="bg-red-500 text-white p-2 rounded">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}