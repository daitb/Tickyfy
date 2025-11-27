import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Calendar,
  DollarSign,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { getMyRefundRequests, getRefundById, type RefundRequest, type RefundStatus } from '../services/refundService';
import { bookingService } from '../services/bookingService';
import type { BookingDetailDto } from '../services/bookingService';
import { eventService } from '../services/eventService';

interface RefundHistoryProps {
  onNavigate: (page: string, refundId?: string) => void;
}

export function RefundHistory({ onNavigate }: RefundHistoryProps) {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [bookings, setBookings] = useState<Map<number, BookingDetailDto>>(new Map());
  const [events, setEvents] = useState<Map<number, any>>(new Map());

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMyRefundRequests();
      setRefunds(data);

      // Load booking and event details
      const bookingMap = new Map<number, BookingDetailDto>();
      const eventMap = new Map<number, any>();

      for (const refund of data) {
        try {
          // Try to get booking details if available
          const booking = await bookingService.getBookingById(refund.bookingId);
          bookingMap.set(refund.bookingId, booking);
          
          if (booking.eventId) {
            try {
              const event = await eventService.getEventById(booking.eventId);
              eventMap.set(booking.eventId, event);
            } catch (err) {
              console.error('Failed to load event:', err);
            }
          }
        } catch (err) {
          console.error('Failed to load booking:', err);
        }
      }

      setBookings(bookingMap);
      setEvents(eventMap);
    } catch (err: any) {
      console.error('Failed to load refunds:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load refund history');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: RefundStatus) => {
    const variants: Record<RefundStatus, { className: string; icon: React.ReactNode; label: string }> = {
      Pending: {
        className: 'bg-yellow-100 text-yellow-700',
        icon: <Clock size={14} className="mr-1" />,
        label: 'Pending',
      },
      Approved: {
        className: 'bg-blue-100 text-blue-700',
        icon: <CheckCircle size={14} className="mr-1" />,
        label: 'Approved',
      },
      Rejected: {
        className: 'bg-red-100 text-red-700',
        icon: <XCircle size={14} className="mr-1" />,
        label: 'Rejected',
      },
      Processed: {
        className: 'bg-green-100 text-green-700',
        icon: <CheckCircle size={14} className="mr-1" />,
        label: 'Processed',
      },
    };

    const variant = variants[status] || variants.Pending;
    return (
      <Badge className={variant.className}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const filteredRefunds = refunds.filter((refund) => {
    const matchesSearch = searchQuery === '' || 
      refund.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.id.toString().includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || refund.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = async (refund: RefundRequest) => {
    try {
      const details = await getRefundById(refund.id);
      setSelectedRefund(details);
      setShowDetails(true);
    } catch (err: any) {
      console.error('Failed to load refund details:', err);
      setError(err.response?.data?.message || 'Failed to load refund details');
    }
  };

  const getEventTitle = (refund: RefundRequest) => {
    const booking = bookings.get(refund.bookingId);
    if (!booking || !booking.eventId) return 'Unknown Event';
    const event = events.get(booking.eventId);
    return event?.title || 'Unknown Event';
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
          <button onClick={() => onNavigate('user-profile')} className="hover:text-neutral-900">
            Dashboard
          </button>
          <span>/</span>
          <button onClick={() => onNavigate('my-tickets')} className="hover:text-neutral-900">
            Orders
          </button>
          <span>/</span>
          <span className="text-neutral-900">Refund History</span>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Refund History</h1>
          <p className="text-neutral-600">View and track your refund requests</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by reason or ID..."
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Processed">Processed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="text-red-600" size={16} />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4" />
              <p className="text-neutral-600">Loading refund history...</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && filteredRefunds.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="mx-auto text-neutral-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Refunds Found</h3>
              <p className="text-neutral-600 mb-4">
                {refunds.length === 0
                  ? "You haven't requested any refunds yet."
                  : 'No refunds match your search criteria.'}
              </p>
              {refunds.length === 0 && (
                <Button
                  onClick={() => onNavigate('refund-request')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Request a Refund
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Refunds List */}
        {!isLoading && filteredRefunds.length > 0 && (
          <div className="space-y-4">
            {filteredRefunds.map((refund) => (
              <Card key={refund.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">
                          Refund #{refund.id}
                        </h3>
                        {getStatusBadge(refund.status)}
                      </div>
                      <div className="space-y-1 text-sm text-neutral-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>Requested: {formatDate(refund.createdAt)}</span>
                        </div>
                        {refund.reviewedAt && (
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>Reviewed: {formatDate(refund.reviewedAt)}</span>
                          </div>
                        )}
                        {refund.processedAt && (
                          <div className="flex items-center gap-2">
                            <CheckCircle size={14} />
                            <span>Processed: {formatDate(refund.processedAt)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FileText size={14} />
                          <span className="line-clamp-1">Event: {getEventTitle(refund)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-sm text-neutral-600 mb-1">Refund Amount</div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(refund.refundAmount)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleViewDetails(refund)}
                        className="w-full md:w-auto"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                  {refund.reason && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-neutral-700">
                        <span className="font-semibold">Reason:</span> {refund.reason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {!isLoading && refunds.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Total Requests</div>
                  <div className="text-2xl font-bold">{refunds.length}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Pending</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {refunds.filter((r) => r.status === 'Pending').length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Processed</div>
                  <div className="text-2xl font-bold text-green-600">
                    {refunds.filter((r) => r.status === 'Processed').length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Total Refunded</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      refunds
                        .filter((r) => r.status === 'Processed')
                        .reduce((sum, r) => sum + r.refundAmount, 0)
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Refund Details</DialogTitle>
            <DialogDescription>Complete information about this refund request</DialogDescription>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Refund ID</div>
                  <div className="font-semibold">#{selectedRefund.id}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Status</div>
                  <div>{getStatusBadge(selectedRefund.status)}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Booking ID</div>
                  <div className="font-semibold">#{selectedRefund.bookingId}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Refund Amount</div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(selectedRefund.refundAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Requested</div>
                  <div>{formatDate(selectedRefund.createdAt)}</div>
                </div>
                {selectedRefund.reviewedAt && (
                  <div>
                    <div className="text-sm text-neutral-600 mb-1">Reviewed</div>
                    <div>{formatDate(selectedRefund.reviewedAt)}</div>
                  </div>
                )}
                {selectedRefund.processedAt && (
                  <div>
                    <div className="text-sm text-neutral-600 mb-1">Processed</div>
                    <div>{formatDate(selectedRefund.processedAt)}</div>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <div className="text-sm text-neutral-600 mb-1">Reason</div>
                <div className="p-3 bg-neutral-50 rounded-lg">{selectedRefund.reason}</div>
              </div>

              {selectedRefund.staffNotes && (
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Staff Notes</div>
                  <div className="p-3 bg-blue-50 rounded-lg">{selectedRefund.staffNotes}</div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowDetails(false);
                    onNavigate('refund-request', selectedRefund.bookingId.toString());
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Request Another Refund
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

