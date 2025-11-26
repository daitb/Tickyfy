import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Heart, Calendar, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Skeleton } from "../components/ui/skeleton";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useWishlist } from "../hooks/useWishlist";
import type { WishlistItem } from "../types";

interface WishlistProps {
  onNavigate: (page: string, eventId?: string) => void;
}

type TabFilter = "all" | "upcoming" | "past";
type SortOption = "date-added" | "event-date" | "price-low" | "price-high";

export function Wishlist({ onNavigate }: WishlistProps) {
  const { t } = useTranslation();
  const { items, loading, error, refresh, removeItem, removeMany } =
    useWishlist();
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-added");
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
  const [removingIds, setRemovingIds] = useState<number[]>([]);
  const [isBulkRemoving, setIsBulkRemoving] = useState(false);

  useEffect(() => {
    setSelectedEventIds((prev) =>
      prev.filter((eventId) => items.some((item) => item.eventId === eventId))
    );
  }, [items]);

  const upcomingEvents = useMemo(
    () =>
      items.filter(
        (item) => new Date(item.startDate) >= new Date()
      ),
    [items]
  );

  const pastEvents = useMemo(
    () =>
      items.filter((item) => new Date(item.startDate) < new Date()),
    [items]
  );

  const filteredEvents = useMemo(() => {
    switch (activeTab) {
      case "upcoming":
        return upcomingEvents;
      case "past":
        return pastEvents;
      default:
        return items;
    }
  }, [activeTab, items, upcomingEvents, pastEvents]);

  const displayEvents = useMemo(() => {
    const sorted = [...filteredEvents];
    switch (sortBy) {
      case "event-date":
        return sorted.sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      case "price-low":
        return sorted.sort((a, b) => a.minPrice - b.minPrice);
      case "price-high":
        return sorted.sort((a, b) => b.minPrice - a.minPrice);
      default:
        return sorted.sort(
          (a, b) =>
            new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        );
    }
  }, [filteredEvents, sortBy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPriceRange = (item: WishlistItem) => {
    if (item.minPrice <= 0) {
      return t("pages.wishlist.priceTbd");
    }

    const formattedMin = formatCurrency(item.minPrice);
    if (item.minPrice === item.maxPrice) {
      return formattedMin;
    }

    const formattedMax = formatCurrency(item.maxPrice);
    return `${formattedMin} - ${formattedMax}`;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  const getEventStatus = (item: WishlistItem) => {
    if (item.availableTickets > 0 && item.status === "Published") {
      return { label: "onSale" as const, variant: "default" as const };
    }

    if (item.status === "Published") {
      return { label: "soldOut" as const, variant: "destructive" as const };
    }

    return { label: "comingSoon" as const, variant: "secondary" as const };
  };

  const toggleSelection = (eventId: number) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId)
      ? prev.filter((id) => id !== eventId)
      : [...prev, eventId]
    );
  };

  const handleRemoveFromWishlist = async (eventId: number) => {
    setRemovingIds((prev) => [...prev, eventId]);
    try {
      await removeItem(eventId);
      toast.success(t("pages.wishlist.removeSuccess"));
      setSelectedEventIds((prev) => prev.filter((id) => id !== eventId));
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err.message || "Failed to remove item";
      toast.error(message);
    } finally {
      setRemovingIds((prev) => prev.filter((id) => id !== eventId));
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedEventIds.length === 0) return;
    setIsBulkRemoving(true);
    try {
      await removeMany(selectedEventIds);
      toast.success(t("pages.wishlist.bulkRemoveSuccess"));
      setSelectedEventIds([]);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err.message ||
        "Failed to remove selected items";
      toast.error(message);
      await refresh();
    } finally {
      setIsBulkRemoving(false);
    }
  };

  const isEmptyState = !loading && !error && items.length === 0;
  const isRemoving = (eventId: number) => removingIds.includes(eventId);

  const renderLoadingState = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100"
        >
          <Skeleton className="h-48 w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderErrorState = () => (
    <div className="bg-white border border-red-100 text-red-600 rounded-2xl p-8 text-center space-y-4">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertCircle size={28} />
      </div>
      <div>
        <h2 className="text-xl font-semibold">{t("pages.wishlist.errorTitle")}</h2>
        <p className="text-neutral-600 mt-2">
          {t("pages.wishlist.errorMessage")}
        </p>
      </div>
      <Button onClick={refresh} variant="outline">
        {t("pages.wishlist.retry")}
      </Button>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-neutral-100 mb-6">
        <Heart size={48} className="text-neutral-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-neutral-900 mb-2">{t("pages.wishlist.empty")}</h2>
      <p className="text-neutral-600 mb-6">
        {t("pages.wishlist.emptyMessage")}
      </p>
      <Button onClick={() => onNavigate("listing")}>
        {t("pages.wishlist.exploreEvents")}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">
            {t("pages.wishlist.title")}
          </h1>
          <p className="text-neutral-600">{t("pages.wishlist.subtitle")}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabFilter)}>
            <TabsList>
              <TabsTrigger value="all">
                {t("pages.wishlist.all")} ({items.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                {t("pages.wishlist.upcoming")} ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                {t("pages.wishlist.past")} ({pastEvents.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">
              {t("pages.wishlist.sortBy")}
            </span>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-added">
                  {t("pages.wishlist.dateAdded")}
                </SelectItem>
                <SelectItem value="event-date">
                  {t("pages.wishlist.eventDate")}
                </SelectItem>
                <SelectItem value="price-low">
                  {t("pages.wishlist.priceLowToHigh")}
                </SelectItem>
                <SelectItem value="price-high">
                  {t("pages.wishlist.priceHighToLow")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && renderLoadingState()}
        {!loading && error && renderErrorState()}
        {!loading && !error && isEmptyState && renderEmptyState()}

        {!loading && !error && !isEmptyState && displayEvents.length === 0 && (
          <div className="text-center text-neutral-500 py-12">
            {t("pages.wishlist.noMatches")}
          </div>
        )}

        {!loading && !error && !isEmptyState && displayEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {displayEvents.map((event) => {
              const status = getEventStatus(event);
              const isSelected = selectedEventIds.includes(event.eventId);
              const removing = isRemoving(event.eventId);

              return (
                <div
                  key={event.wishlistId}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-neutral-100"
                >
                  <div className="absolute top-4 left-4 z-20">
                    <Checkbox
                      checked={isSelected}
                      disabled={removing || isBulkRemoving}
                      onCheckedChange={() => toggleSelection(event.eventId)}
                      className="bg-white shadow-lg"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveFromWishlist(event.eventId)}
                    disabled={removing}
                    className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-red-50 transition-colors disabled:opacity-60"
                    aria-label={t("pages.wishlist.removeFromWishlist")}
                  >
                    {removing ? (
                      <Loader2 size={18} className="animate-spin text-red-500" />
                    ) : (
                      <Heart size={20} className="text-red-500 fill-red-500" />
                    )}
                  </button>

                  <div
                    className="aspect-[16/9] overflow-hidden bg-neutral-100 cursor-pointer"
                    onClick={() =>
                      onNavigate("event-detail", event.eventId.toString())
                    }
                  >
                    <ImageWithFallback
                      src={event.imageUrl || ""}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {event.category && (
                      <div className="absolute top-4 left-16">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                          {event.category}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3
                      className="mb-3 line-clamp-2 min-h-[3em] cursor-pointer hover:text-teal-600 transition-colors"
                      onClick={() =>
                        onNavigate("event-detail", event.eventId.toString())
                      }
                    >
                      {event.title}
                    </h3>

                    <div className="space-y-2 text-neutral-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span className="text-sm">{formatDate(event.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span className="text-sm">
                          {event.city || event.venue}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-sm text-neutral-500">
                          {t("events.from")}
                        </span>
                        <div className="text-teal-600">
                          {formatPriceRange(event)}
                        </div>
                      </div>
                      <Badge variant={status.variant}>
                        {t(`pages.wishlist.${status.label}`)}
                      </Badge>
                    </div>

                    <Button
                      className="w-full"
                      variant={status.label === "onSale" ? "default" : "outline"}
                      onClick={() =>
                        onNavigate("event-detail", event.eventId.toString())
                      }
                    >
                      {status.label === "onSale"
                        ? t("pages.wishlist.viewEvent")
                        : t("pages.wishlist.notifyMe")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && selectedEventIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-full shadow-2xl px-6 py-4 flex flex-wrap items-center gap-4 border border-neutral-200">
            <span className="text-neutral-900 font-medium">
              {t("pages.wishlist.selectedCount", { count: selectedEventIds.length })}
            </span>
            <Button
              variant="destructive"
              onClick={handleRemoveSelected}
              disabled={isBulkRemoving}
              className="rounded-full"
            >
              {isBulkRemoving
                ? t("common.loading")
                : t("pages.wishlist.removeSelected")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSelectedEventIds([])}
              className="rounded-full"
            >
              {t("common.cancel")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
