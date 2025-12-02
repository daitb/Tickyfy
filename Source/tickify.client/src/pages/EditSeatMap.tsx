import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { SeatMapBuilder } from "../components/SeatMapBuilder";
import { eventService } from "../services/eventService";

interface EditSeatMapProps {
  onNavigate: (page: string, eventId?: string) => void;
}

interface TicketType {
  id: number;
  typeName: string;
  price: number;
}

interface SeatMapData {
  id?: number;
  name: string;
  description: string;
  totalRows: number;
  totalColumns: number;
  zones: Array<{
    id?: number;
    name: string;
    color: string;
    ticketTypeId: number;
    startRow: number;
    endRow: number;
    startColumn: number;
    endColumn: number;
    price: number;
  }>;
}

export function EditSeatMap({ onNavigate }: EditSeatMapProps) {
  const { eventId } = useParams<{ eventId: string }>();
  const [loading, setLoading] = useState(true);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [seatMapData, setSeatMapData] = useState<SeatMapData | undefined>();
  const [eventTitle, setEventTitle] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (eventId) {
      loadData(parseInt(eventId));
    }
  }, [eventId]);

  const loadData = async (id: number) => {
    try {
      setLoading(true);
      setError("");

      // Load event details to get ticket types
      const event = await eventService.getEventById(id);
      console.log("EditSeatMap - Loaded event:", event);
      setEventTitle(event.title);

      // Extract ticket types - convert from TicketTier (id: string) to TicketType (id: number)
      if (event.ticketTiers && event.ticketTiers.length > 0) {
        const types = event.ticketTiers.map((tt, index) => ({
          id: parseInt(tt.id) || index + 1, // Convert string id to number, fallback to index
          typeName: tt.name,
          price: tt.price,
        }));
        console.log("EditSeatMap - Extracted ticket types:", types);
        setTicketTypes(types);
      } else {
        console.log("EditSeatMap - No ticket tiers found in event");
      }

      // Try to load existing seat map
      try {
        const seatMapResponse = await fetch(`/api/seatmaps/event/${id}`);
        if (seatMapResponse.ok) {
          const existingSeatMap = await seatMapResponse.json();
          setSeatMapData(existingSeatMap);
        }
      } catch {
        console.log("No existing seat map found, will create new one");
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (seatMapData: SeatMapData) => {
    if (!eventId) return;

    try {
      const url = seatMapData.id
        ? `/api/seatmaps/${seatMapData.id}`
        : "/api/seatmaps";

      const method = seatMapData.id ? "PUT" : "POST";

      const payload = seatMapData.id
        ? {
            name: seatMapData.name,
            description: seatMapData.description,
            totalRows: seatMapData.totalRows,
            totalColumns: seatMapData.totalColumns,
            layoutConfig: JSON.stringify(seatMapData.zones),
            isActive: true,
          }
        : {
            eventId: parseInt(eventId),
            name: seatMapData.name,
            description: seatMapData.description,
            totalRows: seatMapData.totalRows,
            totalColumns: seatMapData.totalColumns,
            layoutConfig: JSON.stringify(seatMapData.zones),
          };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save seat map");
      }

      alert("Seat map saved successfully!");
      onNavigate("organizer-dashboard");
    } catch (err) {
      console.error("Error saving seat map:", err);
      alert("Failed to save seat map. Please try again.");
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#00C16A]" />
          <p className="text-gray-600">Loading seat map editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => onNavigate("organizer-dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (ticketTypes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">
              Please add ticket types to your event before creating a seat map.
            </p>
            <Button onClick={() => onNavigate("organizer-dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => onNavigate("organizer-dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {seatMapData ? "Edit" : "Create"} Seat Map
          </h1>
          <p className="text-gray-600">
            Event: <span className="font-semibold">{eventTitle}</span>
          </p>
        </div>

        {/* Seat Map Builder */}
        <SeatMapBuilder
          ticketTypes={ticketTypes}
          onSave={handleSave}
          initialData={seatMapData}
        />
      </div>
    </div>
  );
}
