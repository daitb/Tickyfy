import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Calendar, MapPin, PartyPopper, Info } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import { Separator } from '../components/ui/separator';
import type { WaitlistEntry } from '../types';
import { mockEvents, mockWaitlist } from '../mockData';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface WaitlistProps {
  waitlistEntries?: WaitlistEntry[];
  onNavigate: (page: string, eventId?: string) => void;
}

export function Waitlist({ waitlistEntries, onNavigate }: WaitlistProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');

  // Use provided waitlist or mock data
  const allWaitlistEntries = waitlistEntries || mockWaitlist;

  // Filter entries based on status
  const activeEntries = allWaitlistEntries.filter(entry => entry.status === 'active');
  const notifiedEntries = allWaitlistEntries.filter(entry => entry.status === 'notified');
  const expiredEntries = allWaitlistEntries.filter(entry => entry.status === 'expired');

  const getFilteredEntries = () => {
    switch (activeTab) {
      case 'active':
        return activeEntries;
      case 'notified':
        return notifiedEntries;
      case 'expired':
        return expiredEntries;
      default:
        return allWaitlistEntries;
    }
  };

  const displayEntries = getFilteredEntries();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    
    if (timeString) {
      return `${formattedDate} • ${timeString}`;
    }
    return formattedDate;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          dotColor: 'bg-blue-500',
          text: 'Active - Waiting for tickets',
          textColor: 'text-blue-700'
        };
      case 'notified':
        return {
          dotColor: 'bg-green-500',
          text: 'Notified - Tickets available!',
          textColor: 'text-green-700'
        };
      case 'expired':
        return {
          dotColor: 'bg-neutral-400',
          text: 'Expired - Waitlist closed',
          textColor: 'text-neutral-600'
        };
      default:
        return {
          dotColor: 'bg-neutral-400',
          text: status,
          textColor: 'text-neutral-600'
        };
    }
  };

  const handleLeaveWaitlist = (entryId: string) => {
    console.log('Leave waitlist:', entryId);
  };

  const handleReserveNow = (eventId: string) => {
    onNavigate('event-detail', eventId);
  };

  if (displayEntries.length === 0 && activeTab === 'all') {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="mb-2">My Waitlist</h1>
            <p className="text-neutral-600">You'll be notified when tickets become available</p>
          </div>

          {/* Empty State */}
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-neutral-100 mb-6">
              <Clock size={48} className="text-neutral-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-neutral-900 mb-2">You're not on any waitlists</h2>
            <p className="text-neutral-600 mb-6">Join a waitlist to get notified when tickets become available</p>
            <Button onClick={() => onNavigate('listing')}>
              Browse Sold Out Events
            </Button>
          </div>

          {/* Info Sidebar */}
          <Card className="max-w-2xl mx-auto mt-12 bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-blue-900 mb-4">How Waitlist Works</h3>
              <div className="space-y-3 text-blue-800">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <p>Join the waitlist for sold-out events</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <p>Get notified when tickets become available</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <p>Reserve your spot within 24 hours</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <p>First come, first served basis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasNotifiedEntries = notifiedEntries.length > 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2">My Waitlist</h1>
          <p className="text-neutral-600">You'll be notified when tickets become available</p>
        </div>

        {/* Notification Banner */}
        {hasNotifiedEntries && (
          <Alert className="mb-8 bg-green-50 border-green-200">
            <PartyPopper className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 ml-2">
              <strong>🎉 Good news!</strong> Tickets are now available for {notifiedEntries.length} {notifiedEntries.length === 1 ? 'event' : 'events'}
              <Button 
                variant="link" 
                className="ml-2 text-green-700 p-0 h-auto"
                onClick={() => setActiveTab('notified')}
              >
                View Opportunities
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Status Filter */}
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active ({activeEntries.length})</TabsTrigger>
              <TabsTrigger value="notified">Notified ({notifiedEntries.length})</TabsTrigger>
              <TabsTrigger value="expired">Expired ({expiredEntries.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Waitlist Entries */}
        <div className="space-y-4">
          {displayEntries.map((entry) => {
            const event = mockEvents.find(e => e.id === entry.eventId);
            if (!event) return null;

            const statusConfig = getStatusConfig(entry.status);

            return (
              <Card 
                key={entry.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row gap-6 p-6">
                    {/* Event Thumbnail */}
                    <div className="lg:w-64 flex-shrink-0">
                      <div 
                        className="aspect-[16/10] rounded-lg overflow-hidden bg-neutral-100 cursor-pointer relative"
                        onClick={() => onNavigate('event-detail', event.id)}
                      >
                        <ImageWithFallback
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                            {event.category}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 
                          className="mb-2 cursor-pointer hover:text-teal-600 transition-colors"
                          onClick={() => onNavigate('event-detail', event.id)}
                        >
                          {event.title}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-neutral-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span className="text-sm">{formatDateTime(event.date, event.time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span className="text-sm">{event.venue}, {event.city}</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Status Row */}
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
                        <span className={`font-medium ${statusConfig.textColor}`}>
                          {statusConfig.text}
                        </span>
                      </div>

                      {/* Position and Dates */}
                      <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                        {entry.status === 'active' && entry.position > 0 && (
                          <div>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              {entry.position === 1 ? 'Next in line!' : `#${entry.position} in waitlist`}
                            </Badge>
                          </div>
                        )}
                        <div>
                          Joined {formatDate(entry.joinedAt)}
                        </div>
                        {entry.estimatedNotification && entry.status === 'active' && (
                          <div>
                            Est. notification: {formatDate(entry.estimatedNotification)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Section */}
                    <div className="lg:w-48 flex-shrink-0 flex flex-col justify-center gap-3">
                      {entry.status === 'notified' && (
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => handleReserveNow(event.id)}
                        >
                          Reserve Now
                        </Button>
                      )}
                      {entry.status === 'active' && (
                        <Button 
                          variant="outline" 
                          className="w-full text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleLeaveWaitlist(entry.id)}
                        >
                          Leave Waitlist
                        </Button>
                      )}
                      {entry.status === 'expired' && (
                        <Button 
                          variant="ghost" 
                          className="w-full"
                          disabled
                        >
                          Expired
                        </Button>
                      )}

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full">
                              <Info size={16} className="mr-2" />
                              What happens next?
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">
                              {entry.status === 'active' && 
                                "We'll notify you via email when tickets become available. You'll have 24 hours to complete your purchase."
                              }
                              {entry.status === 'notified' && 
                                "Tickets are available now! Reserve your spot before they're gone. You have 24 hours from notification."
                              }
                              {entry.status === 'expired' && 
                                "This waitlist has closed. Check out other upcoming events you might enjoy."
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Sidebar for Desktop */}
        <Card className="mt-12 bg-blue-50 border-blue-200 hidden lg:block">
          <CardContent className="p-8">
            <h3 className="text-blue-900 mb-6">How Waitlist Works</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center font-medium">
                    1
                  </div>
                  <div>
                    <div className="font-medium text-blue-900 mb-1">Join the waitlist</div>
                    <p className="text-sm text-blue-700">For sold-out events you want to attend</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center font-medium">
                    2
                  </div>
                  <div>
                    <div className="font-medium text-blue-900 mb-1">Get notified</div>
                    <p className="text-sm text-blue-700">When tickets become available via email</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center font-medium">
                    3
                  </div>
                  <div>
                    <div className="font-medium text-blue-900 mb-1">Reserve your spot</div>
                    <p className="text-sm text-blue-700">Within 24 hours of notification</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center font-medium">
                    4
                  </div>
                  <div>
                    <div className="font-medium text-blue-900 mb-1">First come, first served</div>
                    <p className="text-sm text-blue-700">Act fast to secure your tickets</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
