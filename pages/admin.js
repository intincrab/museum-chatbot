import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterDate, setFilterDate] = useState('');
  const [filterTimeSlot, setFilterTimeSlot] = useState('');

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

  function getBookingsPerTimeSlot() {
    const bookingsPerSlot = bookings.reduce((acc, booking) => {
      acc[booking.preferredTimeSlot] = (acc[booking.preferredTimeSlot] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(bookingsPerSlot).map(([slot, count]) => ({ slot, count }));
  }

  function getTotalTickets() {
    return bookings.reduce((total, booking) => total + booking.ticketCount, 0);
  }

  function handleSearch(e) {
    setSearchTerm(e.target.value);
  }

  function handleSort(field) {
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(order);
  }

  function handleFilterDate(e) {
    setFilterDate(e.target.value);
  }

  function handleFilterTimeSlot(e) {
    setFilterTimeSlot(e.target.value);
  }

  function applyFiltersAndSorting(data) {
    let filteredData = data;

    if (searchTerm) {
      filteredData = filteredData.filter(booking =>
        booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDate) {
      filteredData = filteredData.filter(booking =>
        format(parseISO(booking.preferredDate), 'yyyy-MM-dd') === filterDate
      );
    }

    if (filterTimeSlot) {
      filteredData = filteredData.filter(booking =>
        booking.preferredTimeSlot === filterTimeSlot
      );
    }

    if (sortField) {
      filteredData.sort((a, b) => {
        if (a[sortField] < b[sortField]) return sortOrder === 'asc' ? -1 : 1;
        if (a[sortField] > b[sortField]) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filteredData;
  }

  const filteredAndSortedBookings = applyFiltersAndSorting(bookings);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Booking Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Bookings per Day</h2>
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

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Bookings per Time Slot</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getBookingsPerTimeSlot()}
                dataKey="count"
                nameKey="slot"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {getBookingsPerTimeSlot().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">Total Bookings</h2>
          <p className="text-4xl font-bold text-blue-600">{bookings.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">Total Tickets</h2>
          <p className="text-4xl font-bold text-green-600">{getTotalTickets()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">Average Tickets per Booking</h2>
          <p className="text-4xl font-bold text-purple-600">
            {(getTotalTickets() / bookings.length).toFixed(2)}
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Create New Booking</h2>
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

      <h2 className="text-2xl font-bold my-4">Booking List</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or address"
          value={searchTerm}
          onChange={handleSearch}
          className="border p-2 mr-2"
        />
        <input
          type="date"
          value={filterDate}
          onChange={handleFilterDate}
          className="border p-2 mr-2"
        />
        <select
          value={filterTimeSlot}
          onChange={handleFilterTimeSlot}
          className="border p-2 mr-2"
        >
          <option value="">Filter by time slot</option>
          <option value="Morning (9AM - 12PM)">Morning (9AM - 12PM)</option>
          <option value="Afternoon (12PM - 4PM)">Afternoon (12PM - 4PM)</option>
          <option value="Evening (4PM - 8PM)">Evening (4PM - 8PM)</option>
        </select>
      </div>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('name')}>Name</th>
            <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('address')}>Address</th>
            <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('preferredDate')}>Preferred Date</th>
            <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('preferredTimeSlot')}>Preferred Time Slot</th>
            <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('ticketCount')}>Ticket Count</th>
            <th className="border border-gray-300 p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedBookings.map((booking) => (
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