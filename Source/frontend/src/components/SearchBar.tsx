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
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { mockEvents, categories, cities } from "../mockData";
import { Category } from "../types";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onEventClick?: (eventId: string) => void;
  onCategoryClick?: (category: Category) => void;
  onCityClick?: (city: string) => void;
  placeholder?: string;
  className?: string;
}

const trendingKeywords = [
  { keyword: "yconcert", trend: "up" },
  { keyword: "gdragon", trend: "up" },
  { keyword: "ntpmm", trend: "up" },
  { keyword: "summer festival", trend: "up" },
  { keyword: "hanoi concert", trend: "up" },
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

export function SearchBar({
  value,
  onChange,
  onSearch,
  onEventClick,
  onCategoryClick,
  onCityClick,
  placeholder = "What are you looking for today?",
  className = "",
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState("category");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
      setIsFocused(false);
    }
  };

  // Filter events based on search value
  const filteredEvents = value.trim()
    ? mockEvents
        .filter(
          (event) =>
            event.title.toLowerCase().includes(value.toLowerCase()) ||
            event.category.toLowerCase().includes(value.toLowerCase()) ||
            event.city.toLowerCase().includes(value.toLowerCase()) ||
            event.venue.toLowerCase().includes(value.toLowerCase())
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

  const handleTrendingClick = (keyword: string) => {
    onChange(keyword);
    onSearch();
    setIsFocused(false);
  };

  const handleCategoryCardClick = (category: Category) => {
    if (onCategoryClick) {
      onCategoryClick(category);
      setIsFocused(false);
    }
  };

  const handleCityCardClick = (city: string) => {
    if (onCityClick) {
      onCityClick(city);
      setIsFocused(false);
    }
  };

  const handleEventCardClick = (eventId: string) => {
    if (onEventClick) {
      onEventClick(eventId);
      setIsFocused(false);
    }
  };

  const showDropdown = isFocused || value.trim().length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 z-10"
            size={20}
          />
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className="pl-10 h-12 bg-neutral-50 border-neutral-200"
          />
        </div>
        <Button
          onClick={() => {
            onSearch();
            setIsFocused(false);
          }}
          className="h-12 px-6 bg-orange-500 hover:bg-orange-600"
        >
          Search
        </Button>
      </div>

      {/* Dropdown Suggestions */}
      {showDropdown && (
        <div
          className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          <div className="p-4 md:p-6">
            {/* Trending Keywords */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="text-orange-500" size={18} />
                <h3 className="text-neutral-900">Trending Search</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingKeywords.map((item, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-neutral-100 hover:bg-orange-50 hover:text-orange-600 cursor-pointer px-3 py-1.5 transition-colors"
                    onClick={() => handleTrendingClick(item.keyword)}
                  >
                    {item.keyword}
                    <TrendingUp size={12} className="ml-1 text-orange-500" />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Explore Tabs */}
            <div className="mb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="category">
                    Explore by Category
                  </TabsTrigger>
                  <TabsTrigger value="city">Explore by City</TabsTrigger>
                </TabsList>

                <TabsContent value="category" className="mt-0">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.map((category) => {
                      const Icon = categoryIcons[category];
                      return (
                        <button
                          key={category}
                          onClick={() => handleCategoryCardClick(category)}
                          className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900 p-4 text-left transition-all hover:scale-105 hover:shadow-xl"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative z-10">
                            <Icon className="text-orange-500 mb-2" size={24} />
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
                        className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900 p-4 text-left transition-all hover:scale-105 hover:shadow-xl"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                          <MapPin className="text-orange-500 mb-2" size={24} />
                          <p className="text-white">{city}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Suggestions for You */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-neutral-900">
                  {value.trim() ? "Search Results" : "Suggestions for You"}
                </h3>
                {value.trim() && (
                  <Badge
                    variant="secondary"
                    className="bg-orange-50 text-orange-600"
                  >
                    {filteredEvents.length} result
                    {filteredEvents.length !== 1 ? "s" : ""}
                  </Badge>
                )}
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
                        className="group w-full flex gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-all hover:shadow-md"
                      >
                        {/* Event Image */}
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

                        {/* Event Info */}
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="text-neutral-900 mb-1 truncate group-hover:text-orange-600 transition-colors">
                            {event.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin size={14} />
                              <span className="truncate">{event.city}</span>
                            </div>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <p className="text-orange-600">
                              From {formatPrice(lowestPrice)}
                            </p>
                            <ArrowRight
                              size={16}
                              className="text-neutral-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : value.trim() ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Search className="text-neutral-400" size={28} />
                  </div>
                  <h4 className="text-neutral-900 mb-2">No events found</h4>
                  <p className="text-sm text-neutral-600 mb-4">
                    Try searching with different keywords or explore by category
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChange("")}
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    Clear search
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
