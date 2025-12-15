import { Download, Share2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { OrderTicket } from "../types";

interface QRTicketCardProps {
  ticket: OrderTicket;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  className?: string;
}

export function QRTicketCard({
  ticket,
  eventTitle,
  eventDate,
  eventVenue,
  className = "",
}: QRTicketCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "bg-green-100 text-green-700";
      case "used":
        return "bg-neutral-100 text-neutral-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-neutral-100";
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-neutral-200 overflow-hidden ${className}`}
    >
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-white mb-1">{eventTitle}</h4>
            <p className="text-sm text-orange-100">{ticket.tierName}</p>
            {ticket.seatInfo && (
              <p className="text-sm text-orange-100 font-semibold mt-1">
                🪑 Seat: {ticket.seatInfo}
              </p>
            )}
          </div>
          <Badge className={getStatusColor(ticket.status)}>
            {ticket.status}
          </Badge>
        </div>

        <div className="text-sm space-y-1 text-orange-100">
          <p>{formatDate(eventDate)}</p>
          <p>{eventVenue}</p>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-neutral-50 rounded-xl p-6 mb-4 flex flex-col items-center">
          <div className="w-40 h-40 bg-white rounded-xl flex items-center justify-center mb-3 p-2">
            <QRCodeCanvas
              value={ticket.qrCode || "INVALID"}
              size={144}
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-sm text-neutral-500 text-center">
            Scan at venue entrance
          </p>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            {ticket.qrCode}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" size="sm">
            <Download size={16} className="mr-2" />
            Download
          </Button>
          <Button variant="outline" className="flex-1" size="sm">
            <Share2 size={16} className="mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
