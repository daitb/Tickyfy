import { Calendar, MapPin } from 'lucide-react';
import React from 'react';
import type { Event } from '../types';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { WishlistButton } from './WishlistButton';
import { authService } from '../services/authService';

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const isAuthenticated = authService.isAuthenticated();
  const eventId = parseInt(event.id, 10);

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

  const lowestPrice = Math.min(...event.ticketTiers.filter(t => t.available > 0).map(t => t.price));

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-[4/3] overflow-hidden bg-neutral-100 relative">
        <ImageWithFallback
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isAuthenticated && (
          <div className="absolute top-3 right-3 z-10">
            <WishlistButton
              eventId={eventId}
              size="md"
            />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-neutral-100">
            {event.category}
          </Badge>
        </div>
        <h3 className="mb-3 line-clamp-2 min-h-[3em]">
          {event.title}
        </h3>
        <div className="space-y-2 text-neutral-600">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span className="text-sm">{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span className="text-sm">{event.city}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-neutral-500 text-sm">From</span>
          <span className="text-teal-600">{formatPrice(lowestPrice)}</span>
        </div>
      </div>
    </div>
  );
}
