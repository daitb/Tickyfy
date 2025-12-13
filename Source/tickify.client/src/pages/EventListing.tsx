import { useState, useEffect } from "react";
import { EventCard } from "../components/EventCard";
import { FilterBar } from "../components/FilterBar";
import type { FilterBarState } from "../components/FilterBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { eventService } from "../services/eventService";
import type { SortOption } from "../types";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

interface EventListingProps {
  onNavigate: (page: string, eventId?: string) => void;
}

export function EventListing({ onNavigate }: EventListingProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FilterBarState>({});
  const [sortBy, setSortBy] = useState<SortOption>("popularity");
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Load filters from URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const city = params.get('city');
    
    const initialFilters: FilterBarState = {};
    if (category) {
      initialFilters.categories = [category];
    }
    if (city) {
      initialFilters.city = city;
    }
    
    if (Object.keys(initialFilters).length > 0) {
      setFilters(initialFilters);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await eventService.getEvents();
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading events:", error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter events (from backend)
  let filteredEvents = [...events];

  // Filter by date range
  if (filters.dateRange?.from) {
    filteredEvents = filteredEvents.filter((e) => {
      const eventDate = new Date(e.startDate || e.date);
      eventDate.setHours(0, 0, 0, 0);

      const fromDate = new Date(filters.dateRange!.from!);
      fromDate.setHours(0, 0, 0, 0);

      if (filters.dateRange!.to) {
        const toDate = new Date(filters.dateRange!.to);
        toDate.setHours(23, 59, 59, 999);
        return eventDate >= fromDate && eventDate <= toDate;
      }

      return eventDate.getTime() === fromDate.getTime();
    });
  }

  // Filter by city/location
  if (filters.city) {
    filteredEvents = filteredEvents.filter(
      (e) =>
        (e.city &&
          e.city.toLowerCase().includes(filters.city!.toLowerCase())) ||
        (e.location &&
          e.location.toLowerCase().includes(filters.city!.toLowerCase()))
    );
  }

  // Filter by free events
  if (filters.isFree) {
    filteredEvents = filteredEvents.filter((e) => {
      if (e.ticketTypes && Array.isArray(e.ticketTypes)) {
        return e.ticketTypes.some((tier: any) => tier.price === 0);
      }
      if (e.ticketTiers && Array.isArray(e.ticketTiers)) {
        return e.ticketTiers.some((tier: any) => tier.price === 0);
      }
      return e.price === 0 || e.minPrice === 0;
    });
  }

  // Filter by categories
  if (filters.categories && filters.categories.length > 0) {
    filteredEvents = filteredEvents.filter((e) => {
      const eventCategory = e.categoryName || e.category;
      return filters.categories!.includes(eventCategory);
    });
  }

  // Sort events
  if (sortBy === "date") {
    filteredEvents.sort((a, b) => {
      const dateA = new Date(a.startDate || a.date).getTime();
      const dateB = new Date(b.startDate || b.date).getTime();
      return dateA - dateB;
    });
  } else if (sortBy === "price-asc") {
    filteredEvents.sort((a, b) => {
      const getMinPrice = (event: any) => {
        if (event.ticketTypes && Array.isArray(event.ticketTypes)) {
          return Math.min(...event.ticketTypes.map((t: any) => t.price || 0));
        }
        if (event.ticketTiers && Array.isArray(event.ticketTiers)) {
          return Math.min(...event.ticketTiers.map((t: any) => t.price || 0));
        }
        return event.minPrice || event.price || 0;
      };
      return getMinPrice(a) - getMinPrice(b);
    });
  } else if (sortBy === "price-desc") {
    filteredEvents.sort((a, b) => {
      const getMinPrice = (event: any) => {
        if (event.ticketTypes && Array.isArray(event.ticketTypes)) {
          return Math.min(...event.ticketTypes.map((t: any) => t.price || 0));
        }
        if (event.ticketTiers && Array.isArray(event.ticketTiers)) {
          return Math.min(...event.ticketTiers.map((t: any) => t.price || 0));
        }
        return event.minPrice || event.price || 0;
      };
      return getMinPrice(b) - getMinPrice(a);
    });
  } else if (sortBy === "popularity") {
    filteredEvents.sort((a, b) => {
      const popularityA = a.soldTickets || a.attendeeCount || 0;
      const popularityB = b.soldTickets || b.attendeeCount || 0;
      return popularityB - popularityA;
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Filter Bar - Sticky below header */}
      <div className={`${showMobileFilters ? "block" : "hidden md:block"}`}>
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          resultCount={filteredEvents.length}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mobile Filter Toggle + Sort Controls */}
        <div className="flex items-center justify-between mb-6 gap-4">
          {/* Mobile Filter Button */}
          <Button
            variant="outline"
            className="md:hidden flex items-center gap-2"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <SlidersHorizontal size={16} />
            {t("events.filters", "Filters")}
            {Object.keys(filters).length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                {Object.keys(filters).length}
              </span>
            )}
          </Button>

          {/* Results Count */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm text-neutral-600">
              {isLoading ? (
                <span className="flex items-center justify-center md:justify-start gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("common.loading", "Đang tải...")}
                </span>
              ) : (
                <>
                  {filteredEvents.length} {t("events.eventsFound", "sự kiện")}
                  {Object.keys(filters).length > 0 &&
                    ` ${t("events.withFilters", "với bộ lọc")}`}
                </>
              )}
            </p>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-neutral-600">
              {t("events.sortBy", "Sắp xếp")}:
            </span>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-[140px] sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">
                  {t("events.sort.popularity", "Phổ biến")}
                </SelectItem>
                <SelectItem value="date">
                  {t("events.sort.date", "Ngày")}
                </SelectItem>
                <SelectItem value="price-asc">
                  {t("events.sort.priceLowToHigh", "Giá thấp đến cao")}
                </SelectItem>
                <SelectItem value="price-desc">
                  {t("events.sort.priceHighToLow", "Giá cao đến thấp")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events Grid with loading state */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-neutral-200 rounded-lg h-64 mb-4" />
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-neutral-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300"
            key={JSON.stringify(filters)}
          >
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id || event.eventId}
                event={event}
                onClick={() =>
                  onNavigate("event-detail", String(event.id || event.eventId))
                }
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
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              {t("events.noEventsFound", "Không tìm thấy sự kiện")}
            </h3>
            <p className="text-neutral-600 mb-4">
              {t("events.tryAdjustingFilters", "Thử điều chỉnh bộ lọc của bạn")}
            </p>
            {Object.keys(filters).length > 0 && (
              <Button variant="outline" onClick={() => setFilters({})}>
                {t("events.clearFilters", "Xóa bộ lọc")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
