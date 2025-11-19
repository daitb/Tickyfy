import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Clock, Users, Tag, Share2, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import LocationMap from '../components/event-detail/LocationMap';
import EventHighlights from '../components/event-detail/EventHighlights';
import FAQSection from '../components/event-detail/FAQSection';
import RelatedEvents from '../components/event-detail/RelatedEvents';
import ShareButtons from '../components/event-detail/ShareButtons';
import { useState } from 'react';

// Mock event data
const mockEvent = {
  id: '1',
  title: 'Summer Music Festival 2025',
  subtitle: 'The biggest outdoor music celebration of the year',
  description: `Join us for an unforgettable musical experience featuring world-renowned artists and emerging talents. This year's Summer Music Festival promises three days of non-stop entertainment across multiple stages.

Experience diverse genres from rock and pop to electronic and indie music. Our carefully curated lineup ensures there's something for everyone. The festival grounds offer premium food vendors, artisan markets, and interactive art installations.

Premium camping options are available for the full festival experience. VIP packages include exclusive lounge access, priority viewing areas, and complimentary drinks.`,
  date: 'July 15-17, 2025',
  time: '12:00 PM - 11:00 PM',
  location: 'Central Park Music Grounds, New York, NY',
  fullAddress: '123 Park Avenue, New York, NY 10001',
  organizer: 'Live Nation Events',
  category: 'Music Festival',
  image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200',
  images: [
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400'
  ],
  capacity: 50000,
  attendees: 35420,
  rating: 4.8,
  reviews: 1247,
  minAge: 18,
  latitude: 40.7829,
  longitude: -73.9654
};

export default function EventDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [showShareButtons, setShowShareButtons] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-[300px] md:h-[400px] lg:h-[500px] bg-black">
        <img
          src={mockEvent.image}
          alt={mockEvent.title}
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-lg -mt-20 relative z-10 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-4">
                <span className="px-3 py-1 bg-[#00C16A]/10 text-[#00C16A] text-sm rounded-full">
                  {mockEvent.category}
                </span>
                <button
                  onClick={() => setIsSaved(!isSaved)}
                  className={`p-2 rounded-full transition-colors ${
                    isSaved ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowShareButtons(!showShareButtons)}
                    className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  {showShareButtons && (
                    <div className="absolute top-full right-0 mt-2 z-20">
                      <ShareButtons eventTitle={mockEvent.title} eventUrl={window.location.href} />
                    </div>
                  )}
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl text-gray-900 mb-2">{mockEvent.title}</h1>
              <p className="text-lg text-gray-600 mb-6">{mockEvent.subtitle}</p>

              {/* Event Meta Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#00C16A] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-gray-900">{mockEvent.date}</div>
                    <div className="text-sm text-gray-600">{mockEvent.time}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#00C16A] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-gray-900">{mockEvent.location}</div>
                    <div className="text-sm text-gray-600">{mockEvent.fullAddress}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-[#00C16A] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-gray-900">{mockEvent.attendees.toLocaleString()} attending</div>
                    <div className="text-sm text-gray-600">Capacity: {mockEvent.capacity.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-[#00C16A] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-gray-900">Organized by</div>
                    <div className="text-sm text-gray-600">{mockEvent.organizer}</div>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-xl ${i < Math.floor(mockEvent.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-gray-900">{mockEvent.rating}</span>
                </div>
                <span className="text-gray-600">({mockEvent.reviews} reviews)</span>
              </div>
            </div>

            {/* Booking Card */}
            <div className="lg:w-[350px] bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="text-2xl text-gray-900 mb-4">Tickets Available</div>
              <div className="text-sm text-gray-600 mb-6">
                Starting from <span className="text-2xl text-[#00C16A]">$75</span>
              </div>
              <Button
                onClick={() => navigate(`/event/${id}/tickets`)}
                className="w-full bg-[#00C16A] hover:bg-[#00a859] text-white h-12"
              >
                Select Tickets
              </Button>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Limited tickets remaining!</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl text-gray-900 mb-4">Event Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockEvent.images.map((image, index) => (
              <div key={index} className="aspect-video rounded-lg overflow-hidden">
                <img
                  src={image}
                  alt={`Event ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Event Description */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl text-gray-900 mb-4">About This Event</h2>
          <div className="prose max-w-none text-gray-700">
            {mockEvent.description.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 last:mb-0">{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Event Highlights */}
        <div className="mt-8">
          <EventHighlights highlights={[
            { icon: 'music', title: 'Multiple Stages', description: '5 stages featuring diverse music genres' },
            { icon: 'users', title: 'World-Class Artists', description: '50+ international and local performers' },
            { icon: 'tent', title: 'Camping Available', description: 'Premium camping experience included' },
            { icon: 'utensils', title: 'Food & Drinks', description: '30+ food vendors and bars' }
          ]} />
        </div>

        {/* Location Map */}
        <div className="mt-8">
          <LocationMap
            address={mockEvent.fullAddress}
            latitude={mockEvent.latitude}
            longitude={mockEvent.longitude}
          />
        </div>

        {/* Important Information */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl text-gray-900 mb-4">Important Information</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-[#00C16A] rounded-full mt-2 flex-shrink-0" />
              <div>
                <div className="text-gray-900">Age Restriction</div>
                <div className="text-sm text-gray-600">Minimum age: {mockEvent.minAge}+. Valid ID required at entry.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-[#00C16A] rounded-full mt-2 flex-shrink-0" />
              <div>
                <div className="text-gray-900">Entry Requirements</div>
                <div className="text-sm text-gray-600">Digital or printed ticket required. Please arrive 30 minutes before start time.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-[#00C16A] rounded-full mt-2 flex-shrink-0" />
              <div>
                <div className="text-gray-900">Refund Policy</div>
                <div className="text-sm text-gray-600">Tickets are non-refundable. In case of event cancellation, full refund will be issued within 14 days.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-[#00C16A] rounded-full mt-2 flex-shrink-0" />
              <div>
                <div className="text-gray-900">What to Bring</div>
                <div className="text-sm text-gray-600">Sunscreen, comfortable shoes, reusable water bottle. No outside food or beverages allowed.</div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8">
          <FAQSection faqs={[
            { question: 'What time does the festival start?', answer: 'Gates open at 12:00 PM each day. The first performance starts at 1:00 PM.' },
            { question: 'Is parking available?', answer: 'Yes, we have on-site parking available for $20 per day. Pre-booking is recommended.' },
            { question: 'Can I bring food and drinks?', answer: 'Outside food and beverages are not permitted. We have a wide variety of food vendors on-site.' },
            { question: 'What should I bring?', answer: 'Bring sunscreen, comfortable shoes, a hat, and a refillable water bottle. Blankets and lawn chairs are allowed.' },
            { question: 'Are pets allowed?', answer: 'For safety reasons, only service animals are permitted at the festival.' }
          ]} />
        </div>

        {/* Related Events */}
        <div className="mt-8 mb-12">
          <RelatedEvents 
            currentEventId={id || '1'}
            relatedEvents={[]}
            onEventClick={(eventId) => navigate(`/events/${eventId}`)}
          />
        </div>
      </div>
    </div>
  );
}
