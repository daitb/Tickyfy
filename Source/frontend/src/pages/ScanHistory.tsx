import { useState } from "react";
import {
  QrCode,
  XCircle,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
  Download,
  Search,
  RotateCw,
  MoreVertical,
  User,
  Calendar,
  Printer,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { mockEvents } from "../mockData";

interface ScanHistoryProps {
  eventId?: string;
  onNavigate: (page: string, eventId?: string) => void;
}

interface ScanRecord {
  id: string;
  time: string;
  ticketCode: string;
  attendeeName: string;
  ticketType: string;
  seat?: string;
  status: "success" | "failed" | "duplicate";
  scannedBy: string;
}

const mockScans: ScanRecord[] = [
  {
    id: "1",
    time: "18:45:23",
    ticketCode: "TIX-001",
    attendeeName: "John Doe",
    ticketType: "VIP",
    seat: "A12",
    status: "success",
    scannedBy: "Staff 1",
  },
  {
    id: "2",
    time: "18:43:15",
    ticketCode: "TIX-002",
    attendeeName: "Jane Smith",
    ticketType: "Standard",
    seat: "B24",
    status: "success",
    scannedBy: "Staff 2",
  },
  {
    id: "3",
    time: "18:42:08",
    ticketCode: "TIX-003",
    attendeeName: "Bob Johnson",
    ticketType: "VIP",
    seat: "A15",
    status: "duplicate",
    scannedBy: "Staff 1",
  },
  {
    id: "4",
    time: "18:40:55",
    ticketCode: "TIX-004",
    attendeeName: "Alice Williams",
    ticketType: "Standard",
    status: "failed",
    scannedBy: "Staff 3",
  },
  {
    id: "5",
    time: "18:38:42",
    ticketCode: "TIX-005",
    attendeeName: "Charlie Brown",
    ticketType: "Early Bird",
    seat: "C10",
    status: "success",
    scannedBy: "Staff 2",
  },
];

export function ScanHistory({ eventId, onNavigate }: ScanHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get event data
  const event = mockEvents.find((e) => e.id === eventId) || mockEvents[0];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExport = (format: string) => {
    console.log("Exporting as:", format);
  };

  const filteredScans = mockScans.filter((scan) => {
    const matchesSearch =
      scan.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.attendeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || scan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-700 gap-1">
            <CheckCircle size={12} />
            Success
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 gap-1">
            <XCircle size={12} />
            Failed
          </Badge>
        );
      case "duplicate":
        return (
          <Badge className="bg-amber-100 text-amber-700 gap-1">
            <AlertTriangle size={12} />
            Duplicate
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const successCount = mockScans.filter((s) => s.status === "success").length;
  const failedCount = mockScans.filter((s) => s.status === "failed").length;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
          <button
            onClick={() => onNavigate("event-management")}
            className="hover:text-teal-600"
          >
            My Events
          </button>
          <ChevronRight size={16} />
          <button
            onClick={() => onNavigate("event-detail", event.id)}
            className="hover:text-teal-600"
          >
            {event.title}
          </button>
          <ChevronRight size={16} />
          <span className="text-neutral-900">Scan History</span>
        </div>

        {/* Event Summary Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-neutral-900 mb-1">{event.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-neutral-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {event.date} • {event.time}
                    </div>
                    <div>{event.venue}</div>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm text-neutral-600 mb-1">
                      {successCount}/500 checked in
                    </div>
                    <div className="w-64 bg-neutral-200 rounded-full h-2">
                      <div
                        className="bg-teal-500 h-2 rounded-full"
                        style={{ width: `${(successCount / 500) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-teal-500 hover:bg-teal-600">
                      <Download size={16} className="mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport("pdf")}>
                      <Download size={14} className="mr-2" />
                      PDF Report
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("excel")}>
                      <Download size={14} className="mr-2" />
                      Excel Spreadsheet
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("csv")}>
                      <Download size={14} className="mr-2" />
                      CSV Data
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  onClick={() => onNavigate("event-detail", event.id)}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Event
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">Total Scans</div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <QrCode className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-1">
                {successCount}
              </div>
              <div className="text-xs text-neutral-600">
                Successful check-ins
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">Failed Scans</div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="text-red-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-red-500 mb-1">{failedCount}</div>
              <div className="text-xs text-neutral-600">
                Invalid or duplicate
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">Scan Rate</div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-green-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-1">45/hour</div>
              <div className="text-xs text-neutral-600">Average rate</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">Peak Time</div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-lg text-neutral-900 mb-1">18:30 - 19:00</div>
              <div className="text-xs text-neutral-600">Busiest period</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  size={18}
                />
                <Input
                  placeholder="Search ticket code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="duplicate">Duplicate</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full sm:w-auto"
              >
                <RotateCw
                  size={16}
                  className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            {filteredScans.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="mx-auto text-neutral-400 mb-4" size={64} />
                <h3 className="text-neutral-900 mb-2">No scans found</h3>
                <p className="text-neutral-600">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Check-ins will appear here once scanning begins"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Ticket Code</TableHead>
                    <TableHead>Attendee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Seat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Scanned By
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScans.map((scan) => (
                    <TableRow
                      key={scan.id}
                      className="hover:bg-neutral-50 cursor-pointer"
                      onClick={() => setSelectedScan(scan)}
                    >
                      <TableCell className="font-mono text-sm">
                        {scan.time}
                      </TableCell>
                      <TableCell className="font-mono">
                        {scan.ticketCode}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-neutral-400" />
                          {scan.attendeeName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{scan.ticketType}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {scan.seat || "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(scan.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-neutral-600">
                        {scan.scannedBy}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e: React.MouseEvent) =>
                              e.stopPropagation()
                            }
                          >
                            <Button variant="ghost" size="sm">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setSelectedScan(scan)}
                            >
                              View Details
                            </DropdownMenuItem>
                            {scan.status === "failed" && (
                              <DropdownMenuItem>Rescan</DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Printer size={14} className="mr-2" />
                              Print Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Report Issue
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-neutral-600">
            Showing 1-{filteredScans.length} of {mockScans.length}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Scan Details Modal */}
      <Dialog open={!!selectedScan} onOpenChange={() => setSelectedScan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Details</DialogTitle>
          </DialogHeader>
          {selectedScan && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="w-32 h-32 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <QrCode size={80} className="text-neutral-400" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Status:</span>
                  {getStatusBadge(selectedScan.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Ticket Code:</span>
                  <span className="font-mono">{selectedScan.ticketCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Attendee:</span>
                  <span>{selectedScan.attendeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Ticket Type:</span>
                  <span>{selectedScan.ticketType}</span>
                </div>
                {selectedScan.seat && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Seat:</span>
                    <span>{selectedScan.seat}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-600">Scan Time:</span>
                  <span>{selectedScan.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Scanned By:</span>
                  <span>{selectedScan.scannedBy}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  <Printer size={16} className="mr-2" />
                  Print Receipt
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedScan(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
