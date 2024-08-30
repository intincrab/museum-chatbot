import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Palette, Ticket, Clock } from 'lucide-react'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

const ChatbotTicketingSystem = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    name: '',
    address: '',
    preferredDate: null,
    preferredTimeSlot: '',
    ticketCount: 0
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimeSelect, setShowTimeSelect] = useState(false);

  const steps = [
    { question: "Welcome to our museum! Would you like to book a ticket? (Yes/No)", field: null },
    { question: "Great! May I know your name?", field: 'name' },
    { question: "Thank you! Could you please provide your address?", field: 'address' },
    { question: "Please select your preferred visit date.", field: 'preferredDate' },
    { question: "Please select your preferred time slot.", field: 'preferredTimeSlot' },
    { question: "How many tickets would you like to book?", field: 'ticketCount' }
  ];

  useEffect(() => {
    if (currentStep === 0) {
      setMessages([{ type: 'bot', content: steps[currentStep].question }]);
    } else if (currentStep < steps.length) {
      setMessages(prev => [...prev, { type: 'bot', content: steps[currentStep].question }]);
      if (steps[currentStep].field === 'preferredDate') {
        setShowCalendar(true);
      } else if (steps[currentStep].field === 'preferredTimeSlot') {
        setShowTimeSelect(true);
      }
    } else if (currentStep === steps.length) {
      handleBookingConfirmation();
    }
  }, [currentStep]);

  const handleBookingConfirmation = async () => {
    try {
      const response = await fetch('/api/storeUserData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      if (response.ok) {
        setMessages(prev => [
          ...prev,
          { type: 'bot', content: `Great! I've booked ${userData.ticketCount} ticket(s) for you on ${format(userData.preferredDate, 'MMMM d, yyyy')} during the ${userData.preferredTimeSlot} slot. Your total is $${userData.ticketCount * 50}. Would you like to proceed to payment? (Yes/No)` }
        ]);
      } else {
        setMessages(prev => [...prev, { type: 'bot', content: "I apologize, but there was an issue booking your ticket. Can you please try again?" }]);
      }
    } catch (error) {
      console.error('Error submitting user data:', error);
      setMessages(prev => [...prev, { type: 'bot', content: "I apologize, but there was an error on our end. Can you please try again?" }]);
    }
  };

  const handleSendMessage = () => {
    if (input.trim() === '') return;

    setMessages(prev => [...prev, { type: 'user', content: input }]);

    if (currentStep === 0) {
      if (input.toLowerCase() === 'yes') {
        setCurrentStep(prev => prev + 1);
      } else {
        setMessages(prev => [...prev, { type: 'bot', content: "I understand. Is there anything else I can help you with regarding our museum?" }]);
      }
    } else if (currentStep < steps.length) {
      if (steps[currentStep].field !== 'preferredDate' && steps[currentStep].field !== 'preferredTimeSlot') {
        setUserData(prev => ({
          ...prev,
          [steps[currentStep].field]: input
        }));
        setCurrentStep(prev => prev + 1);
      }
    } else if (currentStep === steps.length) {
      if (input.toLowerCase() === 'yes') {
        setMessages(prev => [...prev, { type: 'bot', content: "Great! I'll now guide you through our secure payment gateway." }]);
        // Here you would integrate with your payment gateway
        setTimeout(() => {
          setMessages(prev => [...prev, { type: 'bot', content: "Payment successful! Your tickets have been booked. We look forward to welcoming you to our museum! Is there anything else I can help you with?" }]);
        }, 2000);
      } else {
        setMessages(prev => [...prev, { type: 'bot', content: "I understand. Your booking is on hold. Is there anything else I can help you with regarding our museum?" }]);
      }
      setCurrentStep(prev => prev + 1);
    }

    setInput('');
  };

  const handleDateSelect = (date) => {
    setUserData(prev => ({ ...prev, preferredDate: date }));
    setShowCalendar(false);
    setMessages(prev => [...prev, { type: 'user', content: format(date, 'MMMM d, yyyy') }]);
    setCurrentStep(prev => prev + 1);
  };

  const handleTimeSelect = (time) => {
    setUserData(prev => ({ ...prev, preferredTimeSlot: time }));
    setShowTimeSelect(false);
    setMessages(prev => [...prev, { type: 'user', content: time }]);
    setCurrentStep(prev => prev + 1);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F5E6D3]">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col bg-[#FFF8E7] border-[#8B4513] border-2">
        <CardContent className="flex flex-col h-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-serif text-[#8B4513]">Museum Guide</h2>
            <div className="flex space-x-2">
              <Palette className="text-[#8B4513]" />
              <Ticket className="text-[#8B4513]" />
              <Clock className="text-[#8B4513]" />
            </div>
          </div>
          <ScrollArea className="flex-grow mb-4 pr-4">
            {messages.map((message, index) => (
              <div key={index} className={`mb-2 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block p-2 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-[#8B4513] text-[#FFF8E7]' 
                    : 'bg-[#D2B48C] text-[#4A3728]'
                }`}>
                  {message.content}
                </span>
              </div>
            ))}
            {showCalendar && (
              <div className="flex justify-center my-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">Pick a date</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={userData.preferredDate}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {showTimeSelect && (
              <div className="flex justify-center my-4">
                <Select onValueChange={handleTimeSelect}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning (9AM - 12PM)">Morning (9AM - 12PM)</SelectItem>
                    <SelectItem value="Afternoon (12PM - 4PM)">Afternoon (12PM - 4PM)</SelectItem>
                    <SelectItem value="Evening (4PM - 8PM)">Evening (4PM - 8PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </ScrollArea>
          <div className="flex gap-2">
            <Input 
              placeholder="Type your response here..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="border-[#8B4513] focus:ring-[#D2B48C]"
            />
            <Button onClick={handleSendMessage} className="bg-[#8B4513] hover:bg-[#6F2C0E] text-[#FFF8E7]">Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatbotTicketingSystem;