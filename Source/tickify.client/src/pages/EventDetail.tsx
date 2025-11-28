import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  MapPin,
  User,
  Minus,
  Plus,
  Clock,
  Share2,
  Ticket,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { MiniCartBar } from "../components/MiniCartBar";
import { HoldTimer } from "../components/HoldTimer";
import { PolicyBlock } from "../components/PolicyBlock";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import EventHighlights from "../components/event-detail/EventHighlights";
import FAQSection from "../components/event-detail/FAQSection";
import LocationMap from "../components/event-detail/LocationMap";
import ShareButtons from "../components/event-detail/ShareButtons";
import RelatedEvents from "../components/event-detail/RelatedEvents";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { eventService } from "../services/eventService";
import { useBooking } from "../contexts/BookingContext";
import { toast } from "sonner";

interface EventDetailProps {
  eventId: string;
  onNavigate: (page: string, eventId?: string) => void;
  onAddToCart?: (items: any[]) => void; // Optional, not used in seat selection flow
}

export function EventDetail({
  eventId,
  onNavigate,
  onAddToCart,
}: EventDetailProps) {
  const { t } = useTranslation();
  const { setEventInfo, setTicketType } = useBooking();
  const [event, setEvent] = useState<any | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [relatedEvents, setRelatedEvents] = useState<any[]>([]);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    if (!eventId) {
      setError("Event ID is required");
      setIsLoading(false);
      return;
    }

    eventService
      .getEventByIdentifier(eventId)
      .then((ev) => {
        if (mounted) {
          setEvent(ev);
          setError(null);
        }
      })
      .catch((err) => {
        console.error("Error loading event:", err);
        if (mounted) {
          setEvent(null);
          setError(err.message || "Failed to load event");
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [eventId]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event || error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">
            {error || t("events.eventNotFound")}
          </h2>
          <p className="text-neutral-600 mb-4">
            {error
              ? `Event ID: ${eventId}`
              : "The event you're looking for doesn't exist."}
          </p>
          <Button onClick={() => onNavigate("home")} className="mt-4">
            {t("common.returnHome")}
          </Button>
        </div>
      </div>
    );
  }

  // Quantity selection removed - users will select seats instead
  // All pricing and checkout happens after seat selection in SeatSelection page

  // NEW: Handle booking flow with seat selection
  const handleBookTickets = async (tier: any) => {
    try {
      // Validate event has required data
      if (!event.id || !tier.id) {
        toast.error("Invalid event or ticket data");
        return;
      }

      // Initialize booking context first
      setEventInfo(
        parseInt(event.id),
        event.title,
        `${formatDate(event.date)} • ${event.time}`,
        event.venue,
        event.image
      );

      setTicketType(parseInt(tier.id), tier.name, tier.price);

      // Check if event has seat map/seats available (non-blocking)
      try {
        const { seatService } = await import("../services/seatService");
        const seats = await seatService.getSeatsByEvent(parseInt(event.id));

        if (!seats || seats.length === 0) {
          toast.warning(
            "This event may not have seat selection available. You will be redirected to seat selection page."
          );
        }
      } catch (seatError: any) {
        // If seat service fails, still allow navigation but show warning
        console.warn("Could not verify seat availability:", seatError);
        toast.warning("Seat selection may not be available for this event.");
      }

      // Always navigate to seat selection (let the page handle empty state)
      onNavigate(`/event/${event.id}/seats`);
      toast.success(`Selected ${tier.name} ticket. Choose your seats!`);
    } catch (error) {
      console.error("Error starting booking:", error);
      toast.error("Failed to start booking. Please try again.");
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

        {/* Share Button Overlay */}
        <div className="absolute top-4 right-4 z-10">
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
                  {(() => {
                    // Format category name for translation key (remove special chars, spaces)
                    const categoryKey =
                      event.category
                        ?.replace(/[^a-zA-Z0-9]/g, "")
                        .replace(/\s+/g, "") || "Other";
                    const translationKey = `editEvent.category${categoryKey}`;
                    const translated = t(translationKey);
                    // If translation returns the key itself, use the original category name
                    return translated === translationKey
                      ? event.category
                      : translated;
                  })()}
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

              <div className="space-y-4">
                {event.ticketTiers.map((tier: any) => (
                  <div
                    key={tier.id}
                    className={`border rounded-xl p-4 transition-all ${
                      tier.available === 0
                        ? "border-neutral-200 bg-neutral-50 opacity-60"
                        : "border-neutral-200 hover:border-teal-300"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-neutral-900">{tier.name}</div>
                        <div className="text-sm text-neutral-500 mt-1">
                          {tier.description}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-neutral-900">
                          {formatPrice(tier.price)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-neutral-500">
                          {tier.available > 0 ? (
                            `${tier.available} ${t("events.available")}`
                          ) : (
                            <span className="text-red-600">
                              {t("events.soldOut")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Book Tickets Button - No quantity selection */}
                      {tier.available > 0 && (
                        <Button
                          className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
                          onClick={() => handleBookTickets(tier)}
                        >
                          <Ticket size={16} className="mr-2" />
                          Book Tickets
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MiniCartBar removed - cart will be shown after seat selection */}
    </div>
  );
}
