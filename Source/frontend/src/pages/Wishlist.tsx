import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

interface WishlistProps {
  onNavigate?: (page: string) => void;
}

interface WishlistEvent {
  wishlistId: number;
  eventId: number;
  eventTitle: string;
  eventImage: string;
  eventStartDate: string;
  eventEndDate: string;
  eventVenue: string;
  eventCity: string;
  category: string;
  lowestPrice: number;
  highestPrice: number;
  availableTickets: number;
  totalTickets: number;
  isSoldOut: boolean;
  addedAt: string;
}

export function Wishlist({ onNavigate }: WishlistProps) {
  const navigate = useNavigate();
  const [wishlistEvents, setWishlistEvents] = useState<WishlistEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/wishlist', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const data = await response.json();

      // Mock data for now
      const mockWishlist: WishlistEvent[] = [
        {
          wishlistId: 1,
          eventId: 1,
          eventTitle: "Summer Music Festival 2025",
          eventImage:
            "https://images.unsplash.com/photo-1459749411175-04bf5292ceea",
          eventStartDate: "2025-12-31T20:00:00",
          eventEndDate: "2025-12-31T23:59:00",
          eventVenue: "Madison Square Garden",
          eventCity: "New York",
          category: "Music",
          lowestPrice: 50.0,
          highestPrice: 150.0,
          availableTickets: 120,
          totalTickets: 500,
          isSoldOut: false,
          addedAt: "2025-11-01T10:00:00",
        },
        {
          wishlistId: 2,
          eventId: 2,
          eventTitle: "Tech Conference 2025",
          eventImage:
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
          eventStartDate: "2026-01-15T09:00:00",
          eventEndDate: "2026-01-17T18:00:00",
          eventVenue: "Convention Center",
          eventCity: "San Francisco",
          category: "Conference",
          lowestPrice: 99.0,
          highestPrice: 299.0,
          availableTickets: 0,
          totalTickets: 200,
          isSoldOut: true,
          addedAt: "2025-10-25T14:30:00",
        },
        {
          wishlistId: 3,
          eventId: 3,
          eventTitle: "Stand-Up Comedy Night",
          eventImage:
            "https://images.unsplash.com/photo-1585699324551-f6c309eedeca",
          eventStartDate: "2025-12-20T19:30:00",
          eventEndDate: "2025-12-20T22:00:00",
          eventVenue: "Comedy Club",
          eventCity: "Los Angeles",
          category: "Comedy",
          lowestPrice: 35.0,
          highestPrice: 75.0,
          availableTickets: 45,
          totalTickets: 100,
          isSoldOut: false,
          addedAt: "2025-11-05T16:45:00",
        },
      ];

      setWishlistEvents(mockWishlist);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (wishlistId: number) => {
    if (!confirm("Remove this event from your wishlist?")) return;

    try {
      setRemovingId(wishlistId);
      // TODO: Replace with actual API call
      // await fetch(`/api/wishlist/${wishlistId}`, {
      //   method: 'DELETE',
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      setWishlistEvents((prev) =>
        prev.filter((e) => e.wishlistId !== wishlistId)
      );
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      alert("Failed to remove from wishlist. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleBookNow = (eventId: number) => {
    if (onNavigate) {
      onNavigate(`/event/${eventId}`);
    } else {
      navigate(`/event/${eventId}`);
    }
  };

  const handleJoinWaitlist = (_eventId: number) => {
    // Navigate to waitlist page or show waitlist modal
    alert("Join waitlist functionality coming soon!");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">My Wishlist</h1>
          <p className="text-neutral-600">
            Events you're interested in • {wishlistEvents.length}{" "}
            {wishlistEvents.length === 1 ? "event" : "events"}
          </p>
        </div>

        {/* Wishlist Grid */}
        {wishlistEvents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <svg
                className="w-24 h-24 text-neutral-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <p className="text-lg font-medium text-neutral-700 mb-2">
                Your wishlist is empty
              </p>
              <p className="text-neutral-500 mb-6 text-center max-w-md">
                Start adding events you're interested in to keep track of them
                and get notified about updates!
              </p>
              <Button onClick={() => navigate("/events")}>
                Explore Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistEvents.map((event) => (
              <Card
                key={event.wishlistId}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Event Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.eventImage}
                    alt={event.eventTitle}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />

                  {/* Category Badge */}
                  <Badge className="absolute top-3 left-3 bg-white/90 text-neutral-800 hover:bg-white">
                    {event.category}
                  </Badge>

                  {/* Sold Out Badge */}
                  {event.isSoldOut && (
                    <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                      Sold Out
                    </Badge>
                  )}

                  {/* Remove Heart Button */}
                  <button
                    onClick={() => handleRemoveFromWishlist(event.wishlistId)}
                    disabled={removingId === event.wishlistId}
                    className="absolute bottom-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors disabled:opacity-50"
                    title="Remove from wishlist"
                  >
                    <svg
                      className="w-6 h-6 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </div>

                <CardContent className="p-4">
                  {/* Event Title */}
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
                    {event.eventTitle}
                  </h3>

                  {/* Date and Time */}
                  <div className="flex items-start gap-2 text-sm text-neutral-600 mb-2">
                    <svg
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <div>{formatDate(event.eventStartDate)}</div>
                      <div className="text-xs">
                        {formatTime(event.eventStartDate)}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="truncate">
                      {event.eventVenue}, {event.eventCity}
                    </span>
                  </div>

                  {/* Price Range */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs text-neutral-500">From</span>
                      <div className="font-semibold text-lg">
                        {formatCurrency(event.lowestPrice)}
                      </div>
                    </div>

                    {/* Availability */}
                    {!event.isSoldOut && (
                      <Badge variant="outline" className="text-xs">
                        {event.availableTickets} / {event.totalTickets} left
                      </Badge>
                    )}
                  </div>

                  {/* Added Date */}
                  <p className="text-xs text-neutral-400 mb-3">
                    Added {formatDate(event.addedAt)}
                  </p>
                </CardContent>

                <CardFooter className="p-4 pt-0 flex gap-2">
                  {event.isSoldOut ? (
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => handleJoinWaitlist(event.eventId)}
                    >
                      Join Waitlist
                    </Button>
                  ) : (
                    <Button
                      className="flex-1"
                      onClick={() => handleBookNow(event.eventId)}
                    >
                      Book Now
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => handleRemoveFromWishlist(event.wishlistId)}
                    disabled={removingId === event.wishlistId}
                  >
                    Remove
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
