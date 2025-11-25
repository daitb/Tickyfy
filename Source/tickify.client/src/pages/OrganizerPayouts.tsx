import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { payoutService, type PayoutDto, type PayoutStatsDto, type RequestPayoutDto } from '../services/payoutService';
import { organizerService, type OrganizerEventDto } from '../services/organizerService';
import { authService } from '../services/authService';

interface OrganizerPayoutsProps {
  onNavigate: (page: string, eventId?: string) => void;
}

export function OrganizerPayouts({ onNavigate }: OrganizerPayoutsProps) {
  const [payouts, setPayouts] = useState<PayoutDto[]>([]);
  const [stats, setStats] = useState<PayoutStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestForm, setRequestForm] = useState<RequestPayoutDto>({
    eventId: 0,
    amount: 0,
    bankAccountNumber: '',
    bankName: '',
    accountHolderName: '',
  });
  const [events, setEvents] = useState<OrganizerEventDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const organizerId = authService.getCurrentOrganizerId();

  useEffect(() => {
    if (!organizerId) {
      setLoading(false);
      return;
    }
    loadData(organizerId);
  }, [organizerId]);

  const loadData = async (currentOrganizerId: number) => {
    try {
      setLoading(true);
      const payoutsData = await payoutService.getAllPayouts();
      const ownPayouts = payoutsData.filter((payout) => payout.organizerId === currentOrganizerId);
      setPayouts(ownPayouts);

      const organizerEvents = await organizerService.getOrganizerEvents(currentOrganizerId);
      setEvents(organizerEvents);

      const statsData = await payoutService.getOrganizerStats(currentOrganizerId);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!requestForm.eventId || !requestForm.amount || !requestForm.bankAccountNumber || 
        !requestForm.bankName || !requestForm.accountHolderName) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await payoutService.requestPayout(requestForm);
      setSuccess('Payout request submitted successfully');
      setShowRequestDialog(false);
      setRequestForm({
        eventId: 0,
        amount: 0,
        bankAccountNumber: '',
        bankName: '',
        accountHolderName: '',
      });
      if (organizerId) {
        await loadData(organizerId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request payout');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock size={12} className="mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <CheckCircle size={12} className="mr-1" />
            Approved
          </Badge>
        );
      case 'processed':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle size={12} className="mr-1" />
            Processed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle size={12} className="mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!organizerId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white rounded-2xl p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold mb-3">Organizer access required</h1>
          <p className="text-neutral-600 mb-6">
            Become an organizer to request and track payouts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => onNavigate('home')} className="flex-1">
              Back to Home
            </Button>
            <Button
              onClick={() => onNavigate('become-organizer')}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              Become an Organizer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('organizer-dashboard')}
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              <h1>Payout Management</h1>
            </div>
            <p className="text-neutral-600">Request and track your earnings payouts</p>
          </div>
          <Button
            onClick={() => setShowRequestDialog(true)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus size={16} className="mr-2" />
            Request Payout
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="text-red-600" size={16} />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="text-green-600" size={16} />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-neutral-600">Total Earnings</CardTitle>
                <DollarSign className="text-green-500" size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{formatPrice(stats.totalEarnings)}</div>
                <p className="text-xs text-neutral-500 mt-1">
                  Revenue: {formatPrice(stats.totalRevenue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-neutral-600">Platform Fees</CardTitle>
                <DollarSign className="text-orange-500" size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{formatPrice(stats.totalPlatformFees)}</div>
                <p className="text-xs text-neutral-500 mt-1">10% commission</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-neutral-600">Pending Payouts</CardTitle>
                <Clock className="text-yellow-500" size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{formatPrice(stats.pendingPayouts)}</div>
                <p className="text-xs text-neutral-500 mt-1">
                  {stats.pendingPayoutRequests} requests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-neutral-600">Processed</CardTitle>
                <CheckCircle className="text-green-500" size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{formatPrice(stats.processedPayouts)}</div>
                <p className="text-xs text-neutral-500 mt-1">Total paid out</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payouts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>All your payout requests and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                No payout requests yet. Request your first payout to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested At</TableHead>
                    <TableHead>Processed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.payoutId}>
                      <TableCell className="font-medium">#{payout.payoutId}</TableCell>
                      <TableCell>{formatPrice(payout.amount)}</TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell>
                        {new Date(payout.requestedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {payout.processedAt
                          ? new Date(payout.processedAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Request Payout Dialog */}
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Request a payout for your event earnings. Minimum payout amount is 100,000 VND.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="eventId">Event</Label>
                <select
                  id="eventId"
                  className="w-full px-3 py-2 border rounded-md"
                  value={requestForm.eventId}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, eventId: parseInt(e.target.value) })
                  }
                >
                  <option value={0}>Select an event</option>
                  {events.map((event) => (
                    <option key={event.eventId} value={event.eventId}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="amount">Amount (VND)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={requestForm.amount || ''}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, amount: parseFloat(e.target.value) })
                  }
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={requestForm.bankName}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, bankName: e.target.value })
                  }
                  placeholder="e.g., Vietcombank, Techcombank"
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={requestForm.bankAccountNumber}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, bankAccountNumber: e.target.value })
                  }
                  placeholder="Enter bank account number"
                />
              </div>
              <div>
                <Label htmlFor="accountName">Account Holder Name</Label>
                <Input
                  id="accountName"
                  value={requestForm.accountHolderName}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, accountHolderName: e.target.value })
                  }
                  placeholder="Enter account holder name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequestPayout} className="bg-orange-500 hover:bg-orange-600">
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

