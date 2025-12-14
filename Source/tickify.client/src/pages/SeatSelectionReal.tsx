import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as signalR from "@microsoft/signalr";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Loader2,
  MapPin,
  Calendar,
  ArrowLeft,
  ShoppingCart,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  seatMapService,
  type SeatDto,
  type SeatZoneDto,
  type SeatMapDto,
} from "../services/seatMapService";
import { eventService } from "../services/eventService";
import type { Event } from "../types";
import { formatVND } from "../utils/currency";

interface SeatSelectionRealProps {
  eventId?: string;
  onNavigate: (page: string, eventId?: string) => void;
}

export function SeatSelectionReal({
  eventId,
  onNavigate,
}: SeatSelectionRealProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState<SeatDto[]>([]);
  const [seatMap, setSeatMap] = useState<SeatMapDto | null>(null);
  const [zones, setZones] = useState<SeatZoneDto[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes (matches backend)
  const [seatConnection, setSeatConnection] =
    useState<signalR.HubConnection | null>(null);
  const [reservationExpiresAt, setReservationExpiresAt] = useState<Date | null>(
    null
  );
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasExtendedReservation, setHasExtendedReservation] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  // Refs to track latest values for cleanup
  const selectedSeatsRef = useRef<number[]>([]);
  const seatMapRef = useRef<SeatMapDto | null>(null);
  const isNavigatingRef = useRef(false);

  // BroadcastChannel for multiple tabs warning
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Update refs when state changes
  useEffect(() => {
    selectedSeatsRef.current = selectedSeats;
    seatMapRef.current = seatMap;
    isNavigatingRef.current = isNavigating;
  }, [selectedSeats, seatMap, isNavigating]);

  useEffect(() => {
    // Get current user ID from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    // Handle both 'id' and 'userId' properties (support different user object structures)
    const userId =
      user.id ||
      (user.userId &&
        (typeof user.userId === "string"
          ? parseInt(user.userId)
          : user.userId));

    if (userId) {
      setCurrentUserId(userId);
    }

    // Clear any old session data on mount (fresh start)
    sessionStorage.removeItem("selectedSeats");
    sessionStorage.removeItem("reservationExpiresAt");

    if (eventId) {
      // Auto-release seats BEFORE loading data to ensure clean state
      const initializePage = async () => {
        try {
          const token =
            localStorage.getItem("token") || localStorage.getItem("authToken");

          if (!token || !userId) {
            loadSeatData(eventId);
            return;
          }

          // First, get the seat map and seats
          const seatMapData = await seatMapService.getSeatMapByEvent(eventId);
          const seatsData = await seatMapService.getEventSeats(eventId);

          // Find seats reserved by current user
          const userReservedSeats = seatsData.filter((seat) => {
            return (
              seat.status === "Reserved" && seat.reservedByUserId === userId
            );
          });

          if (userReservedSeats.length > 0) {
            const seatIds = userReservedSeats.map((s) => s.id);

            try {
              await seatMapService.releaseSeats(seatMapData.id, seatIds);
              // Wait a bit for SignalR to update before loading fresh data
              await new Promise((resolve) => setTimeout(resolve, 300));
            } catch (error) {}
          }
        } catch (error) {
        } finally {
          // Load seat data after release attempt
          loadSeatData(eventId);
        }
      };

      initializePage();
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
        reason?: string;
      }) => {
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

        // Remove from selection if taken by ANOTHER user OR expired
        if (
          update.reason === "ReservationExpired" ||
          (update.reservedByUserId &&
            currentUserId &&
            update.reservedByUserId !== currentUserId)
        ) {
          setSelectedSeats((prev) => {
            const filtered = prev.filter(
              (seatId) => !update.seatIds.includes(seatId)
            );
            if (
              filtered.length !== prev.length &&
              update.reason === "ReservationExpired"
            ) {
              // Clear session storage if our seats expired
              sessionStorage.removeItem("selectedSeats");
              sessionStorage.removeItem("reservationExpiresAt");
            }
            return filtered;
          });
        }
      }
    );

    // Handle reconnection - refresh seat data
    connection.onreconnected(() => {
      if (eventId) {
        loadSeatData(eventId);
      }
      alert(t("seat.selection.alerts.connectionRestored"));
    });

    connection.onreconnecting(() => {
      alert(t("seat.selection.alerts.connectionLost"));
    });

    connection
      .start()
      .then(() => {
        connection.invoke("JoinEventSeatMap", parseInt(eventId));
        setSeatConnection(connection);
      })
      .catch(() => {
        // Connection failed
      });

    return () => {
      // Cleanup SignalR connection safely
      const cleanup = async () => {
        try {
          if (connection.state === signalR.HubConnectionState.Connected) {
            await connection.invoke("LeaveEventSeatMap", parseInt(eventId));
            await connection.stop();
          } else if (
            connection.state === signalR.HubConnectionState.Connecting
          ) {
            // Wait a bit for connection to establish before stopping
            setTimeout(async () => {
              try {
                if (connection.state === signalR.HubConnectionState.Connected) {
                  await connection.stop();
                }
              } catch {
                // Ignore errors during cleanup
              }
            }, 100);
          }
        } catch {
          // Ignore errors during cleanup - connection may already be closed
        }
      };
      cleanup();
    };
  }, [eventId, currentUserId]);

  // Setup BroadcastChannel for multiple tabs warning
  useEffect(() => {
    if (!eventId || typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel("tickify-seat-booking");
    broadcastChannelRef.current = channel;

    // Listen for messages from other tabs
    channel.onmessage = (event) => {
      if (
        event.data.type === "SEAT_SELECTED" &&
        event.data.eventId === eventId
      ) {
        alert(t("seat.selection.alerts.multipleTabsWarning"));
      }
    };

    // Notify other tabs when selecting seats
    if (selectedSeats.length > 0) {
      channel.postMessage({
        type: "SEAT_SELECTED",
        eventId,
        seatIds: selectedSeats,
        timestamp: Date.now(),
      });
    }

    return () => {
      channel.close();
    };
  }, [eventId, selectedSeats]);

  // Countdown timer when seats are selected
  useEffect(() => {
    if (selectedSeats.length === 0) {
      setReservationExpiresAt(null);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Release seats automatically when timer expires
          if (seatMap && selectedSeats.length > 0) {
            seatMapService
              .releaseSeats(seatMap.id, selectedSeats)
              .catch(() => {});
          }
          setSelectedSeats([]);
          sessionStorage.removeItem("selectedSeats");
          sessionStorage.removeItem("reservationExpiresAt");
          alert(t("seat.selection.alerts.timeExpired"));
          return 600; // Reset to 10 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSeats.length, seatMap]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Release seats when user leaves page (except when going to checkout)
  useEffect(() => {
    let hasReleasedOnUnmount = false;

    // Shared release function
    const releaseSeatsSync = () => {
      const seats = selectedSeatsRef.current;
      const map = seatMapRef.current;
      const navigating = isNavigatingRef.current;

      // Prevent double release
      if (hasReleasedOnUnmount) {
        return;
      }

      if (seats.length > 0 && !navigating && map) {
        hasReleasedOnUnmount = true;
        const token = localStorage.getItem("token");

        // Only release if user is authenticated
        if (!token) {
          return;
        }

        // Use fetch with keepalive for reliable request during page unload
        fetch(`http://localhost:5179/api/seatmaps/${map.id}/release`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(seats),
          keepalive: true,
        })
          .then(() => {})
          .catch((err) => {});

        // Clear session storage
        sessionStorage.removeItem("selectedSeats");
        sessionStorage.removeItem("reservationExpiresAt");
        sessionStorage.removeItem("eventId");
        sessionStorage.removeItem("totalPrice");
      } else {
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't prompt if navigating to checkout
      if (isNavigatingRef.current) return;

      // Show browser warning if seats are selected
      if (selectedSeatsRef.current.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handleUnload = () => {
      releaseSeatsSync();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    // Cleanup function when component unmounts
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);

      // Release seats on unmount (refresh, navigate away)
      releaseSeatsSync();
    };
  }, []); // Empty deps - use refs for latest values

  // Intercept back button
  const handleBackClick = () => {
    if (selectedSeats.length > 0) {
      setPendingNavigation(`/events/${eventId}`);
      setShowLeaveWarning(true);
    } else {
      onNavigate("event-detail", eventId);
    }
  };

  // Handle leave confirmation
  const handleConfirmLeave = async () => {
    setIsNavigating(true);

    // Release seats immediately when leaving
    if (selectedSeats.length > 0 && seatMap) {
      try {
        await seatMapService.releaseSeats(seatMap.id, selectedSeats);
      } catch (error) {}

      // Clear session storage
      sessionStorage.removeItem("selectedSeats");
      sessionStorage.removeItem("reservationExpiresAt");
    }

    setShowLeaveWarning(false);
    onNavigate("event-detail", eventId);
  };

  // Handle stay
  const handleStay = () => {
    setShowLeaveWarning(false);
    setPendingNavigation(null);
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

        // Check if event is sold out
        const availableSeats = seatsData.filter(
          (s) => s.status === "Available"
        );
        if (availableSeats.length === 0) {
          setError(t("seat.selection.noSeatsAvailable"));
          alert(t("seat.selection.alerts.soldOut"));
          setTimeout(() => {
            onNavigate("event-detail", id);
          }, 2000);
        }
      } catch (err) {
        setError("This event does not have a seat map configured yet.");
      }
    } catch (err) {
      setError("Failed to load event information");
    } finally {
      setLoading(false);
    }
  };

  const handleExtendReservation = async () => {
    if (!seatMap || selectedSeats.length === 0 || hasExtendedReservation) {
      return;
    }

    setIsExtending(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5179/api/seatmaps/${seatMap.id}/extend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(selectedSeats),
        }
      );

      if (response.ok) {
        // Add 5 minutes to current time remaining
        setTimeRemaining((prev) => prev + 300);
        setHasExtendedReservation(true);

        // Update expiration time in session
        if (reservationExpiresAt) {
          const newExpiresAt = new Date(
            reservationExpiresAt.getTime() + 5 * 60 * 1000
          );
          setReservationExpiresAt(newExpiresAt);
          sessionStorage.setItem(
            "reservationExpiresAt",
            newExpiresAt.toISOString()
          );
        }

        alert(t("seat.selection.alerts.reservationExtended"));
      } else {
        const data = await response.json();
        alert(data.message || t("seat.selection.alerts.failedToExtend"));
      }
    } catch (error) {
      alert(t("seat.selection.alerts.failedToExtend"));
    } finally {
      setIsExtending(false);
    }
  };

  const toggleSeat = async (seatId: number) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat) return;

    const isSelected = selectedSeats.includes(seatId);

    // If seat is already selected by current user, allow deselecting
    if (isSelected) {
      const newSelectedSeats = selectedSeats.filter((id) => id !== seatId);
      setSelectedSeats(newSelectedSeats);

      // Release this specific seat immediately
      if (seatMap) {
        try {
          await seatMapService.releaseSeats(seatMap.id, [seatId]);

          // Update session storage
          if (newSelectedSeats.length > 0) {
            sessionStorage.setItem(
              "selectedSeats",
              JSON.stringify(newSelectedSeats)
            );
            // Reset extension flag when deselecting seats
            setHasExtendedReservation(false);
          } else {
            // All seats deselected - clear everything
            sessionStorage.removeItem("selectedSeats");
            sessionStorage.removeItem("reservationExpiresAt");
            setReservationExpiresAt(null);
            setHasExtendedReservation(false);
            setTimeRemaining(600); // Reset timer
          }
        } catch (error) {
          // Revert selection on error
          setSelectedSeats(selectedSeats);
          alert(t("seat.selection.alerts.failedToRelease"));
        }
      }
      return;
    }

    // Check if seat can be selected
    const canSelect =
      seat.status === "Available" ||
      (seat.status === "Reserved" && seat.reservedByUserId === currentUserId);

    if (!canSelect) {
      alert(
        t("seat.selection.alerts.seatTakenByOther", {
          status: seat.status.toLowerCase(),
        })
      );
      return;
    }

    // Add seat to selection
    const newSelectedSeats = [...selectedSeats, seatId];
    setSelectedSeats(newSelectedSeats);

    // Reserve the newly selected seat
    if (seatMap) {
      try {
        await seatMapService.reserveSeats(seatMap.id, newSelectedSeats);

        // Set new expiration time (10 minutes from now)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        setReservationExpiresAt(expiresAt);
        setTimeRemaining(600); // Reset to 10 minutes
        setHasExtendedReservation(false); // Reset extension flag for new selection

        // Save to session storage
        sessionStorage.setItem(
          "selectedSeats",
          JSON.stringify(newSelectedSeats)
        );
        sessionStorage.setItem("reservationExpiresAt", expiresAt.toISOString());
      } catch (error) {
        // Revert selection if reservation fails
        setSelectedSeats(selectedSeats);
        alert(t("seat.selection.alerts.unableToReserve"));
      }
    }
  };

  const getSeatStatus = (seat: SeatDto) => {
    if (selectedSeats.includes(seat.id)) return "selected";
    return seat.status.toLowerCase();
  };

  const getSeatColor = (seat: SeatDto) => {
    const status = getSeatStatus(seat);

    // Priority colors
    if (status === "selected") return "#00C16A"; // Green for selected
    if (status === "sold" || status === "reserved") return "#DC2626"; // Red for unavailable

    // Wheelchair accessible seats - distinct blue color
    if (seat.isWheelchair && status === "available") return "#60A5FA"; // Blue-400

    // Zone-specific colors for available seats
    if (seat.zoneColor && status === "available") return seat.zoneColor;

    // Default gray for available seats without zone
    return "#E5E7EB";
  };

  const getTotalPrice = () => {
    return selectedSeats.reduce((total, seatId) => {
      const seat = seats.find((s) => s.id === seatId);
      return total + (seat?.price || 0);
    }, 0);
  };

  const handleProceedToCheckout = () => {
    if (selectedSeats.length === 0) {
      alert(t("seat.selection.alerts.selectAtLeastOne"));
      return;
    }

    // Set flag to prevent releasing seats
    setIsNavigating(true);

    // Store selected seats for booking
    sessionStorage.setItem("selectedSeats", JSON.stringify(selectedSeats));
    sessionStorage.setItem("eventId", eventId || "");
    sessionStorage.setItem("totalPrice", getTotalPrice().toString());

    // Keep reservation info for checkout
    if (reservationExpiresAt) {
      sessionStorage.setItem(
        "reservationExpiresAt",
        reservationExpiresAt.toISOString()
      );
    }

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
              // Allow clicking if already selected by current user (for deselection)
              selectedSeats.includes(seat.id)
                ? false
                : // Otherwise, disable if sold or reserved by another user
                  seat.status === "Sold" ||
                  (seat.status === "Reserved" &&
                    seat.reservedByUserId !== currentUserId)
            }
            className={`w-10 h-10 rounded text-xs font-medium transition-all border relative ${
              selectedSeats.includes(seat.id)
                ? "hover:scale-110 cursor-pointer" // Always clickable if selected
                : seat.status === "Sold" ||
                  (seat.status === "Reserved" &&
                    seat.reservedByUserId !== currentUserId)
                ? "cursor-not-allowed opacity-50"
                : "hover:scale-110 cursor-pointer"
            }`}
            style={{
              backgroundColor: getSeatColor(seat),
              color: getSeatStatus(seat) === "available" ? "#374151" : "white",
              borderColor:
                getSeatStatus(seat) === "selected" ? "#00C16A" : "#D1D5DB",
            }}
            title={`${seat.row}${seat.seatNumber} - ${formatVND(seat.price)}${
              seat.zoneName ? ` (${seat.zoneName})` : ""
            }${
              seat.isWheelchair
                ? ` - ${t("management.seat.selection.wheelchairAccessible")}`
                : ""
            }${
              selectedSeats.includes(seat.id)
                ? ` - ${t("management.seat.selection.clickToDeselect")}`
                : ""
            }`}
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
          <p className="text-gray-600">{t("seat.selection.loadingSeatMap")}</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">
              {error || t("seat.selection.eventNotFound")}
            </p>
            <Button onClick={() => onNavigate("home")}>
              {t("seat.selection.backToHome")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header with Event Banner */}
      <div className="relative h-48 flex-shrink-0 overflow-hidden">
        {/* Event banner as background */}
        {event?.image && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${event.image})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          </div>
        )}

        {/* Fallback solid color if no banner */}
        {!event?.image && (
          <div className="absolute inset-0 bg-purple-600">
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}

        <div className="relative h-full px-4 py-4 flex flex-col justify-between">
          <Button
            variant="ghost"
            className="self-start text-white hover:bg-white/20"
            onClick={handleBackClick}
          >
            <ArrowLeft size={20} className="mr-2" />
            {t("seat.selection.backToEvent")}
          </Button>

          <div className="text-white">
            <h1 className="text-2xl mb-1">
              {event?.title || t("management.seat.selection.selectSeats")}
            </h1>
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
            timeRemaining < 300
              ? "bg-red-600 text-white"
              : "bg-[#f4fc21] text-black"
          } py-3 shadow-lg transition-colors flex-shrink-0`}
        >
          <div className="flex items-center justify-center gap-3">
            <Clock size={20} />
            <span className="text-sm">
              {t("seat.selection.timeRemaining")}{" "}
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
              <CardTitle className="text-sm">
                {t("seat.selection.availableZones")}
              </CardTitle>
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
                        <span className="text-neutral-500">
                          {t("seat.selection.price")}:
                        </span>
                        <span className="font-medium text-neutral-900">
                          {formatVND(zone.zonePrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">
                          {t("seat.selection.available")}:
                        </span>
                        <span className="font-medium text-neutral-900">
                          {zone.availableSeats} / {zone.capacity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  {t("seat.selection.noZonesDefined")}
                </p>
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
                <div className="text-sm text-neutral-700">
                  {t("seat.selection.stage").toUpperCase()}
                </div>
              </div>
            </div>

            {/* Seat Grid */}
            {seats.length > 0 ? (
              <div className="inline-block">{renderSeatGrid()}</div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {t("seat.selection.noSeatsAvailable")}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Booking Summary */}
        <div className="w-80 bg-white border-l overflow-y-auto p-4 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {t("seat.selection.bookingSummary")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Legend */}
              <div className="pb-3 border-b">
                <div className="text-xs font-medium text-neutral-700 mb-2">
                  {t("seat.selection.legend")}
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-gray-200 border border-gray-300" />
                    <span>{t("seat.selection.available")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-[#00C16A]" />
                    <span>{t("seat.selection.selected")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-red-600" />
                    <span>{t("seat.selection.sold")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-blue-400 flex items-center justify-center text-xs text-white">
                      ♿
                    </div>
                    <span>{t("seat.selection.wheelchair")}</span>
                  </div>
                </div>
              </div>

              {/* Selected Seats */}
              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">
                  {t("seat.selection.selectedSeats")} ({selectedSeats.length})
                </div>
                {selectedSeats.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    {t("seat.selection.noSeatsSelected")}
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
                          <span className="font-medium">
                            {formatVND(seat.price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="border-t pt-3">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-600">
                    {t("seat.selection.subtotal")}
                  </span>
                  <span className="font-medium">
                    {formatVND(getTotalPrice())}
                  </span>
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-600">
                    {t("seat.selection.serviceFee")} (5%)
                  </span>
                  <span className="font-medium">
                    {formatVND(getTotalPrice() * 0.05)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t">
                  <span>{t("seat.selection.total")}</span>
                  <span className="text-[#00C16A]">
                    {formatVND(getTotalPrice() * 1.05)}
                  </span>
                </div>
              </div>

              {/* Extend Reservation Button */}
              {selectedSeats.length > 0 &&
                timeRemaining < 300 &&
                !hasExtendedReservation && (
                  <Button
                    onClick={handleExtendReservation}
                    disabled={isExtending}
                    variant="outline"
                    className="w-full mb-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    {isExtending
                      ? t("seat.selection.extending")
                      : t("seat.selection.extendTime") + " (+5 min)"}
                  </Button>
                )}

              {/* Checkout Button */}
              <Button
                onClick={handleProceedToCheckout}
                disabled={selectedSeats.length === 0}
                className="w-full bg-[#00C16A] hover:bg-[#00a859] h-11"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {t("seat.selection.proceedToCheckout")}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                {t("seat.selection.seatsWillBeHeld")}{" "}
                {formatTime(timeRemaining)}
                {hasExtendedReservation &&
                  " (" + t("seat.selection.extended") + ")"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Warning Dialog */}
      <Dialog open={showLeaveWarning} onOpenChange={setShowLeaveWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              {t("seat.selection.dialog.leavePageTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("seat.selection.dialog.leavePageMessage", {
                count: selectedSeats.length,
              })}
              <br />
              <br />
              <span className="font-medium text-red-600">
                {t("seat.selection.dialog.loseSeatsWarning")}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleStay}>
              {t("seat.selection.dialog.stayOnPage")}
            </Button>
            <Button
              onClick={handleConfirmLeave}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {t("seat.selection.dialog.leavePage")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
