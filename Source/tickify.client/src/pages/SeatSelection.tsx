import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Info,
  Star,
  Clock,
  Check,
  X,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { seatService } from "../services/seatService";
import type { SeatDto } from "../services/seatService";
import { useBooking } from "../contexts/BookingContext";
import { toast } from "sonner";

interface SeatSelectionProps {
  eventId?: number;
  onNavigate: (page: string, params?: any) => void;
}

export function SeatSelection({ eventId, onNavigate }: SeatSelectionProps) {
  const { t } = useTranslation();
  const { bookingState, addSeat, removeSeat, setSeats } = useBooking();

  const [seats, setSeatsData] = useState<SeatDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<SeatDto | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [zoom, setZoom] = useState(1);
  const [showLegend, setShowLegend] = useState(true);
  const [searchSeat, setSearchSeat] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  const [keepTogether, setKeepTogether] = useState(true);

  // Get eventId from booking context if not provided
  const currentEventId = eventId || bookingState.eventId;

  // Fetch seats when component mounts
  useEffect(() => {
    console.log(
      "SeatSelection mounted with eventId:",
      eventId,
      "bookingState.eventId:",
      bookingState.eventId,
      "currentEventId:",
      currentEventId
    );

    if (!currentEventId) {
      console.warn("No eventId provided to SeatSelection");
      setError("No event selected");
      setLoading(false);
      return;
    }

    const fetchSeats = async () => {
      try {
        setLoading(true);
        console.log("Fetching seats for event:", currentEventId);
        const fetchedSeats = await seatService.getSeatsByEvent(currentEventId);
        // Ensure we always set an array, even if API returns undefined/null
        const safeFetchedSeats = Array.isArray(fetchedSeats)
          ? fetchedSeats
          : [];
        console.log(
          "Fetched seats:",
          safeFetchedSeats.length,
          safeFetchedSeats
        );

        if (safeFetchedSeats.length === 0) {
          console.warn("No seats found for event:", currentEventId);
          // Don't show toast here, let the empty state UI handle it
        }

        setSeatsData(safeFetchedSeats);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching seats:", err);
        const errorMessage =
          err.response?.data?.message || err.message || "Failed to load seats";
        setError(errorMessage);
        setSeatsData([]); // Set empty array on error
        toast.error(`Failed to load seat map: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [currentEventId, eventId, bookingState.eventId]);

  // Countdown timer for seat hold
  useEffect(() => {
    if (bookingState.selectedSeats.length === 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Release seats
          setSeats([]);
          toast.warning(
            "Your seat selection has expired. Please select seats again."
          );
          return 600;
        }

        if (prev === 120 && !showTimerWarning) {
          setShowTimerWarning(true);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [bookingState.selectedSeats.length, showTimerWarning, setSeats]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeatClick = async (seat: SeatDto) => {
    // Can't select sold, blocked, or reserved seats
    if (
      seat.status === "Sold" ||
      seat.isBlocked ||
      seat.status === "Reserved"
    ) {
      toast.error(
        `This seat is ${seat.status.toLowerCase()} and cannot be selected`
      );
      return;
    }

    const isSelected = bookingState.selectedSeats.some((s) => s.id === seat.id);

    if (isSelected) {
      // Deselect
      removeSeat(seat.id);
      // Update local state
      setSeatsData((prev) =>
        prev.map((s) =>
          s.id === seat.id ? { ...s, status: "Available" as const } : s
        )
      );
    } else {
      // Select
      addSeat(seat);
      // Update local state
      setSeatsData((prev) =>
        prev.map((s) =>
          s.id === seat.id ? { ...s, status: "Selected" as const } : s
        )
      );
    }
  };

  const handleAutoSelect = () => {
    // Find best available seats
    const safeSeats = Array.isArray(seats) ? seats : [];
    const availableSeats = safeSeats.filter(
      (s) => s.status === "Available" && !s.isBlocked
    );

    if (availableSeats.length >= 2) {
      const bestSeats = availableSeats.slice(0, 2);
      bestSeats.forEach((seat) => {
        addSeat(seat);
        setSeatsData((prev) =>
          prev.map((s) =>
            s.id === seat.id ? { ...s, status: "Selected" as const } : s
          )
        );
      });
      toast.success("Selected best available seats!");
    } else {
      toast.warning("Not enough seats available for auto-select");
    }
  };

  const getSeatColor = (seat: SeatDto, isHovered: boolean) => {
    const isSelected = bookingState.selectedSeats.some((s) => s.id === seat.id);

    if (
      isHovered &&
      seat.status !== "Sold" &&
      seat.status !== "Reserved" &&
      !seat.isBlocked
    ) {
      return "scale-110 shadow-lg";
    }

    if (isSelected) {
      return "bg-teal-500 text-white cursor-pointer";
    }

    switch (seat.status) {
      case "Available":
        return "bg-green-100 hover:bg-green-200 cursor-pointer";
      case "Sold":
        return "bg-gray-300 cursor-not-allowed";
      case "Reserved":
        return "bg-orange-300 cursor-not-allowed";
      case "Blocked":
        return "bg-red-200 cursor-not-allowed";
      default:
        return "bg-gray-200";
    }
  };

  const subtotal = bookingState.subtotal;
  const serviceFee = bookingState.serviceFee;
  const total = bookingState.total;

  // Ensure seats is always an array
  const safeSeats = Array.isArray(seats) ? seats : [];

  const filteredSeats =
    selectedZone === "all"
      ? safeSeats
      : safeSeats.filter((s) => s.seatZoneId?.toString() === selectedZone);

  const availableCount = safeSeats.filter(
    (s) => s.status === "Available" && !s.isBlocked
  ).length;
  const soldCount = safeSeats.filter((s) => s.status === "Sold").length;
  const selectedCount = bookingState.selectedSeats?.length || 0;

  // Group seats by row for display
  const seatsByRow = filteredSeats.reduce((acc, seat, index) => {
    // Ensure row is a string and not empty
    // Use row (string like "A", "B") or fallback to gridRow (number) or generate from index
    let rowKey: string;
    if (seat.row && seat.row.toString().trim()) {
      rowKey = seat.row.toString().trim();
    } else if (seat.gridRow !== undefined && seat.gridRow !== null) {
      // Convert gridRow (0-based) to row letter (A, B, C, ...)
      const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      rowKey = rowLetters[seat.gridRow % 26] || `Row${seat.gridRow + 1}`;
    } else {
      // Fallback: use index to create a row
      rowKey = `Row${Math.floor(index / 20) + 1}`;
    }

    if (!acc[rowKey]) {
      acc[rowKey] = [];
    }
    acc[rowKey].push(seat);
    return acc;
  }, {} as Record<string, SeatDto[]>);

  // Sort rows alphabetically (handle both string and numeric rows)
  const sortedRows = Object.keys(seatsByRow).sort((a, b) => {
    // Try to sort as numbers first, then as strings
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });

  // Debug logging
  if (safeSeats.length > 0 && sortedRows.length === 0) {
    console.warn("Seats loaded but no rows found:", {
      seatsCount: safeSeats.length,
      filteredCount: filteredSeats.length,
      sampleSeat: safeSeats[0],
      seatsByRowKeys: Object.keys(seatsByRow),
    });
  }

  const handleContinueToCheckout = async () => {
    if (bookingState.selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }

    // Check seat availability before proceeding
    try {
      const seatIds = bookingState.selectedSeats.map((s) => s.id);
      const available = await seatService.checkSeatAvailability(seatIds);

      if (!available) {
        toast.error(
          "Some selected seats are no longer available. Please select again."
        );
        // Refresh seats
        if (currentEventId) {
          const freshSeats = await seatService.getSeatsByEvent(currentEventId);
          setSeatsData(freshSeats);
        }
        return;
      }

      // Navigate to checkout
      onNavigate("checkout");
    } catch (err: any) {
      console.error("Error checking seat availability:", err);
      toast.error("Failed to verify seat availability");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-neutral-600">Loading seat map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Failed to Load Seats
              </h3>
              <p className="text-neutral-600 mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                {currentEventId && (
                  <Button
                    variant="outline"
                    onClick={() => onNavigate(`/event/${currentEventId}`)}
                  >
                    Back to Event
                  </Button>
                )}
                <Button onClick={() => onNavigate("home")}>
                  Return to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show friendly message when no seats are available
  if (!loading && safeSeats.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Seats Available</h3>
              <p className="text-neutral-600 mb-4">
                This event does not have a seat map configured yet. The
                organizer needs to create a seat map before tickets can be
                booked with seat selection.
              </p>
              <p className="text-sm text-neutral-500 mb-4">
                Please contact the event organizer or check back later.
              </p>
              <div className="flex gap-2 justify-center">
                {currentEventId && (
                  <Button
                    variant="outline"
                    onClick={() => onNavigate(`/event/${currentEventId}`)}
                  >
                    Back to Event
                  </Button>
                )}
                <Button onClick={() => onNavigate("home")}>
                  Return to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="relative h-48 bg-gradient-to-r from-purple-600 to-pink-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full max-w-7xl mx-auto px-4 py-6 flex flex-col justify-between">
          <Button
            variant="ghost"
            className="self-start text-white hover:bg-white/20"
            onClick={() => {
              if (currentEventId) {
                onNavigate(`/event/${currentEventId}`);
              } else {
                onNavigate("event-detail");
              }
            }}
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Event
          </Button>

          <div className="text-white">
            <h1 className="mb-2">
              {bookingState.eventTitle || "Select Your Seats"}
            </h1>
            <div className="flex items-center gap-4 text-sm">
              {bookingState.eventDate && (
                <span>📅 {bookingState.eventDate}</span>
              )}
              {bookingState.eventVenue && (
                <span>📍 {bookingState.eventVenue}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timer Bar */}
      {selectedCount > 0 && (
        <div
          className={`sticky top-0 z-40 ${
            timeRemaining < 300 ? "bg-orange-500" : "bg-purple-600"
          } text-white py-3 shadow-lg transition-colors`}
        >
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-3">
            <Clock size={20} />
            <span className="text-sm">
              Time remaining to complete booking:{" "}
              <strong className="text-lg">{formatTime(timeRemaining)}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Selected Seats Summary */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Selected Seats</span>
                  <Badge>{selectedCount}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCount === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-4">
                    No seats selected yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {bookingState.selectedSeats.map((seat) => (
                      <div
                        key={seat.id}
                        className="flex items-center justify-between p-2 bg-neutral-50 rounded"
                      >
                        <div>
                          <div className="text-sm text-neutral-900">
                            Seat {seat.fullSeatCode}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {seat.zoneName || seat.ticketTypeName}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-neutral-900">
                            $
                            {seat.ticketTypePrice ||
                              bookingState.ticketTypePrice}
                          </span>
                          <button
                            onClick={() => handleSeatClick(seat)}
                            className="text-neutral-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Subtotal</span>
                        <span className="text-neutral-900">
                          ${subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Service Fee</span>
                        <span className="text-neutral-900">
                          ${serviceFee.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg pt-2 border-t">
                        <span className="text-neutral-900">Total</span>
                        <span className="text-neutral-900">
                          ${total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                      onClick={handleContinueToCheckout}
                    >
                      Continue to Checkout
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Seat Map */}
          <div className="lg:col-span-6 space-y-4">
            {/* Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Search size={16} className="text-neutral-400" />
                    <Input
                      placeholder="Find seat (e.g., A12)"
                      value={searchSeat}
                      onChange={(e) => setSearchSeat(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                    >
                      <ZoomOut size={16} />
                    </Button>
                    <span className="text-sm text-neutral-600">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                    >
                      <ZoomIn size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(1)}
                    >
                      <Maximize2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seat Map */}
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                {/* Stage */}
                <div className="mb-8 text-center">
                  <div className="inline-block bg-gray-200 px-8 py-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">🎭</div>
                    <div className="text-sm text-gray-700">STAGE</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    ↑ Stage View ↑
                  </div>
                </div>

                {/* Seat Grid */}
                {safeSeats.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-neutral-600 mb-4">
                      No seats available for this event.
                    </p>
                    <p className="text-sm text-neutral-500">
                      Please contact the organizer or check back later.
                    </p>
                  </div>
                ) : sortedRows.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-neutral-600 mb-4">
                      No seats match the current filter.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedZone("all")}
                    >
                      Show All Seats
                    </Button>
                  </div>
                ) : (
                  <div
                    className="overflow-auto"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "top center",
                      transition: "transform 0.2s",
                    }}
                  >
                    <div className="inline-block min-w-full">
                      {sortedRows.map((row) => (
                        <div
                          key={row}
                          className="flex items-center justify-center gap-1 mb-1"
                        >
                          <div className="w-6 text-xs text-gray-500 text-right">
                            {row}
                          </div>
                          {seatsByRow[row]
                            .sort((a, b) => {
                              const numA = parseInt(a.seatNumber);
                              const numB = parseInt(b.seatNumber);
                              return isNaN(numA) || isNaN(numB)
                                ? a.seatNumber.localeCompare(b.seatNumber)
                                : numA - numB;
                            })
                            .map((seat) => {
                              const isSelected =
                                bookingState.selectedSeats.some(
                                  (s) => s.id === seat.id
                                );
                              return (
                                <div key={seat.id} className="relative group">
                                  <button
                                    onClick={() => handleSeatClick(seat)}
                                    onMouseEnter={() => setHoveredSeat(seat)}
                                    onMouseLeave={() => setHoveredSeat(null)}
                                    disabled={
                                      seat.status === "Sold" ||
                                      seat.isBlocked ||
                                      seat.status === "Reserved"
                                    }
                                    className={`
                                    w-8 h-8 rounded text-xs flex items-center justify-center
                                    transition-all duration-200
                                    ${getSeatColor(
                                      seat,
                                      hoveredSeat?.id === seat.id
                                    )}
                                  `}
                                  >
                                    {isSelected && <Check size={14} />}
                                  </button>

                                  {/* Tooltip */}
                                  {hoveredSeat?.id === seat.id && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                                      <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl whitespace-nowrap">
                                        <div className="font-semibold mb-1">
                                          Seat {seat.fullSeatCode}
                                        </div>
                                        <div className="text-gray-300">
                                          {seat.zoneName || seat.ticketTypeName}
                                        </div>
                                        <div className="text-teal-400 mt-1">
                                          ${seat.ticketTypePrice}
                                        </div>
                                        <div className="mt-1 text-xs">
                                          Status: {seat.status}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Legend & Info */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Legend</span>
                  <button onClick={() => setShowLegend(!showLegend)}>
                    <ChevronDown
                      size={20}
                      className={`transition-transform ${
                        showLegend ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </CardTitle>
              </CardHeader>
              {showLegend && (
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 rounded" />
                      <span className="text-sm">Available</span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {availableCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-teal-500 rounded" />
                      <span className="text-sm">Selected</span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {selectedCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-300 rounded" />
                      <span className="text-sm">Sold</span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {soldCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-orange-300 rounded" />
                      <span className="text-sm">Reserved</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-200 rounded" />
                      <span className="text-sm">Blocked</span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleAutoSelect}
                >
                  <Star size={16} className="mr-2" />
                  Auto-Select Best Seats
                </Button>

                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
                  <span className="text-sm">Keep seats together</span>
                  <button
                    onClick={() => setKeepTogether(!keepTogether)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      keepTogether ? "bg-teal-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        keepTogether ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="text-sm">
                  <div className="font-semibold mb-2">Tips</div>
                  <ul className="space-y-1 text-xs text-neutral-600">
                    <li>• Click seats to select/deselect</li>
                    <li>• Use zoom controls for better view</li>
                    <li>• Center seats offer best views</li>
                    <li>• Complete booking within timer</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>

      {/* Timer Warning Modal */}
      <Dialog open={showTimerWarning} onOpenChange={setShowTimerWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="text-orange-500" />
              Time Running Out
            </DialogTitle>
            <DialogDescription>
              You have less than 2 minutes to complete your booking. Your
              selected seats will be released if you don't proceed soon.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTimerWarning(false)}
            >
              Continue Selecting
            </Button>
            <Button
              className="bg-gradient-to-r from-teal-500 to-teal-600"
              onClick={() => {
                setShowTimerWarning(false);
                handleContinueToCheckout();
              }}
            >
              Proceed to Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
