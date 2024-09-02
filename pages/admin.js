import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, isValid } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminPage() {
  const [bookings, setBookings] = useState([]);
  const [newBooking, setNewBooking] = useState({
    name: '',
    address: '',
    preferredDate: '',
    preferredTimeSlot: '',
    ticketCount: 1,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterDate, setFilterDate] = useState('');
  const [filterTimeSlot, setFilterTimeSlot] = useState('');
  const [darkMode, setDarkMode] = useState(false);

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
        body: JSON.stringify(newBooking),
      });
      if (response.ok) {
        await fetchBookings(); // Refresh the bookings list after creation
        setNewBooking({
          name: '',
          address: '',
          preferredDate: '',
          preferredTimeSlot: '',
          ticketCount: 1,
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
      filteredData = filteredData.filter((booking) =>
        booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDate) {
      filteredData = filteredData.filter(
        (booking) => format(parseISO(booking.preferredDate), 'yyyy-MM-dd') === filterDate
      );
    }

    if (filterTimeSlot) {
      filteredData = filteredData.filter((booking) => booking.preferredTimeSlot === filterTimeSlot);
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
    <div className={`p-4 space-y-2 mx-10 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">Booking Analytics Dashboard</h1>
        <Button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Bookings per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getBookingsPerDay()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings per Time Slot</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getBookingsPerTimeSlot()}
                  dataKey="count"
                  nameKey="slot"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
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
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{bookings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{getTotalTickets()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Tickets per Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              {(getTotalTickets() / bookings.length).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createBooking} className="flex flex-col space-y-2">
            <Input
              type="text"
              placeholder="Name"
              value={newBooking.name}
              onChange={(e) => setNewBooking({ ...newBooking, name: e.target.value })}
              required
            />
            <Input
              type="text"
              placeholder="Address"
              value={newBooking.address}
              onChange={(e) => setNewBooking({ ...newBooking, address: e.target.value })}
              required
            />
            <Input
              type="date"
              placeholder="Preferred Date"
              value={newBooking.preferredDate}
              onChange={(e) => setNewBooking({ ...newBooking, preferredDate: e.target.value })}
              required
            />
            <Select
              value={newBooking.preferredTimeSlot}
              onChange={(e) => setNewBooking({ ...newBooking, preferredTimeSlot: e.target.value })}
              required
            >
              <SelectContent>
                <SelectItem value="placeholder">Select a time slot</SelectItem>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Ticket Count"
              value={newBooking.ticketCount}
              onChange={(e) => setNewBooking({ ...newBooking, ticketCount: Number(e.target.value) })}
              min="1"
              required
            />
            <Button type="submit">Create Booking</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex justify-between items-center">
            <Input
              type="text"
              placeholder="Search by name or address"
              value={searchTerm}
              onChange={handleSearch}
            />
            <div className="flex space-x-2">
              <Input
                type="date"
                placeholder="Filter by Date"
                value={filterDate}
                onChange={handleFilterDate}
              />
              <Select value={filterTimeSlot} onChange={handleFilterTimeSlot}>
                <SelectContent>
                  <SelectItem value="placeholder">Filter by Time Slot</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort('name')}>Name</TableHead>
                <TableHead onClick={() => handleSort('address')}>Address</TableHead>
                <TableHead onClick={() => handleSort('preferredDate')}>Preferred Date</TableHead>
                <TableHead onClick={() => handleSort('preferredTimeSlot')}>Time Slot</TableHead>
                <TableHead onClick={() => handleSort('ticketCount')}>Tickets</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.name}</TableCell>
                  <TableCell>{booking.address}</TableCell>
                  <TableCell>{format(parseISO(booking.preferredDate), 'yyyy-MM-dd')}</TableCell>
                  <TableCell>{booking.preferredTimeSlot}</TableCell>
                  <TableCell>{booking.ticketCount}</TableCell>
                  <TableCell>
                    <Button variant="outline" onClick={() => deleteBooking(booking.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}