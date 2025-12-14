import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, MapPin, User, Clock, Share2, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { PolicyBlock } from "../components/PolicyBlock";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { HoldTimer } from "../components/HoldTimer";
import EventHighlights from "../components/event-detail/EventHighlights";
import FAQSection from "../components/event-detail/FAQSection";
import LocationMap from "../components/event-detail/LocationMap";
import ShareButtons from "../components/event-detail/ShareButtons";
import RelatedEvents from "../components/event-detail/RelatedEvents";
import EventReviewsSummary from "../components/event-detail/EventReviewsSummary";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { eventService } from "../services/eventService";
import { seatMapService } from "../services/seatMapService";
import { WishlistButton } from "../components/WishlistButton";
import { authService } from "../services/authService";
import { waitlistService } from "../services/waitlistService";
import type { CartItem } from "../types";
import { MiniCartBar } from "../components/MiniCartBar";

interface EventDetailProps {
  eventId: string;
  onNavigate: (page: string, eventId?: string) => void;
  onAddToCart: (items: CartItem[]) => void;
}

export function EventDetail({
  eventId,
  onNavigate,
  onAddToCart,
}: EventDetailProps) {
  const { t } = useTranslation();
  const isAuthenticated = authService.isAuthenticated();
  const [event, setEvent] = useState<any | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showTimer, setShowTimer] = useState(false);
  const [relatedEvents, setRelatedEvents] = useState<any[]>([]);
  const [hasSeatMap, setHasSeatMap] = useState(false);
  const [checkingSeatMap, setCheckingSeatMap] = useState(true);
  const [seatMapZones, setSeatMapZones] = useState<any[]>([]); // Store seat map zones
  const [minPrice, setMinPrice] = useState<number>(0); // Minimum ticket price
  const [isInWaitlist, setIsInWaitlist] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Helper function to get category translation key
  const getCategoryTranslationKey = (categoryName: string): string => {
    // Remove special characters and spaces, convert to camelCase for translation key
    const normalized = categoryName
      .replace(/[&\s]+/g, "") // Remove & and spaces
      .replace(/^./, (str) => str.toLowerCase()); // First char lowercase

    // Map common category names to translation keys
    const categoryMap: Record<string, string> = {
      music: "Music",
      musicconcerts: "MusicAndConcerts",
      sports: "Sports",
      sportsfitness: "Sports",
      arts: "Arts",
      artsculture: "Arts",
      food: "Food",
      fooddrink: "Food",
      business: "Business",
      businessprofessional: "Business",
      technology: "Technology",
      technologyinnovation: "Technology",
      education: "Education",
      educationlearning: "Education",
      conference: "Conference",
      health: "Health",
      healthwellness: "Health",
      entertainment: "Entertainment",
      fashion: "Fashion",
      fashionbeauty: "Fashion",
    };

    const key =
      categoryMap[normalized.toLowerCase()] || categoryName.split(/[&\s]/)[0];
    return `editEvent.category${key}`;
  };

  useEffect(() => {
    let mounted = true;
    eventService
      .getEventByIdentifier(eventId)
      .then((ev) => {
        if (mounted) setEvent(ev);
      })
      .catch(() => {
        if (mounted) setEvent(null);
      });
    return () => {
      mounted = false;
    };
  }, [eventId, refreshKey]);

  // Check if user is in waitlist
  useEffect(() => {
    if (!event?.id || !isAuthenticated) return;

    waitlistService
      .checkWaitlist(event.id)
      .then((inWaitlist) => setIsInWaitlist(inWaitlist))
      .catch(() => setIsInWaitlist(false));
  }, [event?.id, isAuthenticated]);

  // Refresh event data when component becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setRefreshKey((prev) => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Check if event has seat map and fetch zone pricing
  useEffect(() => {
    if (!event?.id) return;

    let mounted = true;
    setCheckingSeatMap(true);

    seatMapService
      .getSeatMapByEvent(event.id.toString())
      .then((seatMapData) => {
        if (mounted) {
          setHasSeatMap(true);
          // Extract zones with pricing
          if (seatMapData.zones && seatMapData.zones.length > 0) {
            setSeatMapZones(seatMapData.zones);
            // Calculate minimum price from zones
            const prices = seatMapData.zones.map((z: any) => z.zonePrice);
            setMinPrice(Math.min(...prices));
          } else if (event.ticketTiers && event.ticketTiers.length > 0) {
            // Fallback to ticket tiers
            const prices = event.ticketTiers.map((t: any) => t.price);
            setMinPrice(Math.min(...prices));
          }
        }
      })
      .catch(() => {
        if (mounted) {
          setHasSeatMap(false);
          // Use ticket tiers pricing if no seat map
          if (event.ticketTiers && event.ticketTiers.length > 0) {
            const prices = event.ticketTiers.map((t: any) => t.price);
            setMinPrice(Math.min(...prices));
          }
        }
      })
      .finally(() => {
        if (mounted) setCheckingSeatMap(false);
      });

    return () => {
      mounted = false;
    };
  }, [event?.id, event?.ticketTiers]);

  // Get related events from the same category
  useEffect(() => {
    if (event?.category) {
      eventService
        .getEvents()
        .then((events) => {
          const related = events
            .filter((e) => e.category === event.category && e.id !== event.id)
            .slice(0, 4);
          setRelatedEvents(related);
        })
        .catch(() => setRelatedEvents([]));
    }
  }, [event?.category, event?.id]);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2>{t("events.eventNotFound")}</h2>
          <Button onClick={() => onNavigate("home")} className="mt-4">
            {t("common.returnHome")}
          </Button>
        </div>
      </div>
    );
  }

  const handleQuantityChange = (tierId: string, delta: number) => {
    const tier = event.ticketTiers.find((t: any) => t.id === tierId);
    if (!tier) return;

    const currentQty = quantities[tierId] || 0;
    const newQty = Math.max(0, Math.min(tier.available, currentQty + delta));

    setQuantities({ ...quantities, [tierId]: newQty });

    if (newQty > 0 && !showTimer) {
      setShowTimer(true);
    }
  };

  const totalItems = Object.values(quantities).reduce(
    (sum, qty) => sum + qty,
    0
  );
  const subtotal = event.ticketTiers.reduce((sum: number, tier: any) => {
    return sum + tier.price * (quantities[tier.id] || 0);
  }, 0);

  const handleCheckout = () => {
    const items: CartItem[] = event.ticketTiers
      .filter((tier: any) => quantities[tier.id] > 0)
      .map((tier: any) => ({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventVenue: event.venue,
        tierId: tier.id,
        tierName: tier.name,
        price: tier.price,
        quantity: quantities[tier.id],
      }));

    onAddToCart(items);
    onNavigate("cart");
  };

  const handleJoinWaitlist = async () => {
    if (!isAuthenticated) {
      onNavigate("login");
      return;
    }

    setJoiningWaitlist(true);
    try {
      await waitlistService.joinWaitlist({
        eventId: event.id,
        requestedQuantity: 1,
      });
      setIsInWaitlist(true);
      alert(`${t("waitlist.joined")}\n${t("waitlist.notification")}`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || t("waitlist.error");
      alert(`${t("common.error")}\n${errorMsg}`);
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const eventUrl = `https://tickify.vn/events/${event.slug}`;

  return (
    <div className="min-h-screen bg-neutral-50 pb-32">
      {/* Hero Image */}
      <div className="w-full h-[400px] bg-neutral-900 relative">
        <ImageWithFallback
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover opacity-90"
        />

        {/* Action Buttons Overlay */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {isAuthenticated && (
            <WishlistButton eventId={parseInt(eventId, 10)} size="lg" />
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/90 hover:bg-white backdrop-blur-sm"
              >
                <Share2 size={16} className="mr-2" />
                {t("common.share")}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-0 shadow-xl"
              align="end"
            >
              <ShareButtons eventTitle={event.title} eventUrl={eventUrl} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <Badge className="bg-teal-500 hover:bg-teal-600">
                  {t(getCategoryTranslationKey(event.category))}
                </Badge>
                {showTimer && (
                  <HoldTimer onExpire={() => setShowTimer(false)} />
                )}
              </div>

              <h1 className="mb-6">{event.title}</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3">
                  <Calendar
                    className="text-teal-500 mt-1 flex-shrink-0"
                    size={20}
                  />
                  <div>
                    <div className="text-sm text-neutral-500">
                      {t("events.dateTime")}
                    </div>
                    <div className="text-neutral-900">
                      {formatDate(event.date)}
                    </div>
                    <div className="text-neutral-600">{event.time}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin
                    className="text-teal-500 mt-1 flex-shrink-0"
                    size={20}
                  />
                  <div>
                    <div className="text-sm text-neutral-500">
                      {t("common.venue")}
                    </div>
                    <div className="text-neutral-900">{event.venue}</div>
                    <div className="text-neutral-600">{event.city}</div>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              <div>
                <h3 className="mb-4">{t("events.aboutThisEvent")}</h3>
                <div className="text-neutral-600 leading-relaxed space-y-4 whitespace-pre-line">
                  {event.fullDescription || event.description}
                </div>
              </div>

              <Separator className="my-8" />

              {/* Organizer */}
              <div>
                <h3 className="mb-4">{t("events.organizer")}</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-teal-100 text-teal-600">
                      {event.organizerAvatar || event.organizerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-neutral-900">
                      {event.organizerName}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {t("events.eventOrganizer")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Highlights */}
            {event.highlights && (
              <EventHighlights highlights={event.highlights} />
            )}

            {/* Location Map */}
            {event.venueDetails && (
              <LocationMap
                address={event.venueDetails.fullAddress}
                latitude={event.venueDetails.latitude}
                longitude={event.venueDetails.longitude}
              />
            )}

            {/* FAQs */}
            {event.faqs && <FAQSection faqs={event.faqs} />}

            {/* Policies */}
            <PolicyBlock policies={event.policies} />

            {/* Related Events */}
            {relatedEvents.length > 0 && (
              <RelatedEvents
                currentEventId={event.id}
                relatedEvents={relatedEvents}
                onEventClick={(id) => {
                  onNavigate("event-detail", id);
                  window.scrollTo(0, 0);
                }}
              />
            )}
          </div>

          {/* Ticket Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-20">
              <h3 className="mb-6">{t("events.selectTickets")}</h3>

              {checkingSeatMap ? (
                <div className="p-6 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
                  <p className="text-sm text-neutral-600">Loading...</p>
                </div>
              ) : hasSeatMap ? (
                /* Seat Selection Button - Show when event has seat map */
                <div className="p-6 bg-gradient-to-r from-teal-50 to-green-50 border-2 border-teal-200 rounded-xl">
                  <div className="text-center mb-4">
                    <div className="text-2xl mb-2">🎫</div>
                    <div className="text-lg font-semibold text-teal-900 mb-2">
                      Choose Your Seats
                    </div>
                    <div className="text-sm text-teal-700 mb-4">
                      Select specific seats on the interactive seat map
                    </div>

                    {/* Price range */}
                    <div className="mb-4 p-3 bg-white rounded-lg">
                      <div className="text-xs text-neutral-600 mb-1">
                        Starting from
                      </div>
                      <div className="text-2xl font-bold text-teal-600">
                        {formatPrice(minPrice || 0)}
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const totalAvailable = seatMapZones.reduce(
                      (sum, zone) => sum + (zone.availableSeats || 0),
                      0
                    );
                    const isSoldOut = totalAvailable === 0;

                    if (isSoldOut) {
                      return (
                        <div className="space-y-3">
                          <div className="text-center py-2">
                            <span className="text-red-600 font-semibold">
                              {t("common.soldOut")}
                            </span>
                          </div>
                          {isInWaitlist ? (
                            <Button
                              disabled
                              className="w-full bg-neutral-400 text-white h-12 text-base font-semibold cursor-not-allowed"
                            >
                              {t("waitlist.alreadyJoined")}
                            </Button>
                          ) : (
                            <Button
                              onClick={handleJoinWaitlist}
                              disabled={joiningWaitlist}
                              className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 text-base font-semibold"
                            >
                              {joiningWaitlist ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {t("common.loading")}
                                </>
                              ) : (
                                t("events.addToWaitlist")
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Button
                        onClick={() => {
                          if (!isAuthenticated) {
                            onNavigate("login");
                            return;
                          }
                          onNavigate("seat-selection", event.id);
                          setShowTimer(true);
                        }}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 text-base font-semibold"
                      >
                        Select Seats & Book
                      </Button>
                    );
                  })()}
                </div>
              ) : (
                /* Regular Ticket Selection - Show when no seat map */
                <div className="space-y-4">
                  {event.ticketTiers.map((tier: any) => (
                    <div
                      key={tier.id}
                      className="p-4 border-2 border-neutral-200 rounded-xl hover:border-teal-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-neutral-900">
                            {tier.name}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {tier.description || t("common.generalAdmission")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-teal-600">
                            {formatPrice(tier.price)}
                          </div>
                          <div className="text-xs text-neutral-600">
                            {tier.available > 0 ? (
                              `${tier.available} ${t("common.left")}`
                            ) : (
                              <span className="text-red-600 font-medium">
                                {t("common.soldOut")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {tier.available > 0 ? (
                        <Button
                          onClick={() => {
                            if (!isAuthenticated) {
                              onNavigate("login");
                              return;
                            }
                            // Navigate to checkout with this ticket tier
                            onNavigate("checkout", event.id);
                          }}
                          className="w-full"
                        >
                          {t("common.bookNow")}
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          {isInWaitlist ? (
                            <Button
                              disabled
                              className="w-full bg-neutral-400 cursor-not-allowed"
                            >
                              {t("waitlist.alreadyJoined")}
                            </Button>
                          ) : (
                            <Button
                              onClick={handleJoinWaitlist}
                              disabled={joiningWaitlist}
                              className="w-full bg-amber-600 hover:bg-amber-700"
                            >
                              {joiningWaitlist ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {t("common.loading")}
                                </>
                              ) : (
                                t("events.addToWaitlist")
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Available ticket info for seat map events */}
              {hasSeatMap && !checkingSeatMap && seatMapZones.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="text-sm font-semibold text-neutral-700 mb-2">
                    Ticket Types (By Zone)
                  </div>
                  {seatMapZones.map((zone: any) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: zone.color || "#94a3b8" }}
                        />
                        <div>
                          <div className="text-sm font-medium text-neutral-900">
                            {zone.name}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {formatPrice(zone.zonePrice)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-neutral-600">
                        {zone.availableSeats > 0 ? (
                          `${zone.availableSeats} available`
                        ) : (
                          <span className="text-red-600 font-medium">
                            Sold out
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MiniCartBar
        itemCount={totalItems}
        subtotal={subtotal}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
