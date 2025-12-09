import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Users, Eye, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
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

interface Event {
  id: string;
  title: string;
  organizerName: string;
  date: string;
  location: string;
  city: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  ticketsSold: number;
  capacity: number;
  submittedAt: string;
}

export function ManageEvents() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Replace with actual API call
  useEffect(() => {
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Summer Music Festival 2024',
        organizerName: 'MusicEvents Co.',
        date: '2024-07-15',
        location: 'Central Park',
        city: 'Ho Chi Minh City',
        category: 'Music',
        status: 'pending',
        ticketsSold: 0,
        capacity: 5000,
        submittedAt: '2024-01-10'
      },
      {
        id: '2',
        title: 'Tech Conference 2024',
        organizerName: 'TechHub Vietnam',
        date: '2024-08-20',
        location: 'Innovation Center',
        city: 'Hanoi',
        category: 'Technology',
        status: 'approved',
        ticketsSold: 234,
        capacity: 500,
        submittedAt: '2024-01-08'
      },
      {
        id: '3',
        title: 'Food & Wine Expo',
        organizerName: 'Gourmet Events',
        date: '2024-06-10',
        location: 'Convention Hall',
        city: 'Da Nang',
        category: 'Food',
        status: 'pending',
        ticketsSold: 0,
        capacity: 1000,
        submittedAt: '2024-01-12'
      }
    ];
    setEvents(mockEvents);
  }, []);

  const handleApprove = async () => {
    if (!selectedEvent) return;
    
    setIsLoading(true);
    try {
      // TODO: Call API to approve event
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEvents(events.map(e => 
        e.id === selectedEvent.id ? { ...e, status: 'approved' } : e
      ));
      
      setShowApproveDialog(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to approve event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEvent || !rejectionReason.trim()) return;
    
    setIsLoading(true);
    try {
      // TODO: Call API to reject event
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEvents(events.map(e => 
        e.id === selectedEvent.id ? { ...e, status: 'rejected' } : e
      ));
      
      setShowRejectDialog(false);
      setSelectedEvent(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
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

  const stats = [
    {
      title: 'Total Events',
      value: events.length,
      icon: <Calendar className="w-5 h-5" />
    },
    {
      title: 'Pending Approval',
      value: events.filter(e => e.status === 'pending').length,
      icon: <Clock className="w-5 h-5" />
    },
    {
      title: 'Approved',
      value: events.filter(e => e.status === 'approved').length,
      icon: <CheckCircle className="w-5 h-5" />
    },
    {
      title: 'Rejected',
      value: events.filter(e => e.status === 'rejected').length,
      icon: <XCircle className="w-5 h-5" />
    }
  ];

  return (
    <div className="py-8 px-4 bg-background min-h-screen">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('admin.manageEvents.title', 'Manage Events')}</h1>
          <p className="text-muted-foreground">
            {t('admin.manageEvents.subtitle', 'Review and approve event submissions')}
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
                  placeholder={t('admin.manageEvents.search', 'Search events or organizers...')}
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

        {/* Events Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.manageEvents.table.event', 'Event')}</TableHead>
                  <TableHead>{t('admin.manageEvents.table.organizer', 'Organizer')}</TableHead>
                  <TableHead>{t('admin.manageEvents.table.date', 'Date')}</TableHead>
                  <TableHead>{t('admin.manageEvents.table.location', 'Location')}</TableHead>
                  <TableHead>{t('admin.manageEvents.table.capacity', 'Capacity')}</TableHead>
                  <TableHead>{t('admin.manageEvents.table.status', 'Status')}</TableHead>
                  <TableHead className="text-right">{t('admin.manageEvents.table.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {t('admin.manageEvents.noEvents', 'No events found')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{event.title}</div>
                          <div className="text-sm text-muted-foreground">{event.category}</div>
                        </div>
                      </TableCell>
                      <TableCell>{event.organizerName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm">{event.location}</div>
                            <div className="text-xs text-muted-foreground">{event.city}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {event.ticketsSold}/{event.capacity}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(event.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {event.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowApproveDialog(true);
                                }}
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEvent(event);
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

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.manageEvents.approve.title', 'Approve Event')}</DialogTitle>
              <DialogDescription>
                {t('admin.manageEvents.approve.description', 'Are you sure you want to approve this event?')}
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <div className="py-4">
                <p className="font-semibold">{selectedEvent.title}</p>
                <p className="text-sm text-muted-foreground">{selectedEvent.organizerName}</p>
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
              <DialogTitle>{t('admin.manageEvents.reject.title', 'Reject Event')}</DialogTitle>
              <DialogDescription>
                {t('admin.manageEvents.reject.description', 'Please provide a reason for rejection')}
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <div className="py-4 space-y-4">
                <div>
                  <p className="font-semibold">{selectedEvent.title}</p>
                  <p className="text-sm text-muted-foreground">{selectedEvent.organizerName}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">{t('admin.manageEvents.reject.reason', 'Rejection Reason')}</Label>
                  <Textarea
                    id="reason"
                    placeholder={t('admin.manageEvents.reject.reasonPlaceholder', 'Enter the reason for rejection...')}
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

export default ManageEvents;
