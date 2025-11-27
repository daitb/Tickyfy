/**
 * EXAMPLE: Complete Booking Flow Integration
 * 
 * This file shows how to integrate the booking flow into your app.
 * Copy and adapt the patterns shown here to your actual implementation.
 */

import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { BookingProvider, useBooking } from '../contexts/BookingContext';
import { SeatSelection } from '../pages/SeatSelection';
import { Checkout } from '../pages/Checkout';
import { Success } from '../pages/Success';

// ============================================
// EXAMPLE 1: App Setup with BookingProvider
// ============================================

function AppRoutes() {
  const navigate = useNavigate();
  
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/event/:id" element={<EventDetailExample />} />
      <Route path="/event/:id/seats" element={<SeatSelection onNavigate={(page) => navigate(page)} />} />
      <Route path="/checkout" element={<Checkout onNavigate={(page) => navigate(page)} />} />
      <Route path="/success" element={<Success onNavigate={(page) => navigate(page)} />} />
    </Routes>
  );
}

export function BookingFlowApp() {
  return (
    <Router>
      {/* Wrap entire app with BookingProvider */}
      <BookingProvider>
        <AppRoutes />
      </BookingProvider>
    </Router>
  );
}

// ============================================
// EXAMPLE 2: Event Detail Page with Booking
// ============================================

function EventDetailExample() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setEventInfo, setTicketType } = useBooking();
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<number | null>(null);

  // Mock event data - replace with real API call
  const event = {
    id: parseInt(id || '1'),
    title: 'Summer Music Festival 2024',
    date: 'July 20, 2024 • 7:00 PM',
    venue: 'Madison Square Garden',
    image: 'https://example.com/event.jpg',
    ticketTypes: [
      { id: 1, name: 'General Admission', price: 75, available: 100 },
      { id: 2, name: 'VIP', price: 150, available: 50 },
      { id: 3, name: 'Premium', price: 200, available: 20 },
    ],
  };

  const handleTicketTypeSelect = (ticketTypeId: number) => {
    const ticketType = event.ticketTypes.find((tt) => tt.id === ticketTypeId);
    if (!ticketType) return;

    // Store event info in booking context
    setEventInfo(
      event.id,
      event.title,
      event.date,
      event.venue,
      event.image
    );

    // Store selected ticket type
    setTicketType(ticketTypeId, ticketType.name, ticketType.price);

    // Navigate to seat selection
    navigate(`/event/${event.id}/seats`);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
      <p className="text-gray-600 mb-2">{event.date}</p>
      <p className="text-gray-600 mb-6">{event.venue}</p>

      <h2 className="text-2xl font-semibold mb-4">Select Ticket Type</h2>
      <div className="grid gap-4">
        {event.ticketTypes.map((ticketType) => (
          <div
            key={ticketType.id}
            className={`p-4 border rounded-lg cursor-pointer transition ${
              selectedTicketTypeId === ticketType.id
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => setSelectedTicketTypeId(ticketType.id)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{ticketType.name}</h3>
                <p className="text-sm text-gray-600">{ticketType.available} available</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-teal-600">${ticketType.price}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => selectedTicketTypeId && handleTicketTypeSelect(selectedTicketTypeId)}
        disabled={!selectedTicketTypeId}
        className="mt-6 w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Continue to Seat Selection
      </button>
    </div>
  );
}

// ============================================
// EXAMPLE 3: Using Booking Context in Component
// ============================================

function BookingSummaryWidget() {
  const { bookingState } = useBooking();

  if (!bookingState.eventId) {
    return <div>No booking in progress</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-semibold mb-2">Current Booking</h3>
      <div className="text-sm text-gray-600 space-y-1">
        <p>
          <strong>Event:</strong> {bookingState.eventTitle}
        </p>
        <p>
          <strong>Ticket Type:</strong> {bookingState.ticketTypeName}
        </p>
        <p>
          <strong>Seats:</strong> {bookingState.selectedSeats.length} selected
        </p>
        <p>
          <strong>Total:</strong> ${bookingState.total.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 4: Custom Hook for Booking Logic
// ============================================

function useBookingFlow() {
  const { bookingState, setEventInfo, setTicketType, resetBooking } = useBooking();
  const navigate = useNavigate();

  const startBooking = (
    eventId: number,
    eventTitle: string,
    eventDate: string,
    eventVenue: string,
    ticketTypeId: number,
    ticketTypeName: string,
    ticketTypePrice: number
  ) => {
    // Initialize booking
    setEventInfo(eventId, eventTitle, eventDate, eventVenue);
    setTicketType(ticketTypeId, ticketTypeName, ticketTypePrice);

    // Navigate to seat selection
    navigate(`/event/${eventId}/seats`);
  };

  const cancelBooking = () => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      resetBooking();
      navigate('/');
    }
  };

  const isBookingInProgress = bookingState.eventId !== null;

  return {
    bookingState,
    startBooking,
    cancelBooking,
    isBookingInProgress,
  };
}

// Usage example:
function MyComponent() {
  const { bookingState, startBooking, cancelBooking } = useBookingFlow();

  return (
    <div>
      {/* Your component UI */}
      <button onClick={() => startBooking(1, 'Event', '2024-12-31', 'Venue', 10, 'VIP', 150)}>
        Start Booking
      </button>
      {bookingState.eventId && (
        <button onClick={cancelBooking}>Cancel Booking</button>
      )}
    </div>
  );
}

// ============================================
// EXAMPLE 5: HomePage (simple example)
// ============================================

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Welcome to Tickify</h1>
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((id) => (
          <div
            key={id}
            className="p-6 border rounded-lg cursor-pointer hover:shadow-lg transition"
            onClick={() => navigate(`/event/${id}`)}
          >
            <h3 className="text-xl font-semibold mb-2">Event {id}</h3>
            <p className="text-gray-600">Click to view details</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 6: Booking Status Display
// ============================================

function BookingStatusIndicator() {
  const { bookingState } = useBooking();

  if (!bookingState.eventId) return null;

  const steps = [
    { label: 'Select Seats', completed: bookingState.selectedSeats.length > 0 },
    { label: 'Checkout', completed: !!bookingState.bookingId },
    { label: 'Payment', completed: !!bookingState.bookingNumber },
  ];

  return (
    <div className="flex items-center justify-center space-x-4 p-4 bg-gray-100">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step.completed
                ? 'bg-teal-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}
          >
            {index + 1}
          </div>
          <span className="ml-2 text-sm">{step.label}</span>
          {index < steps.length - 1 && (
            <div className="w-8 h-0.5 bg-gray-300 mx-2" />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// TIPS AND BEST PRACTICES
// ============================================

/**
 * 1. ALWAYS wrap your app with BookingProvider at the top level
 * 
 * 2. Initialize booking context when user selects event and ticket type
 *    - Use setEventInfo() and setTicketType()
 * 
 * 3. Let SeatSelection component handle seat selection
 *    - It automatically updates booking context
 *    - Validates availability before checkout
 * 
 * 4. Checkout component reads from context
 *    - No need to pass props
 *    - Creates booking and initiates payment
 * 
 * 5. Success page fetches final booking details
 *    - Can receive bookingId from URL or context
 *    - Displays tickets with QR codes
 * 
 * 6. Handle booking cancellation
 *    - Call resetBooking() to clear state
 *    - Redirect user appropriately
 * 
 * 7. Persist booking state (optional)
 *    - Can use localStorage to persist between page refreshes
 *    - Restore state on app initialization
 * 
 * 8. Error handling
 *    - Always wrap API calls in try-catch
 *    - Show user-friendly error messages
 *    - Use toast notifications for feedback
 */

