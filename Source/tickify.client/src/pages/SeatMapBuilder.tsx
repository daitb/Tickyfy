import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { seatMapService } from "../services/seatMapService";
import { eventService } from "../services/eventService";
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
  AlertCircle,
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

interface SeatMapBuilderProps {
  onNavigate: (page: string, eventId?: string) => void;
  eventId?: string | null;
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

// No default zones - user must create zones matching their ticket types

export function SeatMapBuilder({
  onNavigate,
  eventId: eventIdProp,
}: SeatMapBuilderProps) {
  const { t } = useTranslation();
  // Extract numeric ID from eventId (could be "evt-1" or "1")
  const eventId = eventIdProp
    ? eventIdProp.includes("-")
      ? eventIdProp.split("-")[1]
      : eventIdProp
    : null;

  const [zones, setZones] = useState<Zone[]>([]); // Start with empty zones
  const [seatMapId, setSeatMapId] = useState<number | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState<GridSeat[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool>("seat");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState({ rows: 15, cols: 20 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [availableSeatMaps, setAvailableSeatMaps] = useState<any[]>([]);
  const [loadingSeatMaps, setLoadingSeatMaps] = useState(false);
  const [history, setHistory] = useState<GridSeat[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLDivElement>(null);

  const [newZone, setNewZone] = useState({
    name: "",
    color: "#00C16A",
    price: 0,
  });

  // Load existing seat map data on mount
  useEffect(() => {
    if (eventId) {
      loadSeatMapData();
    } else {
      setLoading(false);
    }
  }, [eventId]);

  const loadSeatMapData = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      console.log("[SeatMapBuilder] Loading data for event:", eventId);

      // Load event info
      const event = await eventService.getEventById(parseInt(eventId));
      setEventTitle(event.title);

      // Try to load existing seat map
      try {
        const seatMapData = await seatMapService.getSeatMapByEvent(eventId);
        console.log("[SeatMapBuilder] Loaded existing seat map:", seatMapData);

        setSeatMapId(parseInt(seatMapData.id.toString()));
        setGridSize({
          rows: seatMapData.totalRows,
          cols: seatMapData.totalColumns,
        });

        // Load zones from seat map
        if (seatMapData.zones && seatMapData.zones.length > 0) {
          console.log(
            "[SeatMapBuilder] Raw zones from API:",
            seatMapData.zones
          );
          const loadedZones: Zone[] = seatMapData.zones.map((z) => ({
            id: z.id.toString(),
            name: z.name,
            color: z.color || "#00C16A",
            price: z.zonePrice,
            capacity: z.capacity,
          }));
          console.log("[SeatMapBuilder] Mapped zones:", loadedZones);
          setZones(loadedZones);
          setSelectedZone(loadedZones[0]?.id || null);
        }

        // Load seats
        const seatsData = await seatMapService.getEventSeats(eventId);
        console.log("[SeatMapBuilder] Loaded seats:", seatsData.length);

        const loadedSeats: GridSeat[] = seatsData.map((s) => ({
          id: s.id.toString(),
          row: s.gridRow || 0,
          col: s.gridColumn || 0,
          zoneId: s.seatZoneId?.toString() || null,
          isBlocked: s.isBlocked,
          isWheelchair: s.isWheelchair || false, // Load wheelchair status from database
          label: s.fullSeatCode,
        }));

        setSeats(loadedSeats);
        addToHistory(loadedSeats);

        toast.success("Seat map loaded successfully");
      } catch (err: any) {
        // Handle 404 gracefully - this is expected for new seat maps
        if (
          err?.response?.status === 404 ||
          err?.message?.includes("not found")
        ) {
          console.log(
            "[SeatMapBuilder] No existing seat map, auto-creating zones from ticket types"
          );

          // AUTO-CREATE ZONES FROM TICKET TYPES
          if (event.ticketTiers && event.ticketTiers.length > 0) {
            const autoZones: Zone[] = event.ticketTiers.map((tt, index) => ({
              id: `zone-${tt.id || index}`,
              name: tt.name,
              color: ["#00C16A", "#4F46E5", "#7C3AED", "#EF4444", "#F59E0B"][
                index % 5
              ],
              price: tt.price || 0,
              capacity: 0, // Will be set when seats are placed
            }));
            setZones(autoZones);
            setSelectedZone(autoZones[0]?.id || null);
            console.log("[SeatMapBuilder] Auto-created zones:", autoZones);
            toast.success(
              `Auto-created ${autoZones.length} zones from ticket types`
            );
          } else {
            toast.info("Creating new seat map - add zones manually");
          }
        } else {
          console.error("[SeatMapBuilder] Error loading seat map:", err);
          toast.error("Failed to load seat map data");
        }
      }
    } catch (error) {
      console.error("Error loading seat map data:", error);
      toast.error("Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

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

    // Validate maximum price (50 million VND for payment gateway limit)
    const MAX_ZONE_PRICE = 50_000_000;
    if (newZone.price > MAX_ZONE_PRICE) {
      toast.error(
        `Zone price cannot exceed ${MAX_ZONE_PRICE.toLocaleString()} VND due to payment gateway limitations (MoMo: 50M VND max per transaction)`
      );
      return;
    }

    if (editingZone) {
      // Update existing zone
      setZones(
        zones.map((z) =>
          z.id === editingZone.id
            ? {
                ...z,
                name: newZone.name,
                color: newZone.color,
                price: newZone.price,
              }
            : z
        )
      );
      toast.success("Zone updated successfully");
    } else {
      // Create new zone
      const zone: Zone = {
        id: `zone${Date.now()}`,
        ...newZone,
        capacity: 0,
      };
      setZones([...zones, zone]);
      setSelectedZone(zone.id);
      toast.success("Zone created successfully");
    }

    setNewZone({ name: "", color: "#00C16A", price: 0 });
    setEditingZone(null);
    setShowZoneModal(false);
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
    // Blocked seats - red
    if (seat.isBlocked) return "#EF5350";

    // Wheelchair seats - distinct blue
    if (seat.isWheelchair) return "#60A5FA";

    // No zone assigned - gray
    if (!seat.zoneId) return "#E0E0E0";

    // Use zone color
    const zone = zones.find((z) => z.id === seat.zoneId);
    return zone?.color || "#E0E0E0";
  };

  // Calculate contrasting text color based on background
  const getTextColor = (bgColor: string) => {
    // Convert hex to RGB
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
  };

  const getTotalCapacity = () => {
    return seats.filter((s) => !s.isBlocked).length;
  };

  const getZoneCapacity = (zoneId: string) => {
    return seats.filter((s) => s.zoneId === zoneId && !s.isBlocked).length;
  };

  const handleSave = async () => {
    if (!eventId) {
      toast.error("Event ID is missing");
      return;
    }

    // Validate zones have proper names
    if (zones.length === 0) {
      toast.error("Please add at least one zone before saving");
      return;
    }

    const emptyZoneNames = zones.filter((z) => !z.name || z.name.trim() === "");
    if (emptyZoneNames.length > 0) {
      toast.error("All zones must have names");
      return;
    }

    // Validate zone prices before saving
    const MAX_ZONE_PRICE = 50_000_000;
    const invalidZones = zones.filter((z) => z.price > MAX_ZONE_PRICE);
    if (invalidZones.length > 0) {
      toast.error(
        `Zone prices cannot exceed ${MAX_ZONE_PRICE.toLocaleString()} VND. ` +
          `Invalid zones: ${invalidZones.map((z) => z.name).join(", ")}`
      );
      return;
    }

    try {
      // AUTO-UPDATE ZONE CAPACITIES from actual seat counts
      const updatedZones = zones.map((z) => ({
        ...z,
        capacity: getZoneCapacity(z.id), // Count actual seats assigned to this zone
      }));

      console.log(
        "[SeatMapBuilder] Saving zones with updated capacities:",
        updatedZones.map((z) => ({ name: z.name, capacity: z.capacity }))
      );

      // Include all seat properties including wheelchair status
      const layoutData = {
        zones: updatedZones.map((z) => ({
          id: z.id,
          name: z.name,
          color: z.color,
          price: z.price,
          capacity: z.capacity, // Now contains actual seat count
        })),
        seats: seats.map((s) => ({
          ...s,
          isWheelchair: s.isWheelchair || false,
          isBlocked: s.isBlocked || false,
        })),
      };
      console.log("[SeatMapBuilder] Saving layout:", layoutData);

      const payload = {
        eventId: eventId,
        name: `${eventTitle || "Event"} Seat Map`,
        description: "Seat map created with builder",
        totalRows: gridSize.rows,
        totalColumns: gridSize.cols,
        layoutConfig: JSON.stringify(layoutData),
      };

      if (seatMapId) {
        // Update existing
        await seatMapService.updateSeatMap(seatMapId.toString(), {
          ...payload,
          isActive: true,
        });
        toast.success("Seat map updated successfully");

        // Reload data to get updated zones and seats with DB IDs
        await loadSeatMapData();
      } else {
        // Create new
        const created = await seatMapService.createSeatMap(payload);
        const newSeatMapId = created.id;
        setSeatMapId(newSeatMapId);

        console.log(
          "[SeatMapBuilder] Created new seat map with ID:",
          newSeatMapId
        );
        toast.success("Seat map saved successfully");

        // Reload data to get zones and seats with DB IDs
        // Wait a bit for backend to finish processing
        await new Promise((resolve) => setTimeout(resolve, 500));
        await loadSeatMapData();
      }
    } catch (error) {
      console.error("Error saving seat map:", error);
      toast.error("Failed to save seat map");
    }
  };

  const handlePublish = async () => {
    if (seats.length === 0) {
      toast.error("Please add seats before publishing");
      return;
    }

    await handleSave();
    toast.success("Seat map published successfully!");
    
    // Navigate back to wizard with eventId after publishing
    setTimeout(() => {
      if (eventId) {
        onNavigate("organizer-wizard", eventId);
      } else {
        onNavigate("organizer-dashboard");
      }
    }, 1000);
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
                  if (eventId) {
                    onNavigate("organizer-wizard", eventId);
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
                  Summer Music Festival 2024
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

              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save size={16} className="mr-2" />
                Save Draft
              </Button>

              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                size="sm"
                onClick={handlePublish}
              >
                <Check size={16} className="mr-2" />
                Publish
              </Button>
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
                    Summer Music Festival 2024
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500">Venue:</span>
                  <div className="text-neutral-900">Madison Square Garden</div>
                </div>
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
                {/* Info Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="flex gap-2">
                    <AlertCircle
                      size={16}
                      className="text-blue-600 flex-shrink-0 mt-0.5"
                    />
                    <div className="text-xs text-blue-800">
                      <strong>Auto-Sync:</strong> Zones and ticket types are
                      automatically synchronized.
                      {eventTitle && (
                        <div className="mt-1 text-blue-700">
                          New zones will create matching ticket types
                          automatically.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedZone === zone.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedZone(zone.id);
                    }}
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
                            setNewZone({
                              name: zone.name,
                              color: zone.color,
                              price: zone.price,
                            });
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
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowTemplateModal(true)}
                >
                  <Layout size={16} className="mr-2" />
                  Load Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    setShowCopyModal(true);
                    setLoadingSeatMaps(true);
                    try {
                      // Get current user's organizer ID from auth service
                      const user = JSON.parse(
                        localStorage.getItem("user") || "{}"
                      );
                      if (user.organizerId) {
                        const maps = await seatMapService.getOrganizerSeatMaps(
                          user.organizerId
                        );
                        setAvailableSeatMaps(maps);
                      }
                    } catch (err) {
                      console.error("Failed to load seat maps:", err);
                      toast.error("Failed to load seat maps");
                    } finally {
                      setLoadingSeatMaps(false);
                    }
                  }}
                >
                  <Copy size={16} className="mr-2" />
                  Copy from Event
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
                          color: seat
                            ? getTextColor(getSeatColor(seat))
                            : "#999",
                        }}
                      >
                        {seat && (
                          <>
                            {seat.isWheelchair ? (
                              <span className="text-xs">♿</span>
                            ) : seat.label ? (
                              <span className="text-[8px] font-semibold">
                                {seat.label}
                              </span>
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
              <Label>Price per Seat (VND)</Label>
              <Input
                type="number"
                placeholder="100000"
                min="0"
                max="50000000"
                value={newZone.price || ""}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (value > 50_000_000) {
                    toast.error("Maximum price is 50,000,000 VND");
                    return;
                  }
                  setNewZone({
                    ...newZone,
                    price: value,
                  });
                }}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Maximum: 50,000,000 VND (Payment gateway limit)
              </p>
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

      {/* Copy Seat Map Modal */}
      <Dialog open={showCopyModal} onOpenChange={setShowCopyModal}>
        <DialogContent className="max-w-2xl max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Copy Seat Map from Another Event</DialogTitle>
            <DialogDescription>
              Select an existing seat map to copy its layout
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[400px]">
            {loadingSeatMaps ? (
              <div className="text-center py-8 text-neutral-500">
                Loading seat maps...
              </div>
            ) : availableSeatMaps.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                No seat maps available to copy
              </div>
            ) : (
              <div className="space-y-3">
                {availableSeatMaps.map((map) => (
                  <button
                    key={map.id}
                    onClick={async () => {
                      try {
                        const fullMap = await seatMapService.getSeatMapById(
                          map.id.toString()
                        );

                        // Load zones from the seat map
                        if (fullMap.zones && fullMap.zones.length > 0) {
                          const loadedZones: Zone[] = fullMap.zones.map(
                            (z) => ({
                              id: `zone${z.id}`,
                              name: z.name,
                              color: z.color || "#00C16A",
                              price: z.zonePrice,
                              capacity: z.capacity,
                            })
                          );
                          setZones(loadedZones);
                          setSelectedZone(loadedZones[0]?.id || null);
                        }

                        // Load seats from the full seat map
                        const eventSeats = await seatMapService.getEventSeats(
                          fullMap.eventId.toString()
                        );

                        // Convert backend seats to grid seats
                        const loadedSeats: GridSeat[] = eventSeats.map((s) => ({
                          id: `seat-${s.id}`,
                          row: s.gridRow ?? 0,
                          col: s.gridColumn ?? 0,
                          zoneId: s.seatZoneId ? `zone${s.seatZoneId}` : null,
                          isBlocked: s.isBlocked,
                          isWheelchair: s.isWheelchair,
                          label: `${s.row}${s.seatNumber}`,
                        }));

                        setSeats(loadedSeats);
                        setGridSize({
                          rows: fullMap.totalRows,
                          cols: fullMap.totalColumns,
                        });

                        toast.success("Seat map copied successfully!");
                        setShowCopyModal(false);
                      } catch (error) {
                        console.error("Failed to copy seat map:", error);
                        toast.error("Failed to copy seat map");
                      }
                    }}
                    className="w-full p-4 border-2 rounded-lg hover:border-teal-500 transition-colors text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-neutral-900 mb-1">
                          {map.name}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {map.description || "No description"}
                        </div>
                        <div className="text-xs text-neutral-400 mt-1">
                          {map.totalRows} rows × {map.totalColumns} columns
                        </div>
                      </div>
                      <Copy size={16} className="text-neutral-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCopyModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
