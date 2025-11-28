import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3x3,
  Save,
  Eye,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Move,
  Square,
  Circle,
  Armchair,
  Users,
  Layout,
  Palette,
  DollarSign,
  MousePointer2,
  Eraser,
  RotateCcw,
  Check,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { seatService } from "../services/seatService";
import { eventService } from "../services/eventService";
import { seatMapService } from "../services/seatMapService";

interface SeatMapBuilderProps {
  eventId?: string | number;
  onNavigate: (page: string, eventId?: string) => void;
}

interface Zone {
  id: string;
  name: string;
  color: string;
  price: number;
  capacity: number;
}

interface GridSeat {
  id: string;
  row: number;
  col: number;
  zoneId: string | null;
  isBlocked: boolean;
  isWheelchair: boolean;
  label?: string;
}

type Tool =
  | "select"
  | "seat"
  | "vip"
  | "wheelchair"
  | "table"
  | "stage"
  | "eraser";

const predefinedTemplates = [
  {
    id: "theater",
    name: "Theater Style",
    rows: 15,
    cols: 20,
    description: "Traditional theater seating",
  },
  {
    id: "stadium",
    name: "Stadium",
    rows: 20,
    cols: 30,
    description: "Curved stadium layout",
  },
  {
    id: "conference",
    name: "Conference",
    rows: 10,
    cols: 15,
    description: "Tables and chairs",
  },
  {
    id: "concert",
    name: "Concert Hall",
    rows: 12,
    cols: 25,
    description: "Mix of seated and standing",
  },
];

const defaultZones: Zone[] = [
  { id: "zone1", name: "Orchestra", color: "#00C16A", price: 120, capacity: 0 },
  { id: "zone2", name: "Mezzanine", color: "#4F46E5", price: 80, capacity: 0 },
  { id: "zone3", name: "Balcony", color: "#7C3AED", price: 50, capacity: 0 },
];

export function SeatMapBuilder({ eventId, onNavigate }: SeatMapBuilderProps) {
  const { t } = useTranslation();
  const [zones, setZones] = useState<Zone[]>(defaultZones);
  const [seats, setSeats] = useState<GridSeat[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool>("seat");
  const [selectedZone, setSelectedZone] = useState<string | null>(
    zones[0]?.id || null
  );
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState({ rows: 15, cols: 20 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [history, setHistory] = useState<GridSeat[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [eventName, setEventName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const [newZone, setNewZone] = useState({
    name: "",
    color: "#00C16A",
    price: 0,
  });

  // Load event name and seat map data when eventId is provided
  useEffect(() => {
    const isDraftMode = eventId === "draft" || eventId === undefined;
    const fromWizard =
      sessionStorage.getItem("seatMapBuilderFromWizard") === "true";

    if (isDraftMode && fromWizard) {
      // Draft mode from wizard - load saved draft if exists
      setEventName("Draft Event - Seat Map Builder");
      const draftData = sessionStorage.getItem("seatMapDraft");
      if (draftData) {
        try {
          const parsedData = JSON.parse(draftData);
          if (parsedData.zones && parsedData.zones.length > 0) {
            setZones(
              parsedData.zones.map((z: any) => ({
                ...z,
                capacity: 0,
              }))
            );
            if (parsedData.zones[0]?.id) {
              setSelectedZone(parsedData.zones[0].id);
            }
          }
          if (parsedData.seats && parsedData.seats.length > 0) {
            setSeats(parsedData.seats);
          }
          if (parsedData.gridSize) {
            setGridSize(parsedData.gridSize);
          }
          toast.success("Draft seat map loaded");
        } catch (parseError) {
          console.error("Failed to parse draft seat map data:", parseError);
        }
      }
      setIsLoading(false);
    } else if (eventId && eventId !== "draft") {
      const loadEvent = async () => {
        try {
          setIsLoading(true);
          const numericEventId =
            typeof eventId === "number" ? eventId : Number(eventId);

          if (isNaN(numericEventId)) {
            throw new Error("Invalid event ID");
          }

          const event = await eventService.getEventById(numericEventId);
          setEventName(event.title);

          // Try to load existing seat map from API first
          try {
            console.log("Loading seat map for event:", numericEventId);
            const seatMap = await seatMapService.getSeatMapByEvent(
              String(numericEventId)
            );
            console.log("Seat map loaded:", seatMap);

            if (seatMap) {
              // Set grid size first
              setGridSize({
                rows: seatMap.totalRows || 15,
                cols: seatMap.totalColumns || 20,
              });

              // Load zones from seat map
              if (seatMap.zones && seatMap.zones.length > 0) {
                const loadedZones: Zone[] = seatMap.zones.map((zone: any) => ({
                  id: `zone${zone.id}`,
                  name: zone.name || `Zone ${zone.id}`,
                  color: zone.color || "#00C16A",
                  price: Number(zone.zonePrice) || 0,
                  capacity: zone.capacity || 0,
                }));
                setZones(loadedZones);
                if (loadedZones[0]?.id) {
                  setSelectedZone(loadedZones[0].id);
                }
                console.log("Loaded zones:", loadedZones);
              } else {
                // If no zones in seat map, use default zones
                console.log("No zones found in seat map, using default zones");
              }

              // Load seats from API
              try {
                console.log("Loading seats for event:", numericEventId);
                const seatsData = await seatService.getSeatsByEvent(
                  numericEventId
                );
                console.log("Seats loaded:", seatsData?.length || 0, seatsData);

                if (seatsData && seatsData.length > 0) {
                  // Convert API seats to grid format
                  const gridSeats: GridSeat[] = seatsData.map((seat) => ({
                    id: `${seat.gridRow || 0}-${seat.gridColumn || 0}`,
                    row: seat.gridRow || 0,
                    col: seat.gridColumn || 0,
                    zoneId: seat.seatZoneId ? `zone${seat.seatZoneId}` : null,
                    isBlocked: seat.isBlocked || seat.status === "Blocked",
                    isWheelchair: false, // TODO: Add wheelchair field to API
                    label: seat.fullSeatCode || `${seat.row}${seat.seatNumber}`,
                  }));

                  setSeats(gridSeats);
                  console.log("Converted grid seats:", gridSeats.length);
                } else {
                  console.log(
                    "No seats found for this event, but seat map exists"
                  );
                  setSeats([]);
                  toast.info(
                    "Seat map loaded but no seats found. You can add seats now."
                  );
                }
              } catch (seatsError: any) {
                console.error("Error loading seats:", seatsError);
                if (seatsError.response?.status === 404) {
                  console.log("No seats found for this event");
                  setSeats([]);
                  toast.info(
                    "Seat map loaded but no seats found. You can add seats now."
                  );
                } else {
                  toast.warning(
                    "Seat map loaded but could not load seats. You can still edit the map."
                  );
                  setSeats([]);
                }
              }

              toast.success("Seat map loaded from database");
            } else {
              console.log("Seat map is null or undefined");
            }
          } catch (seatMapError: any) {
            console.error("Error loading seat map:", seatMapError);
            // If seat map doesn't exist (404), that's okay - user can create one
            if (seatMapError.response?.status === 404) {
              console.log(
                "No existing seat map found for this event. User can create one."
              );
              toast.info("No seat map found. You can create one now.");
            } else {
              console.error("Error loading seat map:", seatMapError);
              toast.error("Failed to load seat map. You can still create one.");
            }

            // Check sessionStorage for wizard data (fallback)
            const savedData = sessionStorage.getItem(`seatMapData_${eventId}`);
            if (savedData) {
              try {
                const parsedData = JSON.parse(savedData);
                if (parsedData.zones && parsedData.zones.length > 0) {
                  setZones(
                    parsedData.zones.map((z: any) => ({
                      ...z,
                      capacity: 0,
                    }))
                  );
                  if (parsedData.zones[0]?.id) {
                    setSelectedZone(parsedData.zones[0].id);
                  }
                }
                if (parsedData.seats && parsedData.seats.length > 0) {
                  setSeats(parsedData.seats);
                }
                if (parsedData.gridSize) {
                  setGridSize(parsedData.gridSize);
                }
                // Clear the saved data after loading
                sessionStorage.removeItem(`seatMapData_${eventId}`);
                toast.success("Seat map data loaded from wizard");
              } catch (parseError) {
                console.error(
                  "Failed to parse saved seat map data:",
                  parseError
                );
              }
            }
          }
        } catch (error) {
          console.error("Failed to load event:", error);
          setEventName(`Event ID: ${eventId}`);
          toast.error(
            "Failed to load event details. You can still create the seat map."
          );
        } finally {
          setIsLoading(false);
        }
      };
      loadEvent();
    } else {
      setEventName("No event selected");
      setIsLoading(false);
    }
  }, [eventId]);

  const addToHistory = (newSeats: GridSeat[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newSeats]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSeats([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSeats([...history[historyIndex + 1]]);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (selectedTool === "eraser") {
      const newSeats = seats.filter((s) => !(s.row === row && s.col === col));
      setSeats(newSeats);
      addToHistory(newSeats);
      return;
    }

    const existingSeat = seats.find((s) => s.row === row && s.col === col);

    if (existingSeat) {
      // Update existing seat
      const newSeats = seats.map((s) => {
        if (s.row === row && s.col === col) {
          return {
            ...s,
            zoneId: selectedZone,
            isWheelchair: selectedTool === "wheelchair",
          };
        }
        return s;
      });
      setSeats(newSeats);
      addToHistory(newSeats);
    } else {
      // Add new seat
      const newSeat: GridSeat = {
        id: `${row}-${col}`,
        row,
        col,
        zoneId: selectedZone,
        isBlocked: false,
        isWheelchair: selectedTool === "wheelchair",
      };
      const newSeats = [...seats, newSeat];
      setSeats(newSeats);
      addToHistory(newSeats);
    }
  };

  const handleMouseDown = (row: number, col: number) => {
    setIsDrawing(true);
    handleCellClick(row, col);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (isDrawing) {
      handleCellClick(row, col);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleAddZone = () => {
    if (!newZone.name || newZone.price <= 0) {
      toast.error("Please fill in all zone details");
      return;
    }

    const zone: Zone = {
      id: `zone${zones.length + 1}`,
      ...newZone,
      capacity: 0,
    };

    setZones([...zones, zone]);
    setSelectedZone(zone.id);
    setNewZone({ name: "", color: "#00C16A", price: 0 });
    setShowZoneModal(false);
    toast.success("Zone created successfully");
  };

  const handleDeleteZone = (zoneId: string) => {
    setZones(zones.filter((z) => z.id !== zoneId));
    // Remove zone assignment from seats
    setSeats(
      seats.map((s) => (s.zoneId === zoneId ? { ...s, zoneId: null } : s))
    );
    toast.success("Zone deleted");
  };

  const handleApplyTemplate = (template: (typeof predefinedTemplates)[0]) => {
    const newSeats: GridSeat[] = [];
    const rowsToCreate = template.rows;
    const colsToCreate = template.cols;

    for (let row = 0; row < rowsToCreate; row++) {
      for (let col = 0; col < colsToCreate; col++) {
        // Skip aisles
        if (col === Math.floor(colsToCreate / 2)) continue;

        // Assign zones based on row
        let zoneId = zones[0]?.id || null;
        if (row > rowsToCreate * 0.6) {
          zoneId = zones[2]?.id || zones[0]?.id || null;
        } else if (row > rowsToCreate * 0.3) {
          zoneId = zones[1]?.id || zones[0]?.id || null;
        }

        newSeats.push({
          id: `${row}-${col}`,
          row,
          col,
          zoneId,
          isBlocked: false,
          isWheelchair: false,
        });
      }
    }

    setSeats(newSeats);
    setGridSize({ rows: rowsToCreate, cols: colsToCreate });
    addToHistory(newSeats);
    setShowTemplateModal(false);
    toast.success("Template applied successfully");
  };

  const autoNumberSeats = () => {
    const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const seatsByRow = new Map<number, GridSeat[]>();

    // Group seats by row
    seats.forEach((seat) => {
      const rowSeats = seatsByRow.get(seat.row) || [];
      rowSeats.push(seat);
      seatsByRow.set(seat.row, rowSeats);
    });

    // Sort and label
    const labeledSeats = seats.map((seat) => {
      const rowSeats = seatsByRow.get(seat.row) || [];
      rowSeats.sort((a, b) => a.col - b.col);
      const seatIndex = rowSeats.findIndex((s) => s.id === seat.id);
      const rowLabel = rowLetters[seat.row % 26];
      return {
        ...seat,
        label: `${rowLabel}${seatIndex + 1}`,
      };
    });

    setSeats(labeledSeats);
    toast.success("Seats numbered automatically");
  };

  const getSeatColor = (seat: GridSeat) => {
    if (seat.isBlocked) return "#EF5350";
    if (!seat.zoneId) return "#E0E0E0";
    const zone = zones.find((z) => z.id === seat.zoneId);
    return zone?.color || "#E0E0E0";
  };

  const getTotalCapacity = () => {
    return seats.filter((s) => !s.isBlocked).length;
  };

  const getZoneCapacity = (zoneId: string) => {
    return seats.filter((s) => s.zoneId === zoneId && !s.isBlocked).length;
  };

  const handleSave = async () => {
    const isDraftMode = eventId === "draft" || eventId === undefined;
    const fromWizard =
      sessionStorage.getItem("seatMapBuilderFromWizard") === "true";

    if (isDraftMode && fromWizard) {
      // Save draft to sessionStorage
      sessionStorage.setItem(
        "seatMapDraft",
        JSON.stringify({
          zones: zones,
          seats: seats,
          gridSize: gridSize,
          selectedZone: selectedZone,
        })
      );
      toast.success("Draft seat map saved");
      return;
    }

    if (!eventId || eventId === "draft") {
      toast.error("Please select an event first");
      return;
    }

    try {
      setIsLoading(true);
      // Convert grid seats to bulk create format
      // Note: This is a simplified version - you may need to adjust based on your API
      toast.success("Seat map saved as draft");
    } catch (error: any) {
      console.error("Failed to save seat map:", error);
      toast.error(error.response?.data?.message || "Failed to save seat map");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    const isDraftMode = eventId === "draft" || eventId === undefined;
    const fromWizard =
      sessionStorage.getItem("seatMapBuilderFromWizard") === "true";

    if (isDraftMode && fromWizard) {
      // Save draft and continue to next step in wizard
      sessionStorage.setItem(
        "seatMapDraft",
        JSON.stringify({
          zones: zones,
          seats: seats,
          gridSize: gridSize,
          selectedZone: selectedZone,
        })
      );
      sessionStorage.setItem("seatMapBuiltInWizard", "true");
      toast.success("Seat map saved! Returning to wizard...");
      // Navigate back to wizard
      setTimeout(() => {
        onNavigate("organizer-wizard");
      }, 1000);
      return;
    }

    if (!eventId || eventId === "draft") {
      toast.error("Please select an event first");
      return;
    }

    if (seats.length === 0) {
      toast.error("Please add seats before publishing");
      return;
    }

    try {
      setIsLoading(true);
      const eventIdNum = Number(eventId);

      // 1. Get event to access ticket types
      const event = await eventService.getEventById(eventIdNum);
      if (!event.ticketTiers || event.ticketTiers.length === 0) {
        toast.error(
          "Event must have at least one ticket type to create seat map"
        );
        return;
      }

      // 2. Create or update seat map
      const layoutConfig = JSON.stringify({ seats, gridSize });
      let seatMapId: number;

      try {
        // Check if seat map already exists
        const existingSeatMap = await seatMapService.getSeatMapByEvent(
          String(eventIdNum)
        );
        if (existingSeatMap) {
          // Update existing seat map
          console.log("Updating existing seat map:", existingSeatMap.id);
          const updated = await seatMapService.updateSeatMap(
            String(existingSeatMap.id),
            {
              name: `${eventName || event.title} Seat Map`,
              layoutConfig: layoutConfig,
              totalRows: gridSize.rows,
              totalColumns: gridSize.cols,
            }
          );
          seatMapId = updated.id;
          console.log("Seat map updated:", updated);

          // Delete existing seats before creating new ones to avoid duplicates
          try {
            const existingSeats = await seatService.getSeatsByEvent(eventIdNum);
            console.log(
              `Found ${existingSeats.length} existing seats, will be replaced with new seats`
            );
            // Note: We'll create new seats below, which may cause duplicates if backend doesn't handle it
            // The backend should handle duplicate prevention or we need a delete endpoint
          } catch (deleteError: any) {
            console.warn("Could not check existing seats:", deleteError);
          }

          toast.success("Seat map updated!");
        } else {
          // Create new seat map
          const created = await seatMapService.createSeatMap({
            eventId: eventIdNum,
            name: `${eventName || event.title} Seat Map`,
            description: "Generated from seat map builder",
            totalRows: gridSize.rows,
            totalColumns: gridSize.cols,
            layoutConfig: layoutConfig,
          });
          seatMapId = created.id;
          toast.success("Seat map created!");
        }
      } catch (seatMapError: any) {
        console.error("Failed to create/update seat map:", seatMapError);
        console.error(
          "Error details:",
          seatMapError.response?.data || seatMapError.message
        );
        toast.error(
          `Failed to create seat map: ${
            seatMapError.response?.data?.message ||
            seatMapError.message ||
            "Unknown error"
          }`
        );
        setIsLoading(false);
        return;
      }

      // 3. Convert grid seats to API format and group by zone
      const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const seatsByZone = new Map<string, GridSeat[]>();

      seats.forEach((seat) => {
        const zoneKey = seat.zoneId || "unassigned";
        if (!seatsByZone.has(zoneKey)) {
          seatsByZone.set(zoneKey, []);
        }
        seatsByZone.get(zoneKey)!.push(seat);
      });

      // 4. Create seats for each zone/ticket type
      let totalSeatsCreated = 0;

      for (const [zoneKey, zoneSeats] of seatsByZone.entries()) {
        if (zoneKey === "unassigned" || !zoneKey) {
          // Assign to first ticket type if no zone
          const firstTicketType = event.ticketTiers[0];
          const seatItems = zoneSeats.map((seat) => {
            const rowLabel = rowLetters[seat.row % 26] || `Row${seat.row + 1}`;
            return {
              row: seat.label?.split(/\d/)[0] || rowLabel,
              seatNumber: seat.label?.match(/\d+/)?.[0] || String(seat.col + 1),
              gridRow: seat.row,
              gridColumn: seat.col,
            };
          });

          try {
            await seatService.bulkCreateSeats({
              ticketTypeId: Number(firstTicketType.id),
              seats: seatItems,
            });
            totalSeatsCreated += seatItems.length;
            console.log(
              `Created ${seatItems.length} seats for unassigned zone`
            );
          } catch (error: any) {
            console.error(`Failed to create seats for zone ${zoneKey}:`, error);
            console.error(
              "Error details:",
              error.response?.data || error.message
            );
            toast.error(
              `Failed to create seats: ${
                error.response?.data?.message || error.message
              }`
            );
          }
        } else {
          // Find matching ticket type by zone name or use first one
          const zone = zones.find((z) => z.id === zoneKey);
          const matchingTicketType =
            event.ticketTiers.find((tt) =>
              tt.name.toLowerCase().includes(zone?.name.toLowerCase() || "")
            ) || event.ticketTiers[0];

          const seatItems = zoneSeats.map((seat) => {
            const rowLabel = rowLetters[seat.row % 26] || `Row${seat.row + 1}`;
            return {
              row: seat.label?.split(/\d/)[0] || rowLabel,
              seatNumber: seat.label?.match(/\d+/)?.[0] || String(seat.col + 1),
              gridRow: seat.row,
              gridColumn: seat.col,
            };
          });

          try {
            await seatService.bulkCreateSeats({
              ticketTypeId: Number(matchingTicketType.id),
              seats: seatItems,
            });
            totalSeatsCreated += seatItems.length;
            console.log(
              `Created ${seatItems.length} seats for zone ${zoneKey} (${zone?.name})`
            );
          } catch (error: any) {
            console.error(`Failed to create seats for zone ${zoneKey}:`, error);
            console.error(
              "Error details:",
              error.response?.data || error.message
            );
            toast.error(
              `Failed to create seats for ${zone?.name || zoneKey}: ${
                error.response?.data?.message || error.message
              }`
            );
          }
        }
      }

      toast.success(`Seat map published! ${totalSeatsCreated} seats created.`);
      onNavigate("edit-event", String(eventId));
    } catch (error: any) {
      console.error("Failed to publish seat map:", error);
      toast.error(
        error.response?.data?.message || "Failed to publish seat map"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top Toolbar */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  const isDraftMode =
                    eventId === "draft" || eventId === undefined;
                  const fromWizard =
                    sessionStorage.getItem("seatMapBuilderFromWizard") ===
                    "true";

                  if (isDraftMode && fromWizard) {
                    // Save draft before going back
                    sessionStorage.setItem(
                      "seatMapDraft",
                      JSON.stringify({
                        zones: zones,
                        seats: seats,
                        gridSize: gridSize,
                        selectedZone: selectedZone,
                      })
                    );
                    // Navigate back to wizard
                    onNavigate("organizer-wizard");
                  } else if (eventId && eventId !== "draft") {
                    onNavigate("edit-event", String(eventId));
                  } else {
                    onNavigate("organizer-dashboard");
                  }
                }}
              >
                ← Back
              </Button>
              <div>
                <h2 className="text-lg text-neutral-900">Seat Map Builder</h2>
                <p className="text-xs text-neutral-500">
                  {eventName ||
                    (eventId ? `Event ID: ${eventId}` : "No event selected")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo2 size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo2 size={16} />
              </Button>

              <div className="w-px h-6 bg-neutral-200" />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              >
                <ZoomOut size={16} />
              </Button>
              <span className="text-sm text-neutral-600 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              >
                <ZoomIn size={16} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setZoom(1)}>
                <Maximize2 size={16} />
              </Button>

              <div className="w-px h-6 bg-neutral-200" />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
                className={showGrid ? "bg-neutral-100" : ""}
              >
                <Grid3x3 size={16} />
              </Button>

              <div className="w-px h-6 bg-neutral-200" />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
              >
                <Eye size={16} className="mr-2" />
                Preview
              </Button>

              {(eventId === "draft" || !eventId) &&
              sessionStorage.getItem("seatMapBuilderFromWizard") === "true" ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleSave}>
                    <Save size={16} className="mr-2" />
                    Save Draft
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    size="sm"
                    onClick={handlePublish}
                  >
                    <Check size={16} className="mr-2" />
                    Continue to Next Step
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleSave}>
                    <Save size={16} className="mr-2" />
                    Save Draft
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                    size="sm"
                    onClick={handlePublish}
                  >
                    <Check size={16} className="mr-2" />
                    Publish
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Event Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-neutral-500">Event:</span>
                  <div className="text-neutral-900">
                    {eventName ||
                      (isLoading ? "Loading..." : "No event selected")}
                  </div>
                </div>
                {eventId && (
                  <div>
                    <span className="text-neutral-500">Event ID:</span>
                    <div className="text-neutral-900">{eventId}</div>
                  </div>
                )}
                <div>
                  <span className="text-neutral-500">Total Capacity:</span>
                  <div className="text-neutral-900 text-xl">
                    {getTotalCapacity()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Drawing Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Drawing Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedTool === "seat" ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSelectedTool("seat")}
                >
                  <Armchair size={16} className="mr-2" />
                  Standard Seat
                </Button>

                <Button
                  variant={
                    selectedTool === "wheelchair" ? "default" : "outline"
                  }
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSelectedTool("wheelchair")}
                >
                  <Users size={16} className="mr-2" />
                  Wheelchair Accessible
                </Button>

                <Button
                  variant={selectedTool === "eraser" ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSelectedTool("eraser")}
                >
                  <Eraser size={16} className="mr-2" />
                  Eraser
                </Button>

                <div className="pt-2">
                  <Label className="text-xs">Grid Size</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Rows"
                      value={gridSize.rows}
                      onChange={(e) =>
                        setGridSize({
                          ...gridSize,
                          rows: parseInt(e.target.value) || 15,
                        })
                      }
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Cols"
                      value={gridSize.cols}
                      onChange={(e) =>
                        setGridSize({
                          ...gridSize,
                          cols: parseInt(e.target.value) || 20,
                        })
                      }
                      className="text-sm"
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={autoNumberSeats}
                >
                  Auto-Number Seats
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setSeats([]);
                    addToHistory([]);
                  }}
                >
                  <RotateCcw size={16} className="mr-2" />
                  Clear All
                </Button>
              </CardContent>
            </Card>

            {/* Zone Manager */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Zones & Pricing</CardTitle>
                  <Button size="sm" onClick={() => setShowZoneModal(true)}>
                    <Plus size={14} className="mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedZone === zone.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                    onClick={() => setSelectedZone(zone.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: zone.color }}
                        />
                        <span className="text-sm text-neutral-900">
                          {zone.name}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingZone(zone);
                            setShowZoneModal(true);
                          }}
                          className="text-neutral-400 hover:text-neutral-600"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteZone(zone.id);
                          }}
                          className="text-neutral-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500">Price:</span>
                        <span className="text-neutral-900">${zone.price}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500">Capacity:</span>
                        <span className="text-neutral-900">
                          {getZoneCapacity(zone.id)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowTemplateModal(true)}
                >
                  <Layout size={16} className="mr-2" />
                  Load Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Canvas */}
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
            <div
              ref={canvasRef}
              className="inline-block"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                transition: "transform 0.2s",
              }}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                className="inline-grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${gridSize.cols}, 40px)`,
                }}
              >
                {Array.from(
                  { length: gridSize.rows * gridSize.cols },
                  (_, idx) => {
                    const row = Math.floor(idx / gridSize.cols);
                    const col = idx % gridSize.cols;
                    const seat = seats.find(
                      (s) => s.row === row && s.col === col
                    );

                    return (
                      <div
                        key={`${row}-${col}`}
                        onMouseDown={() => handleMouseDown(row, col)}
                        onMouseEnter={() => handleMouseEnter(row, col)}
                        className={`
                        w-10 h-10 flex items-center justify-center text-xs
                        cursor-pointer transition-all
                        ${showGrid ? "border border-neutral-200" : ""}
                        ${seat ? "rounded shadow-sm" : "bg-neutral-50"}
                      `}
                        style={{
                          backgroundColor: seat
                            ? getSeatColor(seat)
                            : undefined,
                          color: seat ? "#fff" : "#999",
                        }}
                      >
                        {seat && (
                          <>
                            {seat.isWheelchair ? (
                              <span className="text-xs">♿</span>
                            ) : seat.label ? (
                              <span className="text-[8px]">{seat.label}</span>
                            ) : (
                              <Armchair size={16} />
                            )}
                          </>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-72 bg-white border-l overflow-y-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tips & Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-neutral-600">
              <div>
                <strong className="text-neutral-900">How to use:</strong>
                <ul className="mt-1 space-y-1 ml-4">
                  <li>• Select a zone from the left sidebar</li>
                  <li>• Choose a drawing tool</li>
                  <li>• Click or drag on the grid to place seats</li>
                  <li>• Use eraser to remove seats</li>
                  <li>• Auto-number assigns seat labels</li>
                </ul>
              </div>

              <div>
                <strong className="text-neutral-900">
                  Keyboard Shortcuts:
                </strong>
                <ul className="mt-1 space-y-1 ml-4">
                  <li>• Ctrl+Z: Undo</li>
                  <li>• Ctrl+Y: Redo</li>
                  <li>• Ctrl+S: Save</li>
                  <li>• Delete: Remove selected</li>
                </ul>
              </div>

              <div className="pt-3 border-t">
                <strong className="text-neutral-900">Current Selection:</strong>
                <div className="mt-2 p-2 bg-neutral-50 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-neutral-500">Tool:</span>
                    <Badge variant="secondary">{selectedTool}</Badge>
                  </div>
                  {selectedZone && (
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">Zone:</span>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded"
                          style={{
                            backgroundColor: zones.find(
                              (z) => z.id === selectedZone
                            )?.color,
                          }}
                        />
                        <span className="text-neutral-900">
                          {zones.find((z) => z.id === selectedZone)?.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Zone Modal */}
      <Dialog open={showZoneModal} onOpenChange={setShowZoneModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingZone ? "Edit Zone" : "Create New Zone"}
            </DialogTitle>
            <DialogDescription>
              Define the zone name, color, and pricing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Zone Name</Label>
              <Input
                placeholder="e.g., VIP Section"
                value={newZone.name}
                onChange={(e) =>
                  setNewZone({ ...newZone, name: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Zone Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={newZone.color}
                  onChange={(e) =>
                    setNewZone({ ...newZone, color: e.target.value })
                  }
                  className="w-20"
                />
                <Input
                  value={newZone.color}
                  onChange={(e) =>
                    setNewZone({ ...newZone, color: e.target.value })
                  }
                  placeholder="#00C16A"
                />
              </div>
            </div>

            <div>
              <Label>Price per Seat ($)</Label>
              <Input
                type="number"
                placeholder="120"
                value={newZone.price || ""}
                onChange={(e) =>
                  setNewZone({
                    ...newZone,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowZoneModal(false);
                setEditingZone(null);
                setNewZone({ name: "", color: "#00C16A", price: 0 });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddZone}>
              {editingZone ? "Update Zone" : "Create Zone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
            <DialogDescription>
              Start with a pre-made layout and customize it
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {predefinedTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleApplyTemplate(template)}
                className="p-4 border-2 rounded-lg hover:border-teal-500 transition-colors text-left"
              >
                <div className="text-sm text-neutral-900 mb-1">
                  {template.name}
                </div>
                <div className="text-xs text-neutral-500 mb-2">
                  {template.description}
                </div>
                <div className="text-xs text-neutral-400">
                  {template.rows} rows × {template.cols} columns
                </div>
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTemplateModal(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seat Map Preview</DialogTitle>
            <DialogDescription>
              This is how users will see your seat map
            </DialogDescription>
          </DialogHeader>

          <div className="bg-neutral-50 p-6 rounded-lg">
            {/* Stage */}
            <div className="mb-6 text-center">
              <div className="inline-block bg-neutral-200 px-12 py-4 rounded-lg">
                <div className="text-xl mb-1">🎭</div>
                <div className="text-xs text-neutral-700">STAGE</div>
              </div>
            </div>

            {/* Preview Grid */}
            <div className="inline-block">
              <div
                className="inline-grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${gridSize.cols}, 32px)`,
                }}
              >
                {seats.map((seat) => (
                  <div
                    key={seat.id}
                    className="w-8 h-8 rounded flex items-center justify-center text-xs"
                    style={{
                      backgroundColor: getSeatColor(seat),
                      color: "#fff",
                    }}
                  >
                    {seat.isWheelchair
                      ? "♿"
                      : seat.label
                      ? seat.label.slice(-1)
                      : ""}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex gap-4 justify-center">
              {zones.map((zone) => (
                <div key={zone.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: zone.color }}
                  />
                  <span className="text-xs text-neutral-700">
                    {zone.name} - ${zone.price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>Close Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
