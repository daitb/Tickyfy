import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Clock, Search, Calendar, DollarSign } from 'lucide-react';
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

interface Refund {
  id: string;
  bookingId: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventTitle: string;
  eventDate: string;
  ticketQuantity: number;
  refundAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  adminNotes?: string;
}

export function ManageRefunds() {
  const { t } = useTranslation();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Replace with actual API call
  useEffect(() => {
    const mockRefunds: Refund[] = [
      {
        id: '1',
        bookingId: 'BK001',
        userId: 'user1',
        userName: 'Nguyen Van A',
        userEmail: 'nguyenvana@email.com',
        eventTitle: 'Summer Music Festival 2024',
        eventDate: '2024-07-15',
        ticketQuantity: 2,
        refundAmount: 2000000,
        reason: 'Unable to attend due to personal emergency',
        status: 'pending',
        requestedAt: '2024-01-15T10:30:00'
      },
      {
        id: '2',
        bookingId: 'BK002',
        userId: 'user2',
        userName: 'Tran Thi B',
        userEmail: 'tranthib@email.com',
        eventTitle: 'Tech Conference 2024',
        eventDate: '2024-08-20',
        ticketQuantity: 1,
        refundAmount: 1500000,
        reason: 'Schedule conflict with work',
        status: 'approved',
        requestedAt: '2024-01-14T14:20:00',
        processedAt: '2024-01-15T09:00:00'
      },
      {
        id: '3',
        bookingId: 'BK003',
        userId: 'user3',
        userName: 'Le Van C',
        userEmail: 'levanc@email.com',
        eventTitle: 'Food & Wine Expo',
        eventDate: '2024-06-10',
        ticketQuantity: 4,
        refundAmount: 3200000,
        reason: 'Event too close to request date',
        status: 'rejected',
        requestedAt: '2024-06-08T16:45:00',
        processedAt: '2024-06-09T10:00:00',
        adminNotes: 'Refund policy states no refunds within 48 hours of event'
      },
      {
        id: '4',
        bookingId: 'BK004',
        userId: 'user4',
        userName: 'Pham Thi D',
        userEmail: 'phamthid@email.com',
        eventTitle: 'Marathon Championship',
        eventDate: '2024-09-05',
        ticketQuantity: 1,
        refundAmount: 500000,
        reason: 'Medical reasons - cannot participate',
        status: 'pending',
        requestedAt: '2024-01-16T08:15:00'
      }
    ];
    setRefunds(mockRefunds);
  }, []);

  const handleApprove = async () => {
    if (!selectedRefund) return;
    
    setIsLoading(true);
    try {
      // TODO: Call API to approve refund
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRefunds(refunds.map(r => 
        r.id === selectedRefund.id 
          ? { ...r, status: 'approved', processedAt: new Date().toISOString() }
          : r
      ));
      
      setShowApproveDialog(false);
      setSelectedRefund(null);
    } catch (error) {
      console.error('Failed to approve refund:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRefund || !rejectionReason.trim()) return;
    
    setIsLoading(true);
    try {
      // TODO: Call API to reject refund
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRefunds(refunds.map(r => 
        r.id === selectedRefund.id 
          ? { ...r, status: 'rejected', processedAt: new Date().toISOString(), adminNotes: rejectionReason }
          : r
      ));
      
      setShowRejectDialog(false);
      setSelectedRefund(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject refund:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRefunds = refunds.filter(refund => {
    const matchesSearch = 
      refund.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.bookingId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || refund.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      approved: { variant: 'default' as const, label: 'Approved' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' }
    };
    const { variant, label } = config[status as keyof typeof config];
    return <Badge variant={variant}>{label}</Badge>;
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
      value: refunds.filter(r => r.status === 'pending').length,
      icon: <Clock className="w-5 h-5" />
    },
    {
      title: 'Approved',
      value: refunds.filter(r => r.status === 'approved').length,
      icon: <CheckCircle className="w-5 h-5" />
    },
    {
      title: 'Total Amount',
      value: formatCurrency(refunds.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.refundAmount, 0)),
      icon: <DollarSign className="w-5 h-5" />
    }
  ];

  return (
    <div className="py-8 px-4 bg-background min-h-screen">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('admin.manageRefunds.title', 'Manage Refunds')}</h1>
          <p className="text-muted-foreground">
            {t('admin.manageRefunds.subtitle', 'Review and process refund requests')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('admin.manageRefunds.search', 'Search by user, email, event, or booking ID...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'pending', 'approved', 'rejected'].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(status as typeof statusFilter)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refunds Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.manageRefunds.table.booking', 'Booking')}</TableHead>
                  <TableHead>{t('admin.manageRefunds.table.user', 'User')}</TableHead>
                  <TableHead>{t('admin.manageRefunds.table.event', 'Event')}</TableHead>
                  <TableHead>{t('admin.manageRefunds.table.amount', 'Amount')}</TableHead>
                  <TableHead>{t('admin.manageRefunds.table.requested', 'Requested')}</TableHead>
                  <TableHead>{t('admin.manageRefunds.table.status', 'Status')}</TableHead>
                  <TableHead className="text-right">{t('admin.manageRefunds.table.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRefunds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {t('admin.manageRefunds.noRefunds', 'No refund requests found')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRefunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell className="font-medium">{refund.bookingId}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{refund.userName}</div>
                          <div className="text-sm text-muted-foreground">{refund.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{refund.eventTitle}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(refund.eventDate).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        <div>
                          {formatCurrency(refund.refundAmount)}
                          <div className="text-sm text-muted-foreground">
                            {refund.ticketQuantity} {refund.ticketQuantity > 1 ? 'tickets' : 'ticket'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(refund.requestedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(refund.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setShowDetailsDialog(true);
                            }}
                          >
                            View
                          </Button>
                          {refund.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRefund(refund);
                                  setShowApproveDialog(true);
                                }}
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRefund(refund);
                                  setShowRejectDialog(true);
                                }}
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
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

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('admin.manageRefunds.details.title', 'Refund Request Details')}</DialogTitle>
            </DialogHeader>
            {selectedRefund && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Booking ID</p>
                    <p className="font-medium">{selectedRefund.bookingId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedRefund.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">User</p>
                    <p className="font-medium">{selectedRefund.userName}</p>
                    <p className="text-sm text-muted-foreground">{selectedRefund.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Event</p>
                    <p className="font-medium">{selectedRefund.eventTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedRefund.eventDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tickets</p>
                    <p className="font-medium">{selectedRefund.ticketQuantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Refund Amount</p>
                    <p className="font-bold text-lg">{formatCurrency(selectedRefund.refundAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Requested At</p>
                    <p className="font-medium">{new Date(selectedRefund.requestedAt).toLocaleString()}</p>
                  </div>
                  {selectedRefund.processedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Processed At</p>
                      <p className="font-medium">{new Date(selectedRefund.processedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Customer Reason</p>
                  <p className="p-3 bg-muted rounded-lg">{selectedRefund.reason}</p>
                </div>
                {selectedRefund.adminNotes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Admin Notes</p>
                    <p className="p-3 bg-muted rounded-lg">{selectedRefund.adminNotes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
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
              <div className="py-4 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-semibold">{selectedRefund.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Event</p>
                  <p className="font-semibold">{selectedRefund.eventTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Refund Amount</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(selectedRefund.refundAmount)}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={isLoading}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleApprove} disabled={isLoading}>
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
                  <p className="font-semibold">{selectedRefund.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedRefund.eventTitle}</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedRefund.refundAmount)}</p>
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
