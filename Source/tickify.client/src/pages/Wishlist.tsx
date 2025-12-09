import { useMemo, useState } from "react";
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
import { Skeleton } from "../components/ui/skeleton";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useWishlist } from "../hooks/useWishlist";
import { useWishlistContext } from "../contexts/WishlistContext";

type TabFilter = "all" | "upcoming" | "past";
type SortOption = "date-added" | "event-date" | "price-low" | "price-high";

interface WishlistProps {
  onNavigate: (page: string, eventId?: string) => void;
}

export function Wishlist({ onNavigate }: WishlistProps) {
  const { t } = useTranslation();
  const { items, loading, error, refresh, removeItem } = useWishlist();
  const { refreshWishlistStatus } = useWishlistContext();
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-added");
  const [removingEventIds, setRemovingEventIds] = useState<number[]>([]);

  const upcomingEvents = useMemo(
    () => items.filter((item) => new Date(item.startDate) >= new Date()),
    [items]
  );

  const pastEvents = useMemo(
    () => items.filter((item) => new Date(item.startDate) < new Date()),
    [items]
  );

  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case "upcoming":
        return upcomingEvents;
      case "past":
        return pastEvents;
      default:
        return items;
    }
  }, [activeTab, items, upcomingEvents, pastEvents]);

  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
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
  }, [filteredItems, sortBy]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  const formatPriceRange = (min: number, max: number) => {
    if (min <= 0) return t("pages.wishlist.priceTbd");
    const formattedMin = formatCurrency(min);
    if (min === max) return formattedMin;
    return `${formattedMin} - ${formatCurrency(max)}`;
  };

  const getEventStatus = (status: string, availableTickets: number) => {
    if (status === "Published" && availableTickets > 0) {
      return { label: "onSale" as const, variant: "default" as const };
    }
    if (status === "Published") {
      return { label: "soldOut" as const, variant: "destructive" as const };
    }
    return { label: "comingSoon" as const, variant: "secondary" as const };
  };

  const handleRemove = async (eventId: number) => {
    setRemovingEventIds((prev) => [...prev, eventId]);
    try {
      await removeItem(eventId);
      // Sync with WishlistContext to update all components (EventCard, Header, etc.)
      await refreshWishlistStatus();
      toast.success(t("pages.wishlist.removeSuccess"));
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err.message ||
          t("pages.wishlist.errorMessage")
      );
      await refresh();
      // Also refresh context on error to ensure consistency
      await refreshWishlistStatus();
    } finally {
      setRemovingEventIds((prev) => prev.filter((id) => id !== eventId));
    }
  };

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
        <h2 className="text-xl font-semibold">
          {t("pages.wishlist.errorTitle")}
        </h2>
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
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">
            {t("pages.wishlist.title")}
          </h1>
          <p className="text-neutral-600">{t("pages.wishlist.subtitle")}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        {!loading && !error && items.length === 0 && renderEmptyState()}

        {!loading && !error && items.length > 0 && sortedItems.length === 0 && (
          <div className="text-center text-neutral-500 py-12">
            {t("pages.wishlist.noMatches")}
          </div>
        )}

        {!loading && !error && !!items.length && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map((item) => {
              const status = getEventStatus(item.status, item.availableTickets);
              const isRemoving = removingEventIds.includes(item.eventId);

              return (
                <article
                  key={item.wishlistId}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => handleRemove(item.eventId)}
                    disabled={isRemoving}
                    aria-label={t("pages.wishlist.removeFromWishlist")}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-red-50 transition disabled:opacity-60"
                  >
                    {isRemoving ? (
                      <Loader2 size={18} className="animate-spin text-red-500" />
                    ) : (
                      <Heart size={18} className="text-red-500 fill-red-500" />
                    )}
                  </button>

                  <div
                    className="aspect-[16/9] overflow-hidden bg-neutral-100 cursor-pointer relative"
                    onClick={() =>
                      onNavigate("event-detail", item.eventId.toString())
                    }
                  >
                    <ImageWithFallback
                      src={item.imageUrl || ""}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {item.category && (
                      <Badge className="absolute top-4 left-4 bg-neutral-100 text-neutral-900 shadow-sm">
                        {item.category}
                      </Badge>
                    )}
                  </div>

                  <div className="p-4 space-y-4">
                    <h3
                      className="line-clamp-2 text-lg font-semibold cursor-pointer hover:text-teal-600 transition"
                      onClick={() =>
                        onNavigate("event-detail", item.eventId.toString())
                      }
                    >
                      {item.title}
                    </h3>

                    <div className="space-y-2 text-sm text-neutral-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{formatDate(item.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{item.city || item.venue}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-neutral-500">
                          {t("events.from")}
                        </span>
                        <div className="text-teal-600 font-semibold">
                          {formatPriceRange(item.minPrice, item.maxPrice)}
                        </div>
                      </div>
                      <Badge variant={status.variant}>
                        {t(`pages.wishlist.${status.label}`)}
                      </Badge>
                    </div>

                    <Button
                      variant={status.label === "onSale" ? "default" : "outline"}
                      className="w-full"
                      onClick={() =>
                        onNavigate("event-detail", item.eventId.toString())
                      }
                    >
                      {status.label === "onSale"
                        ? t("pages.wishlist.viewEvent")
                        : t("pages.wishlist.notifyMe")}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
