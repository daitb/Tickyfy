import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider';
import DateFilterDropdown from '../components/DateFilterDropdown';
import CategoryFilterDropdown from '../components/CategoryFilterDropdown';
import { Calendar, MapPin, TrendingUp, Star } from 'lucide-react';

const mockEvents = [
  {
    id: '1',
    title: 'Summer Music Festival 2025',
    date: 'July 15, 2025',
    time: '18:00',
    location: 'Central Park, New York',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600',
    category: 'music',
    price: 'From $75',
    isFeatured: true,
    rating: 4.8,
    attendees: 2500
  },
  {
    id: '2',
    title: 'Tech Innovation Summit 2025',
    date: 'August 20, 2025',
    time: '09:00',
    location: 'Convention Center, San Francisco',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
    category: 'conference',
    price: 'From $199',
    isFeatured: true,
    rating: 4.9,
    attendees: 1200
  },
  {
    id: '3',
    title: 'Food & Wine Expo',
    date: 'September 5, 2025',
    time: '12:00',
    location: 'Exhibition Hall, Chicago',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',
    category: 'food-drink',
    price: 'From $45',
    isFeatured: false,
    rating: 4.7,
    attendees: 800
  },
  {
    id: '4',
    title: 'Jazz Night Under the Stars',
    date: 'July 22, 2025',
    time: '20:00',
    location: 'Rooftop Venue, Los Angeles',
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600',
    category: 'music',
    price: 'From $55',
    isFeatured: false,
    rating: 4.6,
    attendees: 350
  },
  {
    id: '5',
    title: 'Digital Marketing Conference',
    date: 'August 10, 2025',
    time: '10:00',
    location: 'Business Center, Boston',
    image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=600',
    category: 'business',
    price: 'From $149',
    isFeatured: true,
    rating: 4.8,
    attendees: 600
  },
  {
    id: '6',
    title: 'Art Exhibition: Modern Masters',
    date: 'September 12, 2025',
    time: '11:00',
    location: 'Art Gallery, Miami',
    image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=600',
    category: 'arts',
    price: 'From $25',
    isFeatured: false,
    rating: 4.5,
    attendees: 450
  }
];

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  const filteredEvents = mockEvents.filter(event => {
    const categoryMatch = selectedCategory === 'all' || event.category === selectedCategory;
    // In real app, you'd filter by actual dates
    return categoryMatch;
  });

  const featuredEvents = filteredEvents.filter(e => e.isFeatured);

  return (
    <div>
      <HeroSlider />

      {/* Filter Section */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#00C16A]" />
              <span className="text-gray-900">Filter Events:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <DateFilterDropdown
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
              <CategoryFilterDropdown
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>
            <div className="text-sm text-gray-600 sm:ml-auto">
              Showing {filteredEvents.length} events
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-12">
        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-6 h-6 text-[#00C16A]" />
              <h2 className="text-2xl text-gray-900">Featured Events</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map(event => (
                <EventCard key={event.id} event={event} onClick={() => navigate(`/event/${event.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* All Events */}
        <section>
          <h2 className="text-2xl text-gray-900 mb-6">All Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} onClick={() => navigate(`/event/${event.id}`)} />
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500">No events found matching your filters.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

interface EventCardProps {
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    image: string;
    price: string;
    rating: number;
    attendees: number;
  };
  onClick: () => void;
}

function EventCard({ event, onClick }: EventCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 px-3 py-1 bg-[#00C16A] text-white text-sm rounded-full">
          {event.price}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-gray-900 mb-3 line-clamp-2">{event.title}</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#00C16A]" />
            <span>{event.date} • {event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#00C16A]" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-gray-900">{event.rating}</span>
          </div>
          <span className="text-sm text-gray-500">{event.attendees} attending</span>
        </div>
      </div>
    </div>
  );
}
