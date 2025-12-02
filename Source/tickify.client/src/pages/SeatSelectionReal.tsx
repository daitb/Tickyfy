import { useState, useEffect } from "react";
import * as signalR from "@microsoft/signalr";
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
import {
  seatMapService,
  type SeatDto,
  type SeatZoneDto,
  type SeatMapDto,
} from "../services/seatMapService";
import { eventService } from "../services/eventService";
import type { Event } from "../types";

interface SeatSelectionRealProps {
  eventId?: string;
  onNavigate: (page: string, eventId?: string) => void;
}

export function SeatSelectionReal({
  eventId,
  onNavigate,
}: SeatSelectionRealProps) {
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState<SeatDto[]>([]);
  const [seatMap, setSeatMap] = useState<SeatMapDto | null>(null);
  const [zones, setZones] = useState<SeatZoneDto[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [seatConnection, setSeatConnection] =
    useState<signalR.HubConnection | null>(null);

  useEffect(() => {
    // Get current user ID from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.id) {
      setCurrentUserId(user.id);
    }

    // Restore selected seats from sessionStorage (for returning to checkout)
    const savedSeats = sessionStorage.getItem("selectedSeats");
    if (savedSeats) {
      try {
        const seatIds = JSON.parse(savedSeats);
        if (Array.isArray(seatIds) && seatIds.length > 0) {
          setSelectedSeats(seatIds);
        }
      } catch (e) {
        console.error("Failed to restore seats:", e);
      }
    }

    if (eventId) {
      loadSeatData(eventId);
    }
  }, [eventId]);

  // Setup SignalR connection for real-time seat updates
  useEffect(() => {
    if (!eventId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5179/hubs/seats")
      .withAutomaticReconnect()
      .build();

    connection.on(
      "SeatsUpdated",
      (update: {
        eventId: number;
        seatIds: number[];
        status: string;
        reservedByUserId?: number;
      }) => {
        console.log("Seats updated:", update);

        // Update seat status in real-time
        setSeats((prevSeats) =>
          prevSeats.map((seat) => {
            if (update.seatIds.includes(seat.id)) {
              return {
                ...seat,
                status: update.status,
                isReserved: update.status === "Reserved",
                reservedByUserId: update.reservedByUserId,
              };
            }
            return seat;
          })
        );

        // Remove from selection if taken by ANOTHER user
        if (
          update.reservedByUserId &&
          currentUserId &&
          update.reservedByUserId !== currentUserId
        ) {
          setSelectedSeats((prev) =>
            prev.filter((seatId) => !update.seatIds.includes(seatId))
          );
        }
      }
    );

    connection
      .start()
      .then(() => {
        console.log("SignalR connected");
        connection.invoke("JoinEventSeatMap", parseInt(eventId));
        setSeatConnection(connection);
      })
      .catch((err) => console.error("SignalR connection error:", err));

    return () => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke("LeaveEventSeatMap", parseInt(eventId));
        connection.stop();
      }
    };
  }, [eventId, currentUserId]);

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

      // Load seat map and zones
      try {
        const seatMapData = await seatMapService.getSeatMapByEvent(id);
        setSeatMap(seatMapData);
        setZones(seatMapData.zones || []);

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

  const toggleSeat = async (seatId: number) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat) return;

    // Allow clicking Available seats or seats reserved by current user
    const canToggle =
      seat.status === "Available" ||
      (seat.status === "Reserved" && seat.reservedByUserId === currentUserId);

    if (!canToggle) return;

    const isSelected = selectedSeats.includes(seatId);
    const newSelectedSeats = isSelected
      ? selectedSeats.filter((id) => id !== seatId)
      : [...selectedSeats, seatId];

    setSelectedSeats(newSelectedSeats);

    // Always sync with server (reserve or release)
    if (seatMap) {
      try {
        if (isSelected) {
          // Release the specific seat being deselected
          await seatMapService.releaseSeats(seatMap.id, [seatId]);
        } else {
          // Reserve all currently selected seats
          await seatMapService.reserveSeats(seatMap.id, newSelectedSeats);
        }
      } catch (error) {
        console.error("Failed to update seat reservation:", error);
        // Revert selection if reservation fails
        setSelectedSeats(selectedSeats);
        alert(
          "Unable to update seats. They may have been taken by another user."
        );
      }
    }
  };

  const getSeatStatus = (seat: SeatDto) => {
    if (selectedSeats.includes(seat.id)) return "selected";
    return seat.status.toLowerCase();
  };

  const getSeatColor = (seat: SeatDto) => {
    const status = getSeatStatus(seat);
    if (status === "selected") return "#00C16A";
    if (status === "sold" || status === "reserved") return "#DC2626";
    if (seat.isWheelchair) return "#93C5FD"; // Blue for wheelchair
    if (seat.zoneColor) return seat.zoneColor; // Use zone color
    return "#E5E7EB"; // Default gray
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
            disabled={
              seat.status === "Sold" ||
              (seat.status === "Reserved" &&
                seat.reservedByUserId !== currentUserId)
            }
            className={`w-10 h-10 rounded text-xs font-medium transition-all border relative ${
              (seat.status === "Sold" ||
                (seat.status === "Reserved" &&
                  seat.reservedByUserId !== currentUserId)) &&
              !selectedSeats.includes(seat.id)
                ? "cursor-not-allowed opacity-50"
                : "hover:scale-110 cursor-pointer"
            }`}
            style={{
              backgroundColor: getSeatColor(seat),
              color: getSeatStatus(seat) === "available" ? "#374151" : "white",
              borderColor:
                getSeatStatus(seat) === "selected" ? "#00C16A" : "#D1D5DB",
            }}
            title={`${seat.row}${seat.seatNumber} - $${seat.price}${
              seat.zoneName ? ` (${seat.zoneName})` : ""
            }${seat.isWheelchair ? " - Wheelchair Accessible" : ""}`}
          >
            {seat.isWheelchair ? (
              <span className="text-sm">♿</span>
            ) : (
              seat.seatNumber
            )}
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
    <div className="h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white overflow-hidden">
      {/* Header */}
      <div className="relative h-32 bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full px-4 py-4 flex flex-col justify-between">
          <Button
            variant="ghost"
            className="self-start text-white hover:bg-white/20"
            onClick={() => onNavigate("event-detail", eventId)}
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Event
          </Button>

          <div className="text-white">
            <h1 className="text-2xl mb-1">{event?.title || "Select Seats"}</h1>
            <div className="flex items-center gap-4 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                {event?.venue}
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                {event?.date && new Date(event.date).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timer Bar */}
      {selectedSeats.length > 0 && (
        <div
          className={`${
            timeRemaining < 300 ? "bg-orange-500" : "bg-purple-600"
          } text-white py-3 shadow-lg transition-colors flex-shrink-0`}
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

      {/* Main Content - 3 Columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Zones */}
        <div className="w-80 bg-white border-r overflow-y-auto p-4 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Available Zones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {zones && zones.length > 0 ? (
                zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: zone.color || "#ccc" }}
                      />
                      <span className="font-medium text-sm">{zone.name}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Price:</span>
                        <span className="font-medium text-neutral-900">
                          ${zone.zonePrice}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Available:</span>
                        <span className="font-medium text-neutral-900">
                          {zone.availableSeats} / {zone.capacity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No zones defined</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center Panel - Seat Map */}
        <div className="flex-1 overflow-auto bg-neutral-100 p-8">
          <div className="bg-white rounded-lg shadow-lg p-8 inline-block min-w-full">
            {/* Stage */}
            <div className="mb-8 text-center">
              <div className="inline-block bg-neutral-200 px-16 py-6 rounded-lg">
                <div className="text-2xl mb-2">🎭</div>
                <div className="text-sm text-neutral-700">STAGE</div>
              </div>
            </div>

            {/* Seat Grid */}
            {seats.length > 0 ? (
              <div className="inline-block">{renderSeatGrid()}</div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No seats available for this event
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Booking Summary */}
        <div className="w-80 bg-white border-l overflow-y-auto p-4 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Legend */}
              <div className="pb-3 border-b">
                <div className="text-xs font-medium text-neutral-700 mb-2">
                  Legend:
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-gray-200 border border-gray-300" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-[#00C16A]" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-red-600" />
                    <span>Sold</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-blue-200 flex items-center justify-center text-xs">
                      ♿
                    </div>
                    <span>Wheelchair</span>
                  </div>
                </div>
              </div>

              {/* Selected Seats */}
              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Selected Seats ({selectedSeats.length})
                </div>
                {selectedSeats.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    No seats selected yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedSeats.map((seatId) => {
                      const seat = seats.find((s) => s.id === seatId);
                      if (!seat) return null;
                      return (
                        <div
                          key={seatId}
                          className="flex justify-between text-xs bg-gray-50 p-2 rounded"
                        >
                          <span>
                            {seat.isWheelchair && (
                              <span className="mr-1">♿</span>
                            )}
                            {seat.row}
                            {seat.seatNumber}
                            {seat.zoneName && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({seat.zoneName})
                              </span>
                            )}
                          </span>
                          <span className="font-medium">${seat.price}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="border-t pt-3">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    ${getTotalPrice().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-600">Service Fee (5%)</span>
                  <span className="font-medium">
                    ${(getTotalPrice() * 0.05).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-[#00C16A]">
                    ${(getTotalPrice() * 1.05).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleProceedToCheckout}
                disabled={selectedSeats.length === 0}
                className="w-full bg-[#00C16A] hover:bg-[#00a859] h-11"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Proceed to Checkout
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Seats will be held for {formatTime(timeRemaining)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
