import { useState } from "react";
import { EventCard } from "../components/EventCard";
import { FilterBar, FilterBarState } from "../components/FilterBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { mockEvents } from "../mockData";
import { SortOption } from "../types";

interface EventListingProps {
  onNavigate: (page: string, eventId?: string) => void;
}

export function EventListing({ onNavigate }: EventListingProps) {
  const [filters, setFilters] = useState<FilterBarState>({});
  const [sortBy, setSortBy] = useState<SortOption>("popularity");

  // Filter events
  let filteredEvents = [...mockEvents];

  // Filter by date range
  if (filters.dateRange?.from) {
    filteredEvents = filteredEvents.filter((e) => {
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
    filteredEvents = filteredEvents.filter((e) => e.city === filters.city);
  }

  // Filter by free events
  if (filters.isFree) {
    filteredEvents = filteredEvents.filter((e) =>
      e.ticketTiers.some((tier) => tier.price === 0)
    );
  }

  // Filter by categories
  if (filters.categories && filters.categories.length > 0) {
    filteredEvents = filteredEvents.filter((e) =>
      filters.categories!.includes(e.category)
    );
  }

  // Sort events
  if (sortBy === "date") {
    filteredEvents.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  } else if (sortBy === "price-asc") {
    filteredEvents.sort((a, b) => {
      const aMin = Math.min(...a.ticketTiers.map((t) => t.price));
      const bMin = Math.min(...b.ticketTiers.map((t) => t.price));
      return aMin - bMin;
    });
  } else if (sortBy === "price-desc") {
    filteredEvents.sort((a, b) => {
      const aMin = Math.min(...a.ticketTiers.map((t) => t.price));
      const bMin = Math.min(...b.ticketTiers.map((t) => t.price));
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
            <span className="text-sm text-neutral-600">Sort by:</span>
            <Select
              value={sortBy}
              onValueChange={(value: string) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
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
                onClick={() => onNavigate("event-detail", event.id)}
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
            <h3 className="text-neutral-900 mb-2">No events found</h3>
            <p className="text-neutral-600">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
