import { useState } from 'react';
import { Heart, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { WishlistItem } from '../types';
import { mockEvents, mockWishlist } from '../mockData';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface WishlistProps {
  wishlistItems?: WishlistItem[];
  onNavigate: (page: string, eventId?: string) => void;
}

export function Wishlist({ wishlistItems, onNavigate }: WishlistProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('date-added');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Use provided wishlist or mock data
  const allWishlistItems = wishlistItems || mockWishlist;

  // Filter events based on wishlist
  const wishlistEvents = allWishlistItems
    .map(item => ({
      ...mockEvents.find(e => e.id === item.eventId),
      wishlistId: item.id,
      addedAt: item.addedAt
    }))
    .filter(item => item.id); // Remove any undefined events

  const now = new Date();
  
  const upcomingEvents = wishlistEvents.filter(event => {
    if (!event.date) return false;
    return new Date(event.date) >= now;
  });

  const pastEvents = wishlistEvents.filter(event => {
    if (!event.date) return false;
    return new Date(event.date) < now;
  });

  const getFilteredEvents = () => {
    switch (activeTab) {
      case 'upcoming':
        return upcomingEvents;
      case 'past':
        return pastEvents;
      default:
        return wishlistEvents;
    }
  };

  const getSortedEvents = (events: typeof wishlistEvents) => {
    const sorted = [...events];
    switch (sortBy) {
      case 'event-date':
        return sorted.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
      case 'price-low':
        return sorted.sort((a, b) => {
          const priceA = Math.min(...(a.ticketTiers?.map(t => t.price) || [0]));
          const priceB = Math.min(...(b.ticketTiers?.map(t => t.price) || [0]));
          return priceA - priceB;
        });
      case 'price-high':
        return sorted.sort((a, b) => {
          const priceA = Math.min(...(a.ticketTiers?.map(t => t.price) || [0]));
          const priceB = Math.min(...(b.ticketTiers?.map(t => t.price) || [0]));
          return priceB - priceA;
        });
      default: // date-added
        return sorted.sort((a, b) => new Date(b.addedAt!).getTime() - new Date(a.addedAt!).getTime());
    }
  };

  const displayEvents = getSortedEvents(getFilteredEvents());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return `${(price / 1000).toFixed(0)}K VND`;
  };

  const getPriceRange = (event: any) => {
    if (!event.ticketTiers || event.ticketTiers.length === 0) return 'TBD';
    const prices = event.ticketTiers.map((t: any) => t.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `${formatPrice(min)}`;
    return `${formatPrice(min)} - ${formatPrice(max)}`;
  };

  const getEventStatus = (event: any) => {
    if (!event.ticketTiers) return { label: 'Coming Soon', variant: 'secondary' as const };
    const available = event.ticketTiers.some((t: any) => t.available > 0);
    if (available) return { label: 'On Sale', variant: 'default' as const };
    return { label: 'Sold Out', variant: 'destructive' as const };
  };

  const toggleSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleRemoveFromWishlist = (wishlistId: string) => {
    // Handle remove from wishlist
    console.log('Remove from wishlist:', wishlistId);
  };

  const handleRemoveSelected = () => {
    // Handle bulk remove
    console.log('Remove selected:', selectedItems);
    setSelectedItems([]);
  };

  if (displayEvents.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="mb-2">My Wishlist</h1>
            <p className="text-neutral-600">Events you want to attend</p>
          </div>

          {/* Empty State */}
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-neutral-100 mb-6">
              <Heart size={48} className="text-neutral-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-neutral-900 mb-2">Your wishlist is empty</h2>
            <p className="text-neutral-600 mb-6">Start adding events you love</p>
            <Button onClick={() => onNavigate('listing')}>
              Explore Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2">My Wishlist</h1>
          <p className="text-neutral-600">Events you want to attend</p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                All ({wishlistEvents.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastEvents.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-added">Date Added</SelectItem>
                <SelectItem value="event-date">Event Date</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Event Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {displayEvents.map((event) => {
            const status = getEventStatus(event);
            const isSelected = selectedItems.includes(event.wishlistId!);
            
            return (
              <div 
                key={event.wishlistId}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Selection Checkbox */}
                <div className="absolute top-4 left-4 z-20">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelection(event.wishlistId!)}
                    className="bg-white shadow-lg"
                  />
                </div>

                {/* Remove Heart */}
                <button
                  onClick={() => handleRemoveFromWishlist(event.wishlistId!)}
                  className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                >
                  <Heart size={20} className="text-red-500 fill-red-500" />
                </button>

                {/* Event Image */}
                <div 
                  className="aspect-[16/9] overflow-hidden bg-neutral-100 cursor-pointer"
                  onClick={() => onNavigate('event-detail', event.id)}
                >
                  <ImageWithFallback
                    src={event.image!}
                    alt={event.title!}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Category Badge */}
                  <div className="absolute top-4 left-16">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                      {event.category}
                    </Badge>
                  </div>
                </div>

                {/* Event Info */}
                <div className="p-4">
                  <h3 
                    className="mb-3 line-clamp-2 min-h-[3em] cursor-pointer hover:text-teal-600 transition-colors"
                    onClick={() => onNavigate('event-detail', event.id)}
                  >
                    {event.title}
                  </h3>

                  <div className="space-y-2 text-neutral-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span className="text-sm">{formatDate(event.date!)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span className="text-sm">{event.city}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-sm text-neutral-500">From</span>
                      <div className="text-teal-600">{getPriceRange(event)}</div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <Button 
                    className="w-full"
                    variant={status.label === 'On Sale' ? 'default' : 'outline'}
                    onClick={() => {
                      if (status.label === 'On Sale') {
                        onNavigate('event-detail', event.id);
                      } else {
                        // Handle notify me
                        console.log('Notify me for:', event.id);
                      }
                    }}
                  >
                    {status.label === 'On Sale' ? 'View Details' : 'Notify Me'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bulk Actions Bar */}
        {selectedItems.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white rounded-full shadow-2xl px-6 py-4 flex items-center gap-6 border border-neutral-200">
            <span className="text-neutral-900 font-medium">
              {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
            </span>
            <Button 
              variant="destructive" 
              onClick={handleRemoveSelected}
              className="rounded-full"
            >
              Remove Selected
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setSelectedItems([])}
              className="rounded-full"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
