import React, { useState, useEffect } from "react";
import { HeroSlider } from "../components/HeroSlider";
import { EventCard } from "../components/EventCard";
import { EventCardSkeletonGrid } from "../components/skeletons/EventCardSkeleton";
import { Badge } from "../components/ui/badge";
import { ArrowRight, TrendingUp, Star, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { eventService } from "../services/eventService";
import type { Category } from "../types";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface HomeProps {
  onNavigate: (page: string, eventId?: string) => void;
  isSearchOpen?: boolean;
}

export function Home({ onNavigate, isSearchOpen = false }: HomeProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    "all"
  );
  const [events, setEvents] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [trendingEvents, setTrendingEvents] = useState<any[]>([]);
  const [specialEvents, setSpecialEvents] = useState<any[]>([]);
  const [upcomingEventsList, setUpcomingEventsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      eventService.getEvents(),
      eventService.getFeaturedEvents(4),
      eventService.getTrendingEvents(3),
      eventService.getUpcomingEvents(20),
    ])
      .then(([allEvents, featured, trending, upcoming]) => {
        setEvents(allEvents || []);
        const cats = Array.from(
          new Set((allEvents || []).map((e: any) => e.category).filter(Boolean))
        );
        setAvailableCategories(cats);
        setTrendingEvents(trending || []);
        setSpecialEvents(featured || []);
        setUpcomingEventsList(upcoming || []);
      })
      .catch((error: any) => {
        setEvents([]);
        setAvailableCategories([]);
        setTrendingEvents([]);
        setSpecialEvents([]);
        setUpcomingEventsList([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleViewDetails = (eventId: string) => {
    onNavigate("event-detail", eventId);
  };

  const filteredEvents =
    selectedCategory === "all"
      ? upcomingEventsList
      : upcomingEventsList.filter((e) => e.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Slider - pauses when search is open */}
      <HeroSlider onViewDetails={handleViewDetails} isPaused={isSearchOpen} />

      {/* Categories Filter */}
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <Badge
              variant={selectedCategory === "all" ? "default" : "secondary"}
              className={`cursor-pointer whitespace-nowrap ${
                selectedCategory === "all"
                  ? "bg-teal-500 hover:bg-teal-600 text-white"
                  : "bg-neutral-100 hover:bg-neutral-200"
              }`}
              onClick={() => setSelectedCategory("all")}
            >
              {t("home.categories.all")}
            </Badge>
            {availableCategories.map((category) => (
              <Badge
                key={category}
                variant={
                  selectedCategory === category ? "default" : "secondary"
                }
                className={`cursor-pointer whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-teal-500 hover:bg-teal-600 text-white"
                    : "bg-neutral-100 hover:bg-neutral-200"
                }`}
                onClick={() =>
                  setSelectedCategory(category as Category | "all")
                }
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Special Events */}
      <section className="py-12 bg-gradient-to-br from-teal-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Star className="text-teal-500" size={28} />
              <h2 className="text-neutral-900">{t("home.specialEvents")}</h2>
            </div>
            <Button
              variant="ghost"
              onClick={() => onNavigate("listing")}
              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
            >
              {t("common.viewAll")}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>

          {isLoading ? (
            <EventCardSkeletonGrid count={4} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {specialEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => onNavigate("event-detail", event.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-teal-500" size={28} />
              <h2 className="text-neutral-900">{t("home.trendingEvents")}</h2>
            </div>
          </div>

          {isLoading ? (
            <EventCardSkeletonGrid count={3} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => onNavigate("event-detail", event.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-12 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-neutral-900">
              {selectedCategory === "all"
                ? t("home.upcomingEvents")
                : `${selectedCategory} ${t("home.events")}`}
            </h2>
            <Button
              variant="ghost"
              onClick={() => onNavigate("listing")}
              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
            >
              {t("common.viewAll")}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>

          {isLoading ? (
            <EventCardSkeletonGrid count={6} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => onNavigate("event-detail", event.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
