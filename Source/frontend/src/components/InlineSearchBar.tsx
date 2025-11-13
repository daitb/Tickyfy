import { useState, useRef, useEffect } from "react";
import {
  Search,
  TrendingUp,
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
} from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { mockEvents, categories, cities } from "../mockData";
import { Category } from "../types";

interface InlineSearchBarProps {
  onEventClick?: (eventId: string) => void;
  onCategoryClick?: (category: Category) => void;
  onCityClick?: (city: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

const trendingKeywords = [
  "yconcert",
  "gdragon",
  "drama",
  "ntpmm",
  "summer festival",
];

const categoryIcons: Record<Category, any> = {
  Music: Music,
  Theater: Theater,
  Sports: Trophy,
  Conference: Briefcase,
  Arts: Palette,
  "Food & Drink": UtensilsCrossed,
  Other: Briefcase,
};

export function InlineSearchBar({
  onEventClick,
  onCategoryClick,
  onCityClick,
  onOpenChange,
}: InlineSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("category");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

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

  // Debounced search
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsLoading(true);

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce 300ms
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery]);

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

  const handleTrendingClick = (keyword: string) => {
    setSearchQuery(keyword);
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

  // Filter events based on search query
  const filteredEvents =
    searchQuery.trim().length >= 2
      ? mockEvents
          .filter(
            (event) =>
              event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              event.category
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              event.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
              event.venue.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 4)
      : mockEvents.slice(0, 4);

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

  const showResults = searchQuery.trim().length >= 2;

  return (
    <>
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
            placeholder="What are you looking for today?"
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
            className="absolute top-full mt-2 left-0 right-0 bg-neutral-900 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            style={{ maxHeight: "500px", overflowY: "auto", zIndex: 60 }}
          >
            <div className="p-6">
              {!showResults ? (
                <>
                  {/* Trending Keywords */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="text-teal-400" size={18} />
                      <h3 className="text-white">Trending Search</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trendingKeywords.map((keyword, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-neutral-800 hover:bg-teal-500/20 hover:text-teal-400 text-neutral-300 cursor-pointer px-3 py-1.5 transition-colors"
                          onClick={() => handleTrendingClick(keyword)}
                        >
                          {keyword}
                          <TrendingUp
                            size={12}
                            className="ml-1 text-teal-400"
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Explore Tabs */}
                  <div className="mb-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-4 bg-neutral-800">
                        <TabsTrigger
                          value="category"
                          className="data-[state=active]:bg-teal-500 data-[state=active]:text-white"
                        >
                          Explore by Category
                        </TabsTrigger>
                        <TabsTrigger
                          value="city"
                          className="data-[state=active]:bg-teal-500 data-[state=active]:text-white"
                        >
                          Explore by City
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
                                className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-950 p-4 text-left transition-all hover:scale-105 hover:shadow-xl"
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10">
                                  <Icon
                                    className="text-teal-400 mb-2"
                                    size={24}
                                  />
                                  <p className="text-white">{category}</p>
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
                              className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-950 p-4 text-left transition-all hover:scale-105 hover:shadow-xl"
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="relative z-10">
                                <MapPin
                                  className="text-teal-400 mb-2"
                                  size={24}
                                />
                                <p className="text-white">{city}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Suggestions */}
                  <div>
                    <h3 className="text-white mb-3">Suggestions for You</h3>
                    <div className="space-y-3">
                      {filteredEvents.slice(0, 3).map((event) => {
                        const lowestPrice = Math.min(
                          ...event.ticketTiers.map((tier) => tier.price)
                        );
                        return (
                          <button
                            key={event.id}
                            onClick={() => handleEventCardClick(event.id)}
                            className="group w-full flex gap-3 p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-all"
                          >
                            <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="text-white mb-1 truncate group-hover:text-teal-400 transition-colors text-sm">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-neutral-400">
                                <Calendar size={12} />
                                <span>{formatDate(event.date)}</span>
                              </div>
                              <p className="text-teal-400 text-sm mt-1">
                                From {formatPrice(lowestPrice)}
                              </p>
                            </div>
                            <ArrowRight
                              size={16}
                              className="text-neutral-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all self-center"
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
                    <h3 className="text-white">Search Results</h3>
                    <Badge
                      variant="secondary"
                      className="bg-teal-500/20 text-teal-400"
                    >
                      {filteredEvents.length} result
                      {filteredEvents.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  {filteredEvents.length > 0 ? (
                    <div className="space-y-3">
                      {filteredEvents.map((event) => {
                        const lowestPrice = Math.min(
                          ...event.ticketTiers.map((tier) => tier.price)
                        );
                        const isSoldOut = event.ticketTiers.every(
                          (tier) => tier.available === 0
                        );

                        return (
                          <button
                            key={event.id}
                            onClick={() => handleEventCardClick(event.id)}
                            className="group w-full flex gap-3 p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-all"
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
                                    Sold Out
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="text-white mb-1 truncate group-hover:text-teal-400 transition-colors">
                                {event.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-400">
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  <span>{formatDate(event.date)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin size={14} />
                                  <span className="truncate">{event.city}</span>
                                </div>
                              </div>
                              <p className="text-teal-400 mt-1">
                                From {formatPrice(lowestPrice)}
                              </p>
                            </div>
                            <ArrowRight
                              size={16}
                              className="text-neutral-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all self-center"
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                        <Search className="text-neutral-600" size={28} />
                      </div>
                      <h4 className="text-white mb-2">No events found</h4>
                      <p className="text-sm text-neutral-400 mb-4">
                        Try searching with different keywords or explore by
                        category
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                        className="border-teal-500 text-teal-400 hover:bg-teal-500/20"
                      >
                        Clear search
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlay - positioned behind the dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 animate-in fade-in duration-200"
          style={{ top: 0 }}
        />
      )}
    </>
  );
}
