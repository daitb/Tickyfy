import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, Ticket, DollarSign, Plus, MoreVertical, Eye, Edit, 
  Copy, Trash2, XCircle, LayoutGrid, List, Search, TrendingUp, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { organizerService, type OrganizerEventDto } from '../services/organizerService';
import { authService } from '../services/authService';
import apiClient from '../services/apiClient';

interface EventManagementProps {
  onNavigate: (page: string, eventId?: string) => void;
}

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'Pending' | 'Approved' | 'Rejected' | 'Published' | 'Cancelled' | 'Completed';
type DateFilter = 'all' | 'upcoming' | 'past';

export function EventManagement({ onNavigate }: EventManagementProps) {
  const { t } = useTranslation();
  const organizerId = authService.getCurrentOrganizerId();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [eventToCancel, setEventToCancel] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [events, setEvents] = useState<OrganizerEventDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load events from API
  useEffect(() => {
    const loadEvents = async () => {
      if (!organizerId) {
        setError('Organizer ID not found');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await organizerService.getOrganizerEvents(organizerId);
        console.log('Loaded events:', data);
        console.log('First event banner:', data[0]?.bannerImage);
        setEvents(data);
      } catch (err: any) {
        console.error('Error loading events:', err);
        setError(err.message || 'Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [organizerId]);

  // Calculate stats from real data
  const totalEvents = events.length;
  const activeEvents = events.filter(e => e.status === 'Approved').length;
  const totalTicketsSold = events.reduce((sum, e) => sum + e.soldSeats, 0);
  const totalRevenue = events.reduce((sum, e) => sum + e.revenue, 0);

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    
    const eventDate = new Date(event.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const matchesDate = dateFilter === 'all' || 
                       (dateFilter === 'upcoming' && eventDate >= today) ||
                       (dateFilter === 'past' && eventDate < today);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-amber-100 text-amber-700">{t('eventManagement.pending')}</Badge>;
      case 'Approved':
        return <Badge className="bg-blue-100 text-blue-700">{t('eventManagement.approved')}</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-700">{t('eventManagement.rejected')}</Badge>;
      case 'Published':
        return <Badge className="bg-green-100 text-green-700">{t('eventManagement.published')}</Badge>;
      case 'Cancelled':
        return <Badge className="bg-gray-100 text-gray-700">{t('eventManagement.cancelled')}</Badge>;
      case 'Completed':
        return <Badge className="bg-purple-100 text-purple-700">{t('eventManagement.completed')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
    }
  };

  const handleEventAction = (action: string, eventId: string) => {
    const event = events.find(e => e.eventId === Number(eventId));
    
    switch (action) {
      case 'view':
        onNavigate('event-detail', eventId);
        break;
      case 'edit':
        if (event) {
          // Check if event is completed
          if (event.status === 'Completed') {
            toast.error(
              t('eventManagement.cannotEditCompletedEvent') || 'Cannot edit completed event',
              {
                description: t('eventManagement.cannotEditCompletedEventDesc') || 'Events that have been completed cannot be edited.',
                duration: 4000
              }
            );
            return;
          }
          
          // Check if event is cancelled
          if (event.status === 'Cancelled') {
            toast.error(
              t('eventManagement.cannotEditCancelledEvent') || 'Cannot edit cancelled event',
              {
                description: t('eventManagement.cannotEditCancelledEventDesc') || 'Cancelled events cannot be edited.',
                duration: 4000
              }
            );
            return;
          }
          
          // Check if event has already started
          const eventStartDate = new Date(event.startDate);
          const now = new Date();
          
          if (eventStartDate <= now) {
            toast.error(
              t('eventManagement.cannotEditStartedEvent') || 'Cannot edit event that has already started',
              {
                description: t('eventManagement.cannotEditStartedEventDesc') || 'Events that have started or already ended cannot be edited.',
                duration: 4000
              }
            );
            return;
          }
        }
        // Navigate to edit page
        onNavigate('organizer-wizard', eventId);
        break;
      case 'analytics':
        // Navigate to analytics page
        onNavigate('event-analytics', eventId);
        break;
      case 'duplicate':
        console.log('Duplicate event:', eventId);
        toast.info(
          t('eventManagement.duplicateFeatureComingSoon') || 'Duplicate feature coming soon',
          {
            description: t('eventManagement.duplicateFeatureDesc') || 'This feature is under development.',
            duration: 3000
          }
        );
        break;
      case 'cancel':
        if (event) {
          // Check if event can be cancelled
          if (event.status === 'Completed' || event.status === 'Cancelled') {
            toast.error(
              t('eventManagement.cannotCancelEvent') || 'Cannot cancel this event',
              {
                description: t('eventManagement.cannotCancelEventDesc') || 'This event cannot be cancelled.',
                duration: 4000
              }
            );
            return;
          }
        }
        setEventToCancel(eventId);
        break;
      case 'delete':
        if (event) {
          // Check if event can be deleted (only drafts or rejected events)
          if (event.status !== 'Pending' && event.status !== 'Rejected') {
            toast.error(
              t('eventManagement.cannotDeleteEvent') || 'Cannot delete this event',
              {
                description: t('eventManagement.cannotDeletePublishedEvent') || 'Only pending or rejected events can be deleted. Please cancel the event instead.',
                duration: 4000
              }
            );
            return;
          }
        }
        setEventToDelete(eventId);
        break;
    }
  };

  const confirmCancelEvent = () => {
    console.log('Cancelling event:', eventToCancel);
    setEventToCancel(null);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    try {
      await apiClient.delete(`/events/${eventToDelete}`);

      toast.success(
        t('eventManagement.deleteSuccess') || 'Event deleted successfully',
        {
          description: t('eventManagement.deleteSuccessDesc') || 'The event has been permanently deleted.',
          duration: 3000
        }
      );
      
      // Remove event from list
      setEvents(events.filter(e => e.eventId !== Number(eventToDelete)));
    } catch (error: any) {
      console.error('Error deleting event:', error);
      
      let errorMessage = t('eventManagement.deleteErrorDesc') || 'An error occurred while deleting the event.';
      
      if (error.response?.status === 403) {
        errorMessage = t('eventManagement.deleteForbidden') || 'You do not have permission to delete this event. Only pending or rejected events created by you can be deleted.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(
        t('eventManagement.deleteFailed') || 'Failed to delete event',
        {
          description: errorMessage,
          duration: 5000
        }
      );
    } finally {
      setEventToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1>{t('editEvent.myEvents')}</h1>
          <div className="flex gap-3">
            <Button
              onClick={() => onNavigate('organizer-wizard')}
              className="bg-teal-500 hover:bg-teal-600"
            >
              <Plus size={18} className="mr-2" />
              {t('eventManagement.createEvent')}
            </Button>
            <div className="flex gap-1 bg-white rounded-lg border p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-teal-500 hover:bg-teal-600' : ''}
              >
                <LayoutGrid size={16} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-teal-500 hover:bg-teal-600' : ''}
              >
                <List size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-600">{t('eventManagement.totalEvents')}</div>
                <Calendar className="text-teal-500" size={20} />
              </div>
              <div className="text-2xl text-neutral-900">{totalEvents}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-600">{t('eventManagement.activeEvents')}</div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <div className="text-2xl text-neutral-900">{activeEvents}</div>
              <div className="text-xs text-green-600 mt-1">{t('eventManagement.published')}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-600">{t('eventManagement.ticketsSold')}</div>
                <Ticket className="text-teal-500" size={20} />
              </div>
              <div className="text-2xl text-neutral-900">{totalTicketsSold.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-600">{t('eventManagement.totalRevenue')}</div>
                <DollarSign className="text-teal-500" size={20} />
              </div>
              <div className="text-2xl text-neutral-900">
                {formatPrice(totalRevenue).replace('₫', '')}₫
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <Input
                  placeholder={t('eventManagement.searchEvents')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t('eventManagement.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('eventManagement.allStatus')}</SelectItem>
                  <SelectItem value="Pending">{t('eventManagement.pending')}</SelectItem>
                  <SelectItem value="Approved">{t('eventManagement.approved')}</SelectItem>
                  <SelectItem value="Rejected">{t('eventManagement.rejected')}</SelectItem>
                  <SelectItem value="Published">{t('eventManagement.published')}</SelectItem>
                  <SelectItem value="Cancelled">{t('eventManagement.cancelled')}</SelectItem>
                  <SelectItem value="Completed">{t('eventManagement.completed')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t('eventManagement.date')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('eventManagement.allTime')}</SelectItem>
                  <SelectItem value="upcoming">{t('eventManagement.upcoming')}</SelectItem>
                  <SelectItem value="past">{t('eventManagement.past')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid View */}
        {isLoading ? (
          <Card className="p-16">
            <div className="text-center">
              <div className="text-neutral-600">{t('common.loading', 'Loading...')}</div>
            </div>
          </Card>
        ) : error ? (
          <Card className="p-16">
            <div className="text-center">
              <div className="text-red-600">{error}</div>
            </div>
          </Card>
        ) : viewMode === 'grid' && (
          <>
            {filteredEvents.length === 0 ? (
              <Card className="p-16">
                <div className="text-center">
                  <Calendar className="mx-auto text-neutral-400 mb-4" size={64} />
                  <h3 className="text-neutral-900 mb-2">
                    {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                      ? t('eventManagement.noEvents')
                      : t('eventManagement.noEvents')
                    }
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : t('eventManagement.noEventsMessage')
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && dateFilter === 'all' && (
                    <Button
                      onClick={() => onNavigate('organizer-wizard')}
                      className="bg-teal-500 hover:bg-teal-600"
                    >
                      <Plus size={18} className="mr-2" />
                      {t('eventManagement.createEvent')}
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Card key={event.eventId} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <div className="aspect-video bg-gradient-to-br from-teal-100 to-orange-100 overflow-hidden">
                        {event.bannerImage ? (
                          <img 
                            src={
                              event.bannerImage.startsWith('http') || event.bannerImage.startsWith('https') 
                                ? event.bannerImage 
                                : event.bannerImage.startsWith('/') 
                                  ? `http://localhost:5179${event.bannerImage}`
                                  : `http://localhost:5179/${event.bannerImage}`
                            } 
                            alt={event.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image load error for:', event.bannerImage);
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.fallback-icon')) {
                                const fallback = document.createElement('div');
                                fallback.className = 'w-full h-full flex items-center justify-center fallback-icon';
                                fallback.innerHTML = '<svg class="text-teal-500" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="text-teal-500" size={48} />
                          </div>
                        )}
                      </div>
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(event.status)}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-neutral-900 mb-2 line-clamp-1">
                        {event.title}
                      </h3>
                      <div className="space-y-1 text-sm text-neutral-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="flex items-center justify-between py-3 border-t">
                        <div>
                          <div className="text-xs text-neutral-600">{t('eventManagement.ticketsSold')}</div>
                          <div className="text-neutral-900">
                            {event.soldSeats}/{event.totalSeats}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-neutral-600">{t('eventManagement.revenue')}</div>
                          <div className="text-teal-600">
                            {formatPrice(event.revenue)}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-0"
                          onClick={() => handleEventAction('view', String(event.eventId))}
                        >
                          <Eye size={14} className="mr-1 flex-shrink-0" />
                          <span className="truncate">{t('eventManagement.viewDetails')}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-0"
                          onClick={() => handleEventAction('edit', String(event.eventId))}
                          disabled={event.status === 'Completed' || event.status === 'Cancelled'}
                        >
                          <Edit size={14} className="mr-1 flex-shrink-0" />
                          <span className="truncate">{t('eventManagement.editEvent')}</span>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-shrink-0 px-2">
                              <MoreVertical size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEventAction('analytics', String(event.eventId))}>
                              <TrendingUp size={14} className="mr-2" />
                              {t('eventManagement.viewAnalytics', 'View Analytics')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEventAction('duplicate', String(event.eventId))}>
                              <Copy size={14} className="mr-2" />
                              {t('eventManagement.duplicate')}
                            </DropdownMenuItem>
                            {event.status !== 'Completed' && event.status !== 'Cancelled' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleEventAction('cancel', String(event.eventId))}
                                  className="text-orange-600"
                                >
                                  <XCircle size={14} className="mr-2" />
                                  {t('eventManagement.cancelEvent')}
                                </DropdownMenuItem>
                              </>
                            )}
                            {(event.status === 'Pending' || event.status === 'Rejected') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleEventAction('delete', String(event.eventId))}
                                  className="text-red-600"
                                >
                                  <Trash2 size={14} className="mr-2" />
                                  {t('eventManagement.deleteEvent')}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Events List View */}
        {viewMode === 'list' && (
          <Card>
            <CardContent className="p-0">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-16">
                  <Calendar className="mx-auto text-neutral-400 mb-4" size={64} />
                  <h3 className="text-neutral-900 mb-2">
                    {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                      ? t('eventManagement.noEvents')
                      : t('eventManagement.noEvents')
                    }
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : t('eventManagement.noEventsMessage')
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && dateFilter === 'all' && (
                    <Button
                      onClick={() => onNavigate('organizer-wizard')}
                      className="bg-teal-500 hover:bg-teal-600"
                    >
                      <Plus size={18} className="mr-2" />
                      {t('eventManagement.createEvent')}
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('eventManagement.eventName')}</TableHead>
                      <TableHead>{t('eventManagement.date')}</TableHead>
                      <TableHead>{t('eventManagement.status')}</TableHead>
                      <TableHead className="text-right">{t('eventManagement.sold')}</TableHead>
                      <TableHead className="text-right">{t('eventManagement.revenue')}</TableHead>
                      <TableHead className="text-right w-[80px]">{t('eventManagement.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event.eventId} className="hover:bg-neutral-50">
                        <TableCell>
                          <div className="text-neutral-900">{event.title}</div>
                        </TableCell>
                        <TableCell>
                          <div>{formatDate(event.startDate)}</div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(event.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          {event.soldSeats}/{event.totalSeats}
                        </TableCell>
                        <TableCell className="text-right text-teal-600">
                          {formatPrice(event.revenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEventAction('view', String(event.eventId))}>
                                <Eye size={14} className="mr-2" />
                                {t('eventManagement.viewDetails')}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleEventAction('edit', String(event.eventId))}
                                disabled={event.status === 'Completed' || event.status === 'Cancelled'}
                              >
                                <Edit size={14} className="mr-2" />
                                {t('eventManagement.editEvent')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEventAction('analytics', String(event.eventId))}>
                                <TrendingUp size={14} className="mr-2" />
                                {t('eventManagement.viewAnalytics', 'View Analytics')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEventAction('duplicate', String(event.eventId))}>
                                <Copy size={14} className="mr-2" />
                                {t('eventManagement.duplicate')}
                              </DropdownMenuItem>
                              {event.status !== 'Completed' && event.status !== 'Cancelled' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleEventAction('cancel', String(event.eventId))}
                                    className="text-orange-600"
                                  >
                                    <XCircle size={14} className="mr-2" />
                                    {t('eventManagement.cancelEvent')}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {(event.status === 'Pending' || event.status === 'Rejected') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleEventAction('delete', String(event.eventId))}
                                    className="text-red-600"
                                  >
                                    <Trash2 size={14} className="mr-2" />
                                    {t('eventManagement.deleteEvent')}
                                  </DropdownMenuItem>
                                </>
                              )}
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
        )}
      </div>

      {/* Cancel Event Dialog */}
      <Dialog open={!!eventToCancel} onOpenChange={() => setEventToCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('eventManagement.cancelEventTitle')}</DialogTitle>
            <DialogDescription>
              {t('eventManagement.cancelEventMessage')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventToCancel(null)}>
              {t('eventManagement.keepEvent')}
            </Button>
            <Button 
              className="bg-red-500 hover:bg-red-600"
              onClick={confirmCancelEvent}
            >
              {t('eventManagement.confirmCancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Event Dialog */}
      <Dialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('eventManagement.deleteEventTitle')}</DialogTitle>
            <DialogDescription>
              {t('eventManagement.deleteEventMessage')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventToDelete(null)}>
              {t('eventManagement.keepIt')}
            </Button>
            <Button 
              className="bg-red-500 hover:bg-red-600"
              onClick={confirmDeleteEvent}
            >
              {t('eventManagement.confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}