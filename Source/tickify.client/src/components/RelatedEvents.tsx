import { ArrowRight } from 'lucide-react';
import { EventCard } from './EventCard';
import { Button } from './ui/button';
import type { Event } from '../types';

interface RelatedEventsProps {
  events: Event[];
  onEventClick: (eventId: string) => void;
  onViewAll: () => void;
}

export function RelatedEvents({ events, onEventClick, onViewAll }: RelatedEventsProps) {
  if (events.length === 0) return null;

  return (
    <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
      <div className="flex items-center justify-between mb-6">
        <h3>You May Also Like</h3>
        <Button
          variant="ghost"
          onClick={onViewAll}
          className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
        >
          View All
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {events.slice(0, 3).map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onClick={() => onEventClick(event.id)}
          />
        ))}
      </div>
    </div>
  );
}
