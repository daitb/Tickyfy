import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, CheckCircle, XCircle, Clock, Search, Calendar } from 'lucide-react';
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

interface Payout {
  id: string;
  organizerId: string;
  organizerName: string;
  eventTitle: string;
  amount: number;
  bankAccountNumber: string;
  bankName: string;
  accountHolderName: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

export function ManagePayouts() {
  const { t } = useTranslation();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'processed'>('all');
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Replace with actual API call
  useEffect(() => {
    const mockPayouts: Payout[] = [
      {
        id: '1',
        organizerId: 'org1',
        organizerName: 'MusicEvents Co.',
        eventTitle: 'Summer Music Festival 2024',
        amount: 125000000,
        bankAccountNumber: '1234567890',
        bankName: 'Vietcombank',
        accountHolderName: 'Nguyen Van A',
        status: 'pending',
        requestedAt: '2024-01-15T10:30:00',
      },
      {
        id: '2',
        organizerId: 'org2',
        organizerName: 'TechHub Vietnam',
        eventTitle: 'Tech Conference 2024',
        amount: 45000000,
        bankAccountNumber: '0987654321',
        bankName: 'Techcombank',
        accountHolderName: 'Tran Thi B',
        status: 'approved',
        requestedAt: '2024-01-14T14:20:00',
        processedAt: '2024-01-15T09:00:00'
      },
      {
        id: '3',
        organizerId: 'org3',
        organizerName: 'Gourmet Events',
        eventTitle: 'Food & Wine Expo',
        amount: 32000000,
        bankAccountNumber: '5555666677',
        bankName: 'ACB',
        accountHolderName: 'Le Van C',
        status: 'pending',
        requestedAt: '2024-01-16T08:15:00',
      }
    ];
    setPayouts(mockPayouts);
  }, []);

  const handleApprove = async () => {
    if (!selectedPayout) return;
    
    setIsLoading(true);
    try {
      // TODO: Call API to approve payout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPayouts(payouts.map(p => 
        p.id === selectedPayout.id 
          ? { ...p, status: 'approved', processedAt: new Date().toISOString() }
          : p
      ));
      
      setShowApproveDialog(false);
      setSelectedPayout(null);
    } catch (error) {
      console.error('Failed to approve payout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayout || !rejectionReason.trim()) return;
    
    setIsLoading(true);
    try {
      // TODO: Call API to reject payout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPayouts(payouts.map(p => 
        p.id === selectedPayout.id 
          ? { ...p, status: 'rejected', processedAt: new Date().toISOString(), notes: rejectionReason }
          : p
      ));
      
      setShowRejectDialog(false);
      setSelectedPayout(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject payout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = 
      payout.organizerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.bankAccountNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      approved: { variant: 'default' as const, label: 'Approved' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' },
      processed: { variant: 'outline' as const, label: 'Processed' }
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
      title: 'Total Payouts',
      value: payouts.length,
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      title: 'Pending',
      value: payouts.filter(p => p.status === 'pending').length,
      icon: <Clock className="w-5 h-5" />
    },
    {
      title: 'Approved',
      value: payouts.filter(p => p.status === 'approved').length,
      icon: <CheckCircle className="w-5 h-5" />
    },
    {
      title: 'Total Amount',
      value: formatCurrency(payouts.reduce((sum, p) => sum + p.amount, 0)),
      icon: <DollarSign className="w-5 h-5" />
    }
  ];

  return (
    <div className="py-8 px-4 bg-background min-h-screen">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('admin.managePayouts.title', 'Manage Payouts')}</h1>
          <p className="text-muted-foreground">
            {t('admin.managePayouts.subtitle', 'Review and process payout requests')}
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
                  placeholder={t('admin.managePayouts.search', 'Search organizers, events, or account...')}
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

        {/* Payouts Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.managePayouts.table.organizer', 'Organizer')}</TableHead>
                  <TableHead>{t('admin.managePayouts.table.event', 'Event')}</TableHead>
                  <TableHead>{t('admin.managePayouts.table.amount', 'Amount')}</TableHead>
                  <TableHead>{t('admin.managePayouts.table.bankDetails', 'Bank Details')}</TableHead>
                  <TableHead>{t('admin.managePayouts.table.requestedAt', 'Requested')}</TableHead>
                  <TableHead>{t('admin.managePayouts.table.status', 'Status')}</TableHead>
                  <TableHead className="text-right">{t('admin.managePayouts.table.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {t('admin.managePayouts.noPayouts', 'No payout requests found')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">{payout.organizerName}</TableCell>
                      <TableCell>{payout.eventTitle}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(payout.amount)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{payout.bankName}</div>
                          <div className="text-muted-foreground">{payout.accountHolderName}</div>
                          <div className="text-muted-foreground">{payout.bankAccountNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(payout.requestedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell className="text-right">
                        {payout.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPayout(payout);
                                setShowApproveDialog(true);
                              }}
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPayout(payout);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.managePayouts.approve.title', 'Approve Payout')}</DialogTitle>
              <DialogDescription>
                {t('admin.managePayouts.approve.description', 'Confirm payout approval for this request')}
              </DialogDescription>
            </DialogHeader>
            {selectedPayout && (
              <div className="py-4 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Organizer</p>
                  <p className="font-semibold">{selectedPayout.organizerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Event</p>
                  <p className="font-semibold">{selectedPayout.eventTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(selectedPayout.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bank Details</p>
                  <p className="font-medium">{selectedPayout.bankName}</p>
                  <p className="text-sm">{selectedPayout.accountHolderName}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayout.bankAccountNumber}</p>
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
              <DialogTitle>{t('admin.managePayouts.reject.title', 'Reject Payout')}</DialogTitle>
              <DialogDescription>
                {t('admin.managePayouts.reject.description', 'Please provide a reason for rejection')}
              </DialogDescription>
            </DialogHeader>
            {selectedPayout && (
              <div className="py-4 space-y-4">
                <div>
                  <p className="font-semibold">{selectedPayout.organizerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayout.eventTitle}</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedPayout.amount)}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">{t('admin.managePayouts.reject.reason', 'Rejection Reason')}</Label>
                  <Textarea
                    id="reason"
                    placeholder={t('admin.managePayouts.reject.reasonPlaceholder', 'Enter the reason for rejection...')}
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

export default ManagePayouts;
