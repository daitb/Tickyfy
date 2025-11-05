import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { QRTicketCard } from '../components/QRTicketCard';
import { mockOrders, mockEvents } from '../mockData';
import { Order } from '../types';

interface MyTicketsProps {
  orders: Order[];
  onNavigate: (page: string) => void;
}

export function MyTickets({ orders, onNavigate }: MyTicketsProps) {
  const [activeTab, setActiveTab] = useState('upcoming');

  // Combine prop orders with mock orders
  const allOrders = [...orders, ...mockOrders];

  const now = new Date();
  const upcomingOrders = allOrders.filter(order => {
    const event = mockEvents.find(e => e.id === order.eventId);
    return event && new Date(event.date) >= now;
  });

  const pastOrders = allOrders.filter(order => {
    const event = mockEvents.find(e => e.id === order.eventId);
    return event && new Date(event.date) < now;
  });

  const renderTickets = (ordersList: Order[]) => {
    if (ordersList.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="text-neutral-400 mb-4">
            <svg
              className="mx-auto h-24 w-24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          </div>
          <h3 className="text-neutral-900 mb-2">No tickets found</h3>
          <p className="text-neutral-600">
            {activeTab === 'upcoming' 
              ? "You don't have any upcoming events" 
              : "You don't have any past events"}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {ordersList.map(order => {
          const event = mockEvents.find(e => e.id === order.eventId);
          if (!event) return null;

          return (
            <div key={order.id}>
              <div className="mb-4">
                <h3 className="mb-1">{event.title}</h3>
                <p className="text-sm text-neutral-500">
                  Order {order.id} • {new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {order.tickets.map(ticket => (
                  <QRTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    eventTitle={event.title}
                    eventDate={event.date}
                    eventVenue={event.venue}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="mb-8">My Tickets</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {renderTickets(upcomingOrders)}
          </TabsContent>

          <TabsContent value="past">
            {renderTickets(pastOrders)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
