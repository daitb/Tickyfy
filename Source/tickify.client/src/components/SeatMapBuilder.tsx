import { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Plus, Trash2, Grid3x3, Save } from "lucide-react";

interface SeatZone {
  id?: number;
  name: string;
  color: string;
  ticketTypeId: number;
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
  price: number;
}

interface SeatMapData {
  id?: number;
  name: string;
  description: string;
  totalRows: number;
  totalColumns: number;
  zones: SeatZone[];
}

interface TicketType {
  id: number;
  typeName: string;
  price: number;
}

interface SeatMapBuilderProps {
  ticketTypes: TicketType[];
  onSave: (seatMapData: SeatMapData) => Promise<void>;
  initialData?: SeatMapData;
}

const ZONE_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E2",
];

export function SeatMapBuilder({
  ticketTypes,
  onSave,
  initialData,
}: SeatMapBuilderProps) {
  const [name, setName] = useState(initialData?.name || "Main Hall");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [rows, setRows] = useState(initialData?.totalRows || 10);
  const [columns, setColumns] = useState(initialData?.totalColumns || 10);
  const [zones, setZones] = useState<SeatZone[]>(initialData?.zones || []);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Grid visualization
  const renderSeatGrid = () => {
    const grid: JSX.Element[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        // Find zone for this position
        const zone = zones.find(
          (z) =>
            row >= z.startRow &&
            row <= z.endRow &&
            col >= z.startColumn &&
            col <= z.endColumn
        );

        grid.push(
          <div
            key={`${row}-${col}`}
            className={`w-8 h-8 border rounded flex items-center justify-center text-xs cursor-pointer transition-colors ${
              zone ? `bg-opacity-50` : "bg-gray-100 hover:bg-gray-200"
            }`}
            style={{ backgroundColor: zone ? zone.color + "80" : undefined }}
            title={
              zone
                ? `${zone.name} - Row ${row + 1}, Seat ${col + 1}`
                : `Row ${row + 1}, Seat ${col + 1}`
            }
          >
            {zone ? zone.name.substring(0, 1) : ""}
          </div>
        );
      }
    }

    return grid;
  };

  const addZone = () => {
    if (ticketTypes.length === 0) {
      alert("Please add ticket types first");
      return;
    }

    const newZone: SeatZone = {
      name: `Zone ${zones.length + 1}`,
      color: ZONE_COLORS[zones.length % ZONE_COLORS.length],
      ticketTypeId: ticketTypes[0].id,
      price: ticketTypes[0].price,
      startRow: 0,
      endRow: Math.min(2, rows - 1),
      startColumn: 0,
      endColumn: Math.min(4, columns - 1),
    };

    setZones([...zones, newZone]);
    setSelectedZone(zones.length);
  };

  const updateZone = (index: number, updates: Partial<SeatZone>) => {
    const updatedZones = [...zones];
    updatedZones[index] = { ...updatedZones[index], ...updates };
    setZones(updatedZones);
  };

  const deleteZone = (index: number) => {
    setZones(zones.filter((_, i) => i !== index));
    if (selectedZone === index) setSelectedZone(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a seat map name");
      return;
    }

    if (zones.length === 0) {
      alert("Please add at least one zone");
      return;
    }

    setIsSaving(true);
    try {
      const seatMapData: SeatMapData = {
        id: initialData?.id,
        name,
        description,
        totalRows: rows,
        totalColumns: columns,
        zones,
      };

      await onSave(seatMapData);
    } catch (error) {
      console.error("Error saving seat map:", error);
      alert("Failed to save seat map");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seat Map Info */}
      <Card>
        <CardHeader>
          <CardTitle>Seat Map Configuration</CardTitle>
          <CardDescription>
            Configure the basic layout of your venue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Seat Map Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Main Hall, Stadium"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rows">Number of Rows</Label>
              <Input
                id="rows"
                type="number"
                min="1"
                max="50"
                value={rows}
                onChange={(e) =>
                  setRows(
                    Math.max(1, Math.min(50, parseInt(e.target.value) || 10))
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="columns">Seats per Row</Label>
              <Input
                id="columns"
                type="number"
                min="1"
                max="50"
                value={columns}
                onChange={(e) =>
                  setColumns(
                    Math.max(1, Math.min(50, parseInt(e.target.value) || 10))
                  )
                }
              />
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Total Capacity:{" "}
            <span className="font-semibold">{rows * columns} seats</span>
          </div>
        </CardContent>
      </Card>

      {/* Seat Grid Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5" />
            Seat Layout Preview
          </CardTitle>
          <CardDescription>
            Visual representation of your seat map
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="grid gap-1 p-4 bg-gray-50 rounded-lg overflow-auto max-h-96"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(2rem, 1fr))`,
              maxWidth: "100%",
            }}
          >
            {renderSeatGrid()}
          </div>
          <div className="mt-4 text-center text-sm text-gray-600">
            Stage / Screen
          </div>
        </CardContent>
      </Card>

      {/* Zones Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Seat Zones</CardTitle>
              <CardDescription>
                Define pricing zones for your seat map
              </CardDescription>
            </div>
            <Button onClick={addZone} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Zone
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {zones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No zones added yet. Click "Add Zone" to start.
            </div>
          ) : (
            zones.map((zone, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  selectedZone === index
                    ? "border-[#00C16A] bg-green-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: zone.color }}
                    />
                    <Input
                      value={zone.name}
                      onChange={(e) =>
                        updateZone(index, { name: e.target.value })
                      }
                      className="w-40"
                      placeholder="Zone name"
                    />
                  </div>
                  <Button
                    onClick={() => deleteZone(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Ticket Type</Label>
                    <Select
                      value={zone.ticketTypeId.toString()}
                      onValueChange={(value) => {
                        const ticketType = ticketTypes.find(
                          (tt) => tt.id === parseInt(value)
                        );
                        updateZone(index, {
                          ticketTypeId: parseInt(value),
                          price: ticketType?.price || zone.price,
                        });
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ticketTypes.map((tt) => (
                          <SelectItem key={tt.id} value={tt.id.toString()}>
                            {tt.typeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Start Row</Label>
                    <Input
                      type="number"
                      min="0"
                      max={rows - 1}
                      value={zone.startRow}
                      onChange={(e) =>
                        updateZone(index, {
                          startRow: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-9"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">End Row</Label>
                    <Input
                      type="number"
                      min="0"
                      max={rows - 1}
                      value={zone.endRow}
                      onChange={(e) =>
                        updateZone(index, {
                          endRow: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-9"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Start Column</Label>
                    <Input
                      type="number"
                      min="0"
                      max={columns - 1}
                      value={zone.startColumn}
                      onChange={(e) =>
                        updateZone(index, {
                          startColumn: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-9"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">End Column</Label>
                    <Input
                      type="number"
                      min="0"
                      max={columns - 1}
                      value={zone.endColumn}
                      onChange={(e) =>
                        updateZone(index, {
                          endColumn: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-9"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Color</Label>
                    <Input
                      type="color"
                      value={zone.color}
                      onChange={(e) =>
                        updateZone(index, { color: e.target.value })
                      }
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-600">
                  Capacity:{" "}
                  {(zone.endRow - zone.startRow + 1) *
                    (zone.endColumn - zone.startColumn + 1)}{" "}
                  seats
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#00C16A] hover:bg-[#00a859]"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Seat Map"}
        </Button>
      </div>
    </div>
  );
}
