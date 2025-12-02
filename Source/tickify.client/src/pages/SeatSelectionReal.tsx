import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Loader2,
  MapPin,
  Calendar,
  ArrowLeft,
  ShoppingCart,
  Clock,
} from "lucide-react";
import { seatMapService, type SeatDto } from "../services/seatMapService";
import { eventService } from "../services/eventService";
import type { Event } from "../types";

interface SeatSelectionRealProps {
  onNavigate: (page: string, eventId?: string) => void;
}

export function SeatSelectionReal({ onNavigate }: SeatSelectionRealProps) {
  const { eventId } = useParams<{ eventId: string }>();

  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState<SeatDto[]>([]);
  const [seatMap, setSeatMap] = useState<{
    totalRows: number;
    totalColumns: number;
  } | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [error, setError] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes

  useEffect(() => {
    if (eventId) {
      loadSeatData(eventId);
    }
  }, [eventId]);

  // Countdown timer when seats are selected
  useEffect(() => {
    if (selectedSeats.length === 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Release seats
          setSelectedSeats([]);
          alert("Time expired! Please select your seats again.");
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSeats.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const loadSeatData = async (id: string) => {
    try {
      setLoading(true);
      setError("");

      // Load event details
      const eventData = await eventService.getEventById(parseInt(id));
      setEvent(eventData);

      // Load seat map
      try {
        const seatMapData = await seatMapService.getSeatMapByEvent(id);
        setSeatMap({
          totalRows: seatMapData.totalRows,
          totalColumns: seatMapData.totalColumns,
        });

        // Load seats
        const seatsData = await seatMapService.getEventSeats(id);
        setSeats(seatsData);
      } catch (err) {
        console.error("Error loading seat map:", err);
        setError("This event does not have a seat map configured yet.");
      }
    } catch (err) {
      console.error("Error loading event data:", err);
      setError("Failed to load event information");
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seatId: number) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat || seat.status !== "Available") return;

    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  const getSeatStatus = (seat: SeatDto) => {
    if (selectedSeats.includes(seat.id)) return "selected";
    return seat.status.toLowerCase();
  };

  const getSeatColor = (seat: SeatDto) => {
    const status = getSeatStatus(seat);
    if (status === "selected") return "#00C16A";
    if (status === "sold" || status === "reserved") return "#DC2626";
    return seat.seatZoneId ? "#93C5FD" : "#E5E7EB";
  };

  const getTotalPrice = () => {
    return selectedSeats.reduce((total, seatId) => {
      const seat = seats.find((s) => s.id === seatId);
      return total + (seat?.price || 0);
    }, 0);
  };

  const handleProceedToCheckout = () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat");
      return;
    }

    // Store selected seats for booking
    sessionStorage.setItem("selectedSeats", JSON.stringify(selectedSeats));
    sessionStorage.setItem("eventId", eventId || "");
    sessionStorage.setItem("totalPrice", getTotalPrice().toString());

    // Navigate to checkout
    onNavigate("checkout", eventId);
  };

  const renderSeatGrid = () => {
    if (!seatMap) return null;

    const grid: (JSX.Element | null)[][] = Array(seatMap.totalRows)
      .fill(null)
      .map(() => Array(seatMap.totalColumns).fill(null));

    // Place seats in grid
    seats.forEach((seat) => {
      if (
        seat.gridRow !== null &&
        seat.gridColumn !== null &&
        seat.gridRow !== undefined &&
        seat.gridColumn !== undefined &&
        seat.gridRow < seatMap.totalRows &&
        seat.gridColumn < seatMap.totalColumns
      ) {
        grid[seat.gridRow][seat.gridColumn] = (
          <button
            key={seat.id}
            onClick={() => toggleSeat(seat.id)}
            disabled={seat.status !== "Available"}
            className={`w-10 h-10 rounded text-xs font-medium transition-all border ${
              seat.status !== "Available" && !selectedSeats.includes(seat.id)
                ? "cursor-not-allowed opacity-50"
                : "hover:scale-110 cursor-pointer"
            }`}
            style={{
              backgroundColor: getSeatColor(seat),
              color: getSeatStatus(seat) === "available" ? "#374151" : "white",
              borderColor:
                getSeatStatus(seat) === "selected" ? "#00C16A" : "#D1D5DB",
            }}
            title={`${seat.row}${seat.seatNumber} - $${seat.price}`}
          >
            {seat.seatNumber}
          </button>
        );
      }
    });

    return (
      <div className="space-y-1">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 justify-center">
            <div className="w-8 text-xs text-gray-500 flex items-center justify-end pr-2">
              {String.fromCharCode(65 + rowIndex)}
            </div>
            {row.map(
              (cell, colIndex) =>
                cell || (
                  <div key={`${rowIndex}-${colIndex}`} className="w-10 h-10" />
                )
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#00C16A]" />
          <p className="text-gray-600">Loading seat map...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error || "Event not found"}</p>
            <Button onClick={() => onNavigate("home")}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => onNavigate("event-detail", eventId)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Event
        </Button>

        {/* Timer Bar */}
        {selectedSeats.length > 0 && (
          <div
            className={`mb-6 ${
              timeRemaining < 300 ? "bg-orange-500" : "bg-purple-600"
            } text-white py-3 px-4 rounded-lg shadow-lg transition-colors`}
          >
            <div className="flex items-center justify-center gap-3">
              <Clock size={20} />
              <span className="text-sm">
                Time remaining:{" "}
                <strong className="text-lg">{formatTime(timeRemaining)}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Event Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4 items-start">
              {event.image && (
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {event.title}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {event.venue}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seat Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Your Seats</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Stage indicator */}
                <div className="text-center mb-6">
                  <div className="inline-block bg-gray-800 text-white px-8 py-2 rounded-t-lg">
                    Stage / Screen
                  </div>
                </div>

                {/* Seat Grid */}
                {seats.length > 0 ? (
                  <div className="overflow-x-auto">{renderSeatGrid()}</div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No seats available for this event
                  </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-6 justify-center mt-8 pt-6 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gray-200 border border-gray-300" />
                    <span className="text-sm text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#00C16A] border-2 border-[#00C16A]" />
                    <span className="text-sm text-gray-600">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-600" />
                    <span className="text-sm text-gray-600">Sold/Reserved</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-2">
                    Selected Seats
                  </div>
                  {selectedSeats.length === 0 ? (
                    <p className="text-sm text-gray-500">No seats selected</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedSeats.map((seatId) => {
                        const seat = seats.find((s) => s.id === seatId);
                        if (!seat) return null;
                        return (
                          <div
                            key={seatId}
                            className="flex justify-between text-sm bg-gray-50 p-2 rounded"
                          >
                            <span>
                              {seat.row}
                              {seat.seatNumber}
                            </span>
                            <span className="font-medium">${seat.price}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      ${getTotalPrice().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Service Fee (5%)</span>
                    <span className="font-medium">
                      ${(getTotalPrice() * 0.05).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-[#00C16A]">
                      ${(getTotalPrice() * 1.05).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleProceedToCheckout}
                  disabled={selectedSeats.length === 0}
                  className="w-full bg-[#00C16A] hover:bg-[#00a859] h-12"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Proceed to Checkout ({selectedSeats.length})
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Seats will be held for {formatTime(timeRemaining)} during
                  checkout
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
