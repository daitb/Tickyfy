import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, User, Minus, Plus, Clock, Share2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { MiniCartBar } from '../components/MiniCartBar';
import { HoldTimer } from '../components/HoldTimer';
import { PolicyBlock } from '../components/PolicyBlock';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import EventHighlights from '../components/event-detail/EventHighlights';
import FAQSection from '../components/event-detail/FAQSection';
import LocationMap from '../components/event-detail/LocationMap';
import ShareButtons from '../components/event-detail/ShareButtons';
import RelatedEvents from '../components/event-detail/RelatedEvents';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { eventService } from '../services/eventService';
import type { CartItem } from '../types';

interface EventDetailProps {
  eventId: string;
  onNavigate: (page: string, eventId?: string) => void;
  onAddToCart: (items: CartItem[]) => void;
}

export function EventDetail({ eventId, onNavigate, onAddToCart }: EventDetailProps) {
  const { t } = useTranslation();
  const [event, setEvent] = useState<any | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showTimer, setShowTimer] = useState(false);
  const [relatedEvents, setRelatedEvents] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    eventService.getEventByIdentifier(eventId)
      .then((ev) => { if (mounted) setEvent(ev); })
      .catch(() => { if (mounted) setEvent(null); });
    return () => { mounted = false; };
  }, [eventId]);

  // Get related events from the same category
  useEffect(() => {
    if (event?.category) {
      eventService.getEvents()
        .then(events => {
          const related = events.filter(e => 
            e.category === event.category && e.id !== event.id
          ).slice(0, 4);
          setRelatedEvents(related);
        })
        .catch(() => setRelatedEvents([]));
    }
  }, [event?.category, event?.id]);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2>{t('events.eventNotFound')}</h2>
          <Button onClick={() => onNavigate('home')} className="mt-4">
            {t('common.returnHome')}
          </Button>
        </div>
      </div>
    );
  }

  const handleQuantityChange = (tierId: string, delta: number) => {
    const tier = event.ticketTiers.find((t: any) => t.id === tierId);
    if (!tier) return;

    const currentQty = quantities[tierId] || 0;
    const newQty = Math.max(0, Math.min(tier.available, currentQty + delta));
    
    setQuantities({ ...quantities, [tierId]: newQty });
    
    if (newQty > 0 && !showTimer) {
      setShowTimer(true);
    }
  };

  const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  const subtotal = event.ticketTiers.reduce((sum: number, tier: any) => {
    return sum + (tier.price * (quantities[tier.id] || 0));
  }, 0);

  const handleCheckout = () => {
    const items: CartItem[] = event.ticketTiers
      .filter((tier: any) => quantities[tier.id] > 0)
      .map((tier: any) => ({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventVenue: event.venue,
        tierId: tier.id,
        tierName: tier.name,
        price: tier.price,
        quantity: quantities[tier.id]
      }));
    
    onAddToCart(items);
    onNavigate('cart');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const eventUrl = `https://tickify.vn/events/${event.slug}`;

  return (
    <div className="min-h-screen bg-neutral-50 pb-32">
      {/* Hero Image */}
      <div className="w-full h-[400px] bg-neutral-900 relative">
        <ImageWithFallback
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover opacity-90"
        />
        
        {/* Share Button Overlay */}
        <div className="absolute top-4 right-4 z-10">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="secondary" 
                size="sm"
                className="bg-white/90 hover:bg-white backdrop-blur-sm"
              >
                <Share2 size={16} className="mr-2" />
                {t('common.share')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-0 shadow-xl" align="end">
              <ShareButtons eventTitle={event.title} eventUrl={eventUrl} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <Badge className="bg-teal-500 hover:bg-teal-600">{event.category}</Badge>
                {showTimer && <HoldTimer onExpire={() => setShowTimer(false)} />}
              </div>

              <h1 className="mb-6">{event.title}</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3">
                  <Calendar className="text-teal-500 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <div className="text-sm text-neutral-500">{t('events.dateTime')}</div>
                    <div className="text-neutral-900">
                      {formatDate(event.date)}
                    </div>
                    <div className="text-neutral-600">{event.time}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="text-teal-500 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <div className="text-sm text-neutral-500">{t('common.venue')}</div>
                    <div className="text-neutral-900">{event.venue}</div>
                    <div className="text-neutral-600">{event.city}</div>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              <div>
                <h3 className="mb-4">{t('events.aboutThisEvent')}</h3>
                <div className="text-neutral-600 leading-relaxed space-y-4 whitespace-pre-line">
                  {event.fullDescription || event.description}
                </div>
              </div>

              <Separator className="my-8" />

              {/* Organizer */}
              <div>
                <h3 className="mb-4">{t('events.organizer')}</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-teal-100 text-teal-600">
                      {event.organizerAvatar || event.organizerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-neutral-900">{event.organizerName}</div>
                    <div className="text-sm text-neutral-500">{t('events.eventOrganizer')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Highlights */}
            {event.highlights && <EventHighlights highlights={event.highlights} />}

            {/* Location Map */}
            {event.venueDetails && (
              <LocationMap
                address={event.venueDetails.fullAddress}
                latitude={event.venueDetails.latitude}
                longitude={event.venueDetails.longitude}
              />
            )}

            {/* FAQs */}
            {event.faqs && <FAQSection faqs={event.faqs} />}

            {/* Policies */}
            <PolicyBlock policies={event.policies} />

            {/* Related Events */}
            {relatedEvents.length > 0 && (
              <RelatedEvents
                currentEventId={event.id}
                relatedEvents={relatedEvents}
                onEventClick={(id) => {
                  onNavigate('event-detail', id);
                  window.scrollTo(0, 0);
                }}
              />
            )}
          </div>

          {/* Ticket Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-20">
              <h3 className="mb-6">{t('events.selectTickets')}</h3>

              <div className="space-y-4">
                {event.ticketTiers.map((tier: any) => (
                  <div
                    key={tier.id}
                    className={`border rounded-xl p-4 transition-all ${
                      tier.available === 0
                        ? 'border-neutral-200 bg-neutral-50 opacity-60'
                        : quantities[tier.id] > 0
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-neutral-200 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-neutral-900">{tier.name}</div>
                        <div className="text-sm text-neutral-500 mt-1">
                          {tier.description}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-neutral-900">{formatPrice(tier.price)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-neutral-500">
                        {tier.available > 0 ? (
                          `${tier.available} ${t('events.available')}`
                        ) : (
                          <span className="text-red-600">{t('events.soldOut')}</span>
                        )}
                      </div>

                      {tier.available > 0 && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-8 h-8 p-0"
                            onClick={() => handleQuantityChange(tier.id, -1)}
                            disabled={!quantities[tier.id]}
                          >
                            <Minus size={16} />
                          </Button>
                          <span className="w-8 text-center">
                            {quantities[tier.id] || 0}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-8 h-8 p-0"
                            onClick={() => handleQuantityChange(tier.id, 1)}
                            disabled={quantities[tier.id] >= tier.available}
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MiniCartBar
        itemCount={totalItems}
        subtotal={subtotal}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
