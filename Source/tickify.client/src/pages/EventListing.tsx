import { useState, useEffect } from 'react';
import { EventCard } from '../components/EventCard';
import { FilterBar } from '../components/FilterBar';
import type { FilterBarState } from '../components/FilterBar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { eventService } from '../services/eventService';
import type { SortOption } from '../types';
import { useTranslation } from 'react-i18next';

interface EventListingProps {
  onNavigate: (page: string, eventId?: string) => void;
}

export function EventListing({ onNavigate }: EventListingProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FilterBarState>({});
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    eventService.getEvents().then((data) => setEvents(data || [])).catch(() => setEvents([]));
  }, []);

  // Filter events (from backend)
  let filteredEvents = [...events];

  // Filter by date range
  if (filters.dateRange?.from) {
    filteredEvents = filteredEvents.filter(e => {
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      
      const fromDate = filters.dateRange!.from!;
      fromDate.setHours(0, 0, 0, 0);
      
      if (filters.dateRange!.to) {
        const toDate = filters.dateRange!.to;
        toDate.setHours(23, 59, 59, 999);
        return eventDate >= fromDate && eventDate <= toDate;
      }
      
      return eventDate.getTime() === fromDate.getTime();
    });
  }

  // Filter by city
  if (filters.city) {
    filteredEvents = filteredEvents.filter(e => e.city === filters.city);
  }

  // Filter by free events
  if (filters.isFree) {
    filteredEvents = filteredEvents.filter(e => 
      e.ticketTiers.some((tier: any) => tier.price === 0)
    );
  }

  // Filter by categories
  if (filters.categories && filters.categories.length > 0) {
    filteredEvents = filteredEvents.filter(e => 
      filters.categories!.includes(e.category)
    );
  }

  // Sort events
  if (sortBy === 'date') {
    filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else if (sortBy === 'price-asc') {
    filteredEvents.sort((a, b) => {
      const aMin = Math.min(...a.ticketTiers.map((t: any) => t.price));
      const bMin = Math.min(...b.ticketTiers.map((t: any) => t.price));
      return aMin - bMin;
    });
  } else if (sortBy === 'price-desc') {
    filteredEvents.sort((a, b) => {
      const aMin = Math.min(...a.ticketTiers.map((t: any) => t.price));
      const bMin = Math.min(...b.ticketTiers.map((t: any) => t.price));
      return bMin - aMin;
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Filter Bar - Now below header */}
      <FilterBar 
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filteredEvents.length}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Sort Control */}
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">{t('events.sortBy')}:</span>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">{t('events.sort.popularity')}</SelectItem>
                <SelectItem value="date">{t('events.sort.date')}</SelectItem>
                <SelectItem value="price-asc">{t('events.sort.priceLowToHigh')}</SelectItem>
                <SelectItem value="price-desc">{t('events.sort.priceHighToLow')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events Grid with fade animation */}
        {filteredEvents.length > 0 ? (
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300"
            key={JSON.stringify(filters)}
          >
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => onNavigate('event-detail', event.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 animate-in fade-in duration-300">
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
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-neutral-900 mb-2">{t('events.noEventsFound')}</h3>
            <p className="text-neutral-600">{t('events.tryAdjustingFilters')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
