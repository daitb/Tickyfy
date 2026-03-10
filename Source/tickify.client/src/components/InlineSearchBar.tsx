import { useState, useRef, useEffect, useMemo } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { useTranslation } from "react-i18next";
import {
  Search,
  MapPin,
  Calendar,
  ArrowRight,
  Music,
  Theater,
  Trophy,
  Briefcase,
  Palette,
  UtensilsCrossed,
  X,
  Sparkles,
} from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { categories, cities } from "../mockData";
import type { Category, Event as EventType } from "../types";
import { eventService } from "../services/eventService";

interface InlineSearchBarProps {
  onEventClick?: (eventId: string) => void;
  onCategoryClick?: (category: Category) => void;
  onCityClick?: (city: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

const categoryIcons = {
  Music: Music,
  Theater: Theater,
  Sports: Trophy,
  Conference: Briefcase,
  Arts: Palette,
  "Food & Drink": UtensilsCrossed,
  Other: Sparkles,
} as const;

export function InlineSearchBar({
  onEventClick,
  onCategoryClick,
  onCityClick,
  onOpenChange,
}: InlineSearchBarProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("category");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<EventType[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<EventType[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Sử dụng useDebounce hook để debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load suggested events on mount
  useEffect(() => {
    eventService.getFeaturedEvents(3)
      .then(events => setSuggestedEvents(events))
      .catch(() => setSuggestedEvents([]));
  }, []);

  // Notify parent when open state changes
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Search API when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      setIsLoading(true);
      eventService.searchEvents(debouncedSearchQuery)
        .then(events => {
          setSearchResults(events);
          setIsLoading(false);
        })
        .catch(() => {
          setSearchResults([]);
          setIsLoading(false);
        });
    } else {
      setSearchResults([]);
      setIsLoading(false);
    }
  }, [debouncedSearchQuery]);

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (!isOpen) setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleCategoryCardClick = (category: Category) => {
    if (onCategoryClick) {
      onCategoryClick(category);
      setIsOpen(false);
    }
  };

  const handleCityCardClick = (city: string) => {
    if (onCityClick) {
      onCityClick(city);
      setIsOpen(false);
    }
  };

  const handleEventCardClick = (eventId: string) => {
    if (onEventClick) {
      onEventClick(eventId);
      setIsOpen(false);
    }
  };

  const showResults = debouncedSearchQuery.trim().length >= 2;

  // Use search results or suggested events
  const filteredEvents = showResults ? searchResults.slice(0, 4) : suggestedEvents;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <>
      {/* Overlay - positioned behind the dropdown - Only on mobile */}
      {isOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 z-[45] animate-in fade-in duration-200 md:hidden"
          style={{ top: 0 }}
        />
      )}

      {/* Search Input */}
      <div ref={containerRef} className="relative w-full max-w-2xl">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 z-10"
            size={20}
          />
          <Input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={handleFocus}
            placeholder={t("search.placeholder")}
            className="pl-12 pr-12 h-12 bg-white border-none rounded-full shadow-sm"
          />
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {isOpen && (
            <button
              onClick={handleClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors md:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Dropdown Panel */}
        {isOpen && (
          <div
            className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[60]"
            style={{ maxHeight: "500px", overflowY: "auto" }}
          >
            <div className="p-6">
              {!showResults ? (
                <>
                  {/* Explore Tabs */}
                  <div className="mb-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-4 bg-neutral-100">
                        <TabsTrigger
                          value="category"
                          className="data-[state=active]:bg-teal-500 data-[state=active]:text-white"
                        >
                          {t("search.exploreByCategory")}
                        </TabsTrigger>
                        <TabsTrigger
                          value="city"
                          className="data-[state=active]:bg-teal-500 data-[state=active]:text-white"
                        >
                          {t("search.exploreByCity")}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="category" className="mt-0">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {categories.map((category) => {
                            const Icon = categoryIcons[category];
                            return (
                              <button
                                key={category}
                                onClick={() =>
                                  handleCategoryCardClick(category)
                                }
                                className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 p-4 text-left transition-all hover:scale-105 hover:shadow-lg border border-teal-200"
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10">
                                  <Icon
                                    className="text-teal-600 mb-2"
                                    size={24}
                                  />
                                  <p className="text-neutral-800 font-medium">{t(`categories.${category}`)}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="city" className="mt-0">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {cities.map((city) => (
                            <button
                              key={city}
                              onClick={() => handleCityCardClick(city)}
                              className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 p-4 text-left transition-all hover:scale-105 hover:shadow-lg border border-teal-200"
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="relative z-10">
                                <MapPin
                                  className="text-teal-600 mb-2"
                                  size={24}
                                />
                                <p className="text-neutral-800 font-medium">{city}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Suggestions */}
                  <div>
                    <h3 className="text-neutral-900 font-semibold mb-3">{t("search.suggestionsForYou")}</h3>
                    <div className="space-y-3">
                      {suggestedEvents.slice(0, 3).map((event) => {
                        const lowestPrice = event.ticketTiers.length > 0 
                          ? Math.min(...event.ticketTiers.map((tier) => tier.price))
                          : 0;
                        return (
                          <button
                            key={event.id}
                            onClick={() => handleEventCardClick(event.id)}
                            className="group w-full flex gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-teal-50 transition-all border border-neutral-200 hover:border-teal-300"
                          >
                            <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="text-neutral-900 mb-1 truncate group-hover:text-teal-600 transition-colors text-sm font-medium">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-neutral-500">
                                <Calendar size={12} />
                                <span>{formatDate(event.date)}</span>
                              </div>
                              <p className="text-teal-600 text-sm mt-1 font-semibold">
                                {t("search.from")} {formatPrice(lowestPrice)}
                              </p>
                            </div>
                            <ArrowRight
                              size={16}
                              className="text-neutral-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all self-center"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* Search Results */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-neutral-900 font-semibold">{t("search.searchResults")}</h3>
                    <Badge
                      variant="secondary"
                      className="bg-teal-100 text-teal-700 border border-teal-200"
                    >
                      {searchResults.length} {searchResults.length !== 1 ? t("search.results") : t("search.result")}
                    </Badge>
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="space-y-3">
                      {searchResults.slice(0, 4).map((event) => {
                        const lowestPrice = event.ticketTiers.length > 0
                          ? Math.min(...event.ticketTiers.map((tier) => tier.price))
                          : 0;
                        const isSoldOut = event.ticketTiers.every(
                          (tier) => tier.available === 0
                        );

                        return (
                          <button
                            key={event.id}
                            onClick={() => handleEventCardClick(event.id)}
                            className="group w-full flex gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-teal-50 transition-all border border-neutral-200 hover:border-teal-300"
                          >
                            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              {isSoldOut && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                  <Badge className="bg-red-500 text-white text-xs">
                                    {t("search.soldOut")}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="text-neutral-900 mb-1 truncate group-hover:text-teal-600 transition-colors font-medium">
                                {event.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  <span>{formatDate(event.date)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin size={14} />
                                  <span className="truncate">{event.city}</span>
                                </div>
                              </div>
                              <p className="text-teal-600 mt-1 font-semibold">
                                {t("search.from")} {formatPrice(lowestPrice)}
                              </p>
                            </div>
                            <ArrowRight
                              size={16}
                              className="text-neutral-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all self-center"
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                        <Search className="text-neutral-400" size={28} />
                      </div>
                      <h4 className="text-neutral-900 font-semibold mb-2">{t("search.noEventsFound")}</h4>
                      <p className="text-sm text-neutral-600 mb-4">
                        {t("search.tryDifferentKeywords")}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                        className="border-teal-500 text-teal-600 hover:bg-teal-50"
                      >
                        {t("search.clearSearch")}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
