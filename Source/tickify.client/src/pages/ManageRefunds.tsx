import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Clock, Search, Calendar, DollarSign, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { getAllRefundRequests, approveRefund, rejectRefund, type RefundRequest } from '../services/refundService';
import { bookingService } from '../services/bookingService';

interface Seat {
  id: number;
  row: string;
  number: string;
  section?: string;
}

interface TicketType {
  name: string;
  description?: string;
}

interface Ticket {
  id: number;
  ticketCode: string;
  status: string;
  price: number;
  seatNumber?: string;
  seat?: Seat;
  ticketType?: TicketType;
}

interface Event {
  title: string;
  startDate: string;
  venue?: string;
}

interface BookingDetails {
  id?: number;
  bookingId?: number;
  bookingDate: string;
  quantity: number;
  totalAmount: number;
  paymentStatus: string;
  tickets?: Ticket[];
  event?: Event;
}

export function ManageRefunds() {
  const { t } = useTranslation();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected' | 'Processed'>('all');
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedBooking, setDetailedBooking] = useState<BookingDetails | null>(null);
  const [loadingBookingDetails, setLoadingBookingDetails] = useState(false);

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllRefundRequests();
      setRefunds(data);
    } catch (err) {
      console.error('Failed to load refunds:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load refunds';
      setError((err as any).response?.data?.message || errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRefund) return;
    
    setIsLoading(true);
    try {
      await approveRefund(selectedRefund.id, approvalNotes.trim() || undefined);
      await loadRefunds();
      setShowApproveDialog(false);
      setSelectedRefund(null);
      setApprovalNotes('');
    } catch (error) {
      console.error('Failed to approve refund:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve refund';
      setError((error as any).response?.data?.message || errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRefund || !rejectionReason.trim()) return;
    
    setIsLoading(true);
    try {
      await rejectRefund(selectedRefund.id, rejectionReason.trim());
      await loadRefunds();
      setShowRejectDialog(false);
      setSelectedRefund(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject refund:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject refund';
      setError((error as any).response?.data?.message || errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (refund: RefundRequest) => {
    setSelectedRefund(refund);
    setLoadingBookingDetails(true);
    try {
      const booking = await bookingService.getBookingById(refund.bookingId);
      setDetailedBooking(booking);
    } catch (err) {
      console.error('Failed to load booking details:', err);
    } finally {
      setLoadingBookingDetails(false);
    }
    setShowDetailsDialog(true);
  };

  const filteredRefunds = refunds.filter(refund => {
    const matchesSearch = 
      refund.id?.toString().includes(searchTerm) ||
      refund.bookingId?.toString().includes(searchTerm) ||
      refund.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      searchTerm === '';
    const matchesStatus = statusFilter === 'all' || refund.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = {
      Pending: { variant: 'secondary' as const, label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      Approved: { variant: 'default' as const, label: 'Approved', className: 'bg-green-100 text-green-800' },
      Rejected: { variant: 'destructive' as const, label: 'Rejected', className: 'bg-red-100 text-red-800' },
      Processed: { variant: 'default' as const, label: 'Processed', className: 'bg-blue-100 text-blue-800' }
    };
    const statusConfig = config[status as keyof typeof config] || config.Pending;
    return <Badge variant={statusConfig.variant} className={statusConfig.className}>{statusConfig.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const stats = [
    {
      title: 'Total Requests',
      value: refunds.length,
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      title: 'Pending',
      value: refunds.filter(r => r.status === 'Pending').length,
      icon: <Clock className="w-5 h-5" />
    },
    {
      title: 'Approved',
      value: refunds.filter(r => r.status === 'Approved' || r.status === 'Processed').length,
      icon: <CheckCircle className="w-5 h-5" />
    },
    {
      title: 'Total Amount',
      value: formatCurrency(refunds.filter(r => r.status === 'Approved' || r.status === 'Processed').reduce((sum, r) => sum + r.refundAmount, 0)),
      icon: <DollarSign className="w-5 h-5" />
    }
  ];

  return (
    <div className="py-8 px-4 bg-gradient-to-br from-neutral-50 to-neutral-100 min-h-screen">
      <div className="container mx-auto max-w-7xl">
        {/* Enhanced Header with Role Badge */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                {t('admin.manageRefunds.title', 'Manage Refunds')}
              </h1>
              <Badge className="bg-purple-600 text-white">Admin/Staff Only</Badge>
            </div>
            <p className="text-muted-foreground text-lg">
              {t('admin.manageRefunds.subtitle', 'Review and process refund requests')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Enhanced Stats with gradients and hover effects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-purple-500"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="p-2 bg-purple-100 rounded-full">
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="w-5 h-5" />
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Enhanced Filters with better UX */}
        <Card className="mb-6 shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('admin.manageRefunds.search', 'Search by user, email, event, or booking ID...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  key="filter-all"
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  className="min-w-[90px]"
                >
                  All ({refunds.length})
                </Button>
                <Button
                  key="filter-pending"
                  variant={statusFilter === 'Pending' ? 'secondary' : 'outline'}
                  onClick={() => setStatusFilter('Pending')}
                  className="min-w-[90px]"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Pending ({refunds.filter(r => r.status === 'Pending').length})
                </Button>
                <Button
                  key="filter-approved"
                  variant={statusFilter === 'Approved' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('Approved')}
                  className="min-w-[100px] bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approved ({refunds.filter(r => r.status === 'Approved').length})
                </Button>
                <Button
                  key="filter-rejected"
                  variant={statusFilter === 'Rejected' ? 'destructive' : 'outline'}
                  onClick={() => setStatusFilter('Rejected')}
                  className="min-w-[100px]"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Rejected ({refunds.filter(r => r.status === 'Rejected').length})
                </Button>
                <Button
                  key="filter-processed"
                  variant={statusFilter === 'Processed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('Processed')}
                  className="min-w-[110px] bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Processed ({refunds.filter(r => r.status === 'Processed').length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Refunds Table with better mobile support */}
        <Card className="shadow-lg overflow-hidden">
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-100">
                  <TableHead className="font-semibold">{t('admin.manageRefunds.table.booking', 'Booking')}</TableHead>
                  <TableHead className="font-semibold">{t('admin.manageRefunds.table.user', 'User')}</TableHead>
                  <TableHead className="font-semibold">{t('admin.manageRefunds.table.event', 'Event')}</TableHead>
                  <TableHead className="font-semibold">{t('admin.manageRefunds.table.amount', 'Amount')}</TableHead>
                  <TableHead className="font-semibold">{t('admin.manageRefunds.table.requested', 'Requested')}</TableHead>
                  <TableHead className="font-semibold">{t('admin.manageRefunds.table.status', 'Status')}</TableHead>
                  <TableHead className="text-right font-semibold">{t('admin.manageRefunds.table.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRefunds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Search className="w-12 h-12 text-neutral-300" />
                        <div>
                          <p className="font-semibold text-lg">{t('admin.manageRefunds.noRefunds', 'No refund requests found')}</p>
                          <p className="text-sm">Try adjusting your search or filter criteria</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRefunds.map((refund) => (
                    <TableRow key={refund.id} className="hover:bg-neutral-50 transition-colors">
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="font-mono">
                          #{refund.bookingId}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{refund.userName || `User #${refund.userId}`}</div>
                          <div className="text-sm text-muted-foreground">{refund.bookingNumber || `Booking #${refund.bookingId}`}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px]">
                          <div className="font-medium truncate">{refund.eventTitle || 'View details for event info'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        <div className="text-purple-700">{formatCurrency(refund.refundAmount)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {new Date(refund.createdAt).toLocaleDateString('vi-VN', {
                              weekday: 'short',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(refund.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(refund.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(refund)}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            View Details
                          </Button>
                          {refund.status === 'Pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRefund(refund);
                                  setShowApproveDialog(true);
                                }}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Approve Refund"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRefund(refund);
                                  setShowRejectDialog(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Reject Refund"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Enhanced Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                {t('admin.manageRefunds.details.title', 'Refund Request Details')}
              </DialogTitle>
              <DialogDescription>
                Complete information including booking details, tickets, and seat positions
              </DialogDescription>
            </DialogHeader>
            {selectedRefund && (
              <div className="space-y-6 py-4">
                {/* Status Banner */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Status</p>
                      <div className="mt-1">{getStatusBadge(selectedRefund.status)}</div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Refund ID</p>
                      <p className="font-mono font-bold text-lg">#{selectedRefund.id}</p>
                    </div>
                  </div>
                </div>

                {/* Refund Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Refund Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-neutral-600 mb-1">Refund ID</div>
                        <div className="font-semibold">#{selectedRefund.id}</div>
                      </div>
                      <div>
                        <div className="text-sm text-neutral-600 mb-1">Booking ID</div>
                        <Badge variant="outline" className="font-mono">#{selectedRefund.bookingId}</Badge>
                      </div>
                      <div>
                        <div className="text-sm text-neutral-600 mb-1">Refund Amount</div>
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(selectedRefund.refundAmount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-neutral-600 mb-1">Status</div>
                        <div>{getStatusBadge(selectedRefund.status)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-neutral-600 mb-1">Requested</div>
                        <div>{new Date(selectedRefund.createdAt).toLocaleString('vi-VN')}</div>
                      </div>
                      {selectedRefund.reviewedAt && (
                        <div>
                          <div className="text-sm text-neutral-600 mb-1">Reviewed</div>
                          <div>{new Date(selectedRefund.reviewedAt).toLocaleString('vi-VN')}</div>
                        </div>
                      )}
                      {selectedRefund.processedAt && (
                        <div>
                          <div className="text-sm text-neutral-600 mb-1">Processed</div>
                          <div>{new Date(selectedRefund.processedAt).toLocaleString('vi-VN')}</div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm text-neutral-600 mb-1">Customer's Reason</div>
                      <div className="p-3 bg-neutral-50 rounded-lg">{selectedRefund.reason}</div>
                    </div>

                    {selectedRefund.staffNotes && (
                      <div>
                        <div className="text-sm text-neutral-600 mb-1">Staff Notes</div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          {selectedRefund.staffNotes}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* User Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-neutral-600 mb-1">User ID</div>
                        <div className="font-mono text-sm">#{selectedRefund.userId}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm text-neutral-600 mb-1">Full Information</div>
                        <div className="text-muted-foreground text-sm">
                          Full user details available in User Management
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Booking & Ticket Details */}
                {loadingBookingDetails ? (
                  <Card>
                    <CardContent className="py-8 text-center text-neutral-500">
                      Loading booking details...
                    </CardContent>
                  </Card>
                ) : detailedBooking ? (
                  <>
                    {/* Event Information */}
                    {detailedBooking.event && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Event Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <div className="text-sm text-neutral-600 mb-1">Event Title</div>
                            <div className="font-semibold">{detailedBooking.event.title || 'N/A'}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {detailedBooking.event.startDate && (
                              <div>
                                <div className="text-sm text-neutral-600 mb-1">Event Date</div>
                                <div>{new Date(detailedBooking.event.startDate).toLocaleDateString('vi-VN', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}</div>
                              </div>
                            )}
                            {detailedBooking.event.venue && (
                              <div>
                                <div className="text-sm text-neutral-600 mb-1">Venue</div>
                                <div>{detailedBooking.event.venue}</div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Ticket Details */}
                    {detailedBooking.tickets && detailedBooking.tickets.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Ticket Details ({detailedBooking.tickets.length} ticket{detailedBooking.tickets.length > 1 ? 's' : ''})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {detailedBooking.tickets.map((ticket: Ticket, index: number) => (
                              <div key={ticket.id || index} className="p-4 border rounded-lg bg-neutral-50">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-sm text-neutral-600 mb-1">Ticket Code</div>
                                    <div className="font-mono font-semibold text-sm">{ticket.ticketCode || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-neutral-600 mb-1">Status</div>
                                    <Badge variant="secondary">{ticket.status || 'Valid'}</Badge>
                                  </div>
                                  {ticket.ticketType && (
                                    <div>
                                      <div className="text-sm text-neutral-600 mb-1">Ticket Type</div>
                                      <div className="font-semibold">{ticket.ticketType.name || 'Standard'}</div>
                                      {ticket.ticketType.description && (
                                        <div className="text-xs text-neutral-500 mt-1">{ticket.ticketType.description}</div>
                                      )}
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm text-neutral-600 mb-1">Price</div>
                                    <div className="font-semibold">{formatCurrency(ticket.price || 0)}</div>
                                  </div>
                                  {ticket.seatNumber && (
                                    <div className="col-span-2">
                                      <div className="text-sm text-neutral-600 mb-1">Seat Position</div>
                                      <div className="font-semibold text-purple-600 text-lg">
                                        {ticket.seat 
                                          ? `Row ${ticket.seat.row || 'N/A'}, Seat ${ticket.seat.number || ticket.seatNumber}`
                                          : ticket.seatNumber
                                        }
                                      </div>
                                      {ticket.seat && ticket.seat.section && (
                                        <div className="text-sm text-neutral-500 mt-1">
                                          Section: {ticket.seat.section}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            <Separator />
                            
                            <div className="flex justify-between items-center font-semibold text-lg">
                              <span>Total Ticket Value:</span>
                              <span className="text-green-600">
                                {formatCurrency(detailedBooking.tickets.reduce((sum: number, t: Ticket) => sum + (t.price || 0), 0))}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Booking Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Booking Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-neutral-600 mb-1">Quantity</div>
                            <div className="font-semibold">{detailedBooking.quantity || detailedBooking.tickets?.length || 0} ticket(s)</div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-600 mb-1">Booking Date</div>
                            <div>{new Date(detailedBooking.bookingDate).toLocaleDateString('vi-VN')}</div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-600 mb-1">Total Amount</div>
                            <div className="font-semibold">{formatCurrency(detailedBooking.totalAmount || 0)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-600 mb-1">Payment Status</div>
                            <Badge>{detailedBooking.paymentStatus || 'Paid'}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-neutral-500">
                      Booking details not available
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions for Pending */}
                {selectedRefund.status === 'Pending' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => {
                        setShowDetailsDialog(false);
                        setShowApproveDialog(true);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Refund
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setShowDetailsDialog(false);
                        setShowRejectDialog(true);
                      }}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Refund
                    </Button>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowDetailsDialog(false);
                setDetailedBooking(null);
              }}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.manageRefunds.approve.title', 'Approve Refund')}</DialogTitle>
              <DialogDescription>
                {t('admin.manageRefunds.approve.description', 'Confirm refund approval for this request')}
              </DialogDescription>
            </DialogHeader>
            {selectedRefund && (
              <div className="py-4 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Refund ID</p>
                  <p className="font-semibold">#{selectedRefund.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Refund Amount</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedRefund.refundAmount)}</p>
                </div>
                <div>
                  <Label htmlFor="approval-notes">Staff Notes (Optional)</Label>
                  <Textarea
                    id="approval-notes"
                    placeholder="Add notes about this approval..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowApproveDialog(false);
                setApprovalNotes('');
              }} disabled={isLoading}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleApprove} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? t('common.processing', 'Processing...') : t('common.approve', 'Approve')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.manageRefunds.reject.title', 'Reject Refund')}</DialogTitle>
              <DialogDescription>
                {t('admin.manageRefunds.reject.description', 'Please provide a reason for rejection')}
              </DialogDescription>
            </DialogHeader>
            {selectedRefund && (
              <div className="py-4 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold">{selectedRefund.userName || `User #${selectedRefund.userId}`}</p>
                  <p className="text-sm text-muted-foreground mt-2">Event</p>
                  <p className="font-medium">{selectedRefund.eventTitle || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground mt-2">Booking</p>
                  <p className="font-mono font-semibold">{selectedRefund.bookingNumber || `#${selectedRefund.bookingId}`}</p>
                  <p className="text-sm text-muted-foreground mt-2">Refund Amount</p>
                  <p className="font-bold text-lg text-red-600">{formatCurrency(selectedRefund.refundAmount)}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">{t('admin.manageRefunds.reject.reason', 'Rejection Reason')}</Label>
                  <Textarea
                    id="reason"
                    placeholder={t('admin.manageRefunds.reject.reasonPlaceholder', 'Enter the reason for rejection...')}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={isLoading}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isLoading || !rejectionReason.trim()}
              >
                {isLoading ? t('common.processing', 'Processing...') : t('common.reject', 'Reject')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default ManageRefunds;
