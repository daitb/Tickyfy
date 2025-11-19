import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Save,
  Eye,
  Calendar,
  MapPin,
  Ticket,
  Image as ImageIcon,
  Plus,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Checkbox } from '../components/ui/checkbox';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { mockEvents } from '../mockData';

interface EditEventProps {
  eventId?: string;
  onNavigate: (page: string, eventId?: string) => void;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description: string;
}

export function EditEvent({ eventId, onNavigate }: EditEventProps) {
  const { t } = useTranslation();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Get event data
  const event = mockEvents.find((e) => e.id === eventId) || mockEvents[0];

  // Form state
  const [formData, setFormData] = useState({
    name: event.title,
    description: event.description,
    category: event.category,
    eventType: 'public',
    tags: ['music', 'concert'],
    date: event.date,
    startTime: event.time,
    endTime: '23:00',
    timezone: 'Asia/Ho_Chi_Minh',
    venueType: 'physical',
    venueName: event.venue,
    address: event.venue,
    city: event.city,
    district: '',
    mapsLink: '',
    onlineLink: '',
    refundPolicy: 'full',
    ageRestriction: 'all',
    accessibility: [],
    terms: '',
    publishImmediately: true,
  });

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { id: '1', name: 'VIP', price: 500000, quantity: 100, description: 'VIP access with premium seats' },
    { id: '2', name: 'Standard', price: 250000, quantity: 400, description: 'General admission' },
  ]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async (asDraft: boolean = false) => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    setHasUnsavedChanges(false);
    // Show success toast
    console.log('Event saved:', { asDraft, formData });
    if (!asDraft) {
      onNavigate('event-management');
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    } else {
      onNavigate('event-management');
    }
  };

  const addTicketType = () => {
    const newTicket: TicketType = {
      id: Date.now().toString(),
      name: '',
      price: 0,
      quantity: 0,
      description: '',
    };
    setTicketTypes([...ticketTypes, newTicket]);
    setHasUnsavedChanges(true);
  };

  const removeTicketType = (id: string) => {
    setTicketTypes(ticketTypes.filter((t) => t.id !== id));
    setHasUnsavedChanges(true);
  };

  const updateTicketType = (id: string, field: string, value: any) => {
    setTicketTypes(
      ticketTypes.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
    setHasUnsavedChanges(true);
  };

  const totalCapacity = ticketTypes.reduce((sum, t) => sum + t.quantity, 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-4">
          <button onClick={() => onNavigate('event-management')} className="hover:text-teal-600">
            My Events
          </button>
          <ChevronRight size={16} />
          <button onClick={() => onNavigate('event-detail', event.id)} className="hover:text-teal-600">
            {event.title}
          </button>
          <ChevronRight size={16} />
          <span className="text-neutral-900">Edit</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1>Edit Event</h1>
              <Badge className="bg-green-100 text-green-700">Published</Badge>
            </div>
            <p className="text-sm text-neutral-600">Last saved: 2 minutes ago</p>
          </div>
          <Button variant="outline" onClick={() => onNavigate('event-detail', event.id)}>
            <Eye size={16} className="mr-2" />
            Preview Event
          </Button>
        </div>

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertCircle className="text-amber-600" size={16} />
            <AlertDescription className="text-amber-800">
              You have unsaved changes. Don't forget to save your work.
            </AlertDescription>
          </Alert>
        )}

        {/* Form Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="datetime">Date & Time</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Basic Information */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="name">
                    Event Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter event name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your event..."
                    rows={6}
                    maxLength={1000}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    {formData.description.length}/1000 characters
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(v) => handleInputChange('category', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Music">Music</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                        <SelectItem value="Arts">Arts & Culture</SelectItem>
                        <SelectItem value="Food">Food & Drink</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Event Type</Label>
                    <Select value={formData.eventType} onValueChange={(v) => handleInputChange('eventType', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="invite">Invite Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} className="bg-teal-100 text-teal-700">
                        {tag}
                      </Badge>
                    ))}
                    <Button variant="outline" size="sm">
                      <Plus size={14} className="mr-1" />
                      Add Tag
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Date & Time */}
          <TabsContent value="datetime">
            <Card>
              <CardHeader>
                <CardTitle>Date & Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="date">
                    Event Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">
                      Start Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={formData.timezone} onValueChange={(v) => handleInputChange('timezone', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (GMT+7)</SelectItem>
                      <SelectItem value="Asia/Bangkok">Asia/Bangkok (GMT+7)</SelectItem>
                      <SelectItem value="Asia/Singapore">Asia/Singapore (GMT+8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="multiple-dates" />
                  <Label htmlFor="multiple-dates" className="text-sm">
                    Add multiple dates (recurring event)
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location */}
          <TabsContent value="location">
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Venue Type</Label>
                  <Select value={formData.venueType} onValueChange={(v) => handleInputChange('venueType', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Physical Venue</SelectItem>
                      <SelectItem value="online">Online Event</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.venueType === 'physical' || formData.venueType === 'hybrid') && (
                  <>
                    <div>
                      <Label htmlFor="venueName">Venue Name</Label>
                      <Input
                        id="venueName"
                        value={formData.venueName}
                        onChange={(e) => handleInputChange('venueName', e.target.value)}
                        placeholder="Enter venue name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Street address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Select value={formData.city} onValueChange={(v) => handleInputChange('city', v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ho Chi Minh City">Ho Chi Minh City</SelectItem>
                            <SelectItem value="Hanoi">Hanoi</SelectItem>
                            <SelectItem value="Da Nang">Da Nang</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="district">District</Label>
                        <Input
                          id="district"
                          value={formData.district}
                          onChange={(e) => handleInputChange('district', e.target.value)}
                          placeholder="District"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="mapsLink">Google Maps Link</Label>
                      <Input
                        id="mapsLink"
                        value={formData.mapsLink}
                        onChange={(e) => handleInputChange('mapsLink', e.target.value)}
                        placeholder="https://maps.google.com/..."
                      />
                    </div>
                  </>
                )}

                {(formData.venueType === 'online' || formData.venueType === 'hybrid') && (
                  <div>
                    <Label htmlFor="onlineLink">Online Meeting Link</Label>
                    <Input
                      id="onlineLink"
                      value={formData.onlineLink}
                      onChange={(e) => handleInputChange('onlineLink', e.target.value)}
                      placeholder="Zoom, Google Meet, or other link"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ticket Configuration</CardTitle>
                  <div className="text-sm text-neutral-600">
                    Total Capacity: <span className="text-teal-600">{totalCapacity}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticketTypes.map((ticket) => (
                  <Card key={ticket.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-3">
                          <Label>Name</Label>
                          <Input
                            value={ticket.name}
                            onChange={(e) => updateTicketType(ticket.id, 'name', e.target.value)}
                            placeholder="VIP, Standard..."
                          />
                        </div>
                        <div className="col-span-3">
                          <Label>Price (VND)</Label>
                          <Input
                            type="number"
                            value={ticket.price}
                            onChange={(e) => updateTicketType(ticket.id, 'price', Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={ticket.quantity}
                            onChange={(e) => updateTicketType(ticket.id, 'quantity', Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                        <div className="col-span-3">
                          <Label>Description</Label>
                          <Input
                            value={ticket.description}
                            onChange={(e) => updateTicketType(ticket.id, 'description', e.target.value)}
                            placeholder="Brief description"
                          />
                        </div>
                        <div className="col-span-1 flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTicketType(ticket.id)}
                            className="text-red-600 border-red-600"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button onClick={addTicketType} variant="outline" className="w-full border-dashed">
                  <Plus size={16} className="mr-2" />
                  Add Ticket Type
                </Button>

                <div className="flex items-center gap-2 pt-4">
                  <Checkbox id="seat-selection" />
                  <Label htmlFor="seat-selection" className="text-sm">
                    Enable seat selection
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media */}
          <TabsContent value="media">
            <Card>
              <CardHeader>
                <CardTitle>Images & Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Event Banner</Label>
                  <div className="mt-2 border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors cursor-pointer">
                    <Upload className="mx-auto text-neutral-400 mb-2" size={40} />
                    <p className="text-sm text-neutral-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      PNG, JPG up to 5MB (16:9 aspect ratio recommended)
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Event Gallery</Label>
                  <div className="mt-2 grid grid-cols-4 gap-4">
                    {/* Preview existing images */}
                    <div className="aspect-square bg-neutral-200 rounded-lg overflow-hidden">
                      <img src={event.image} alt="Gallery" className="w-full h-full object-cover" />
                    </div>
                    {/* Upload placeholder */}
                    <div className="aspect-square border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-teal-500">
                      <Plus className="text-neutral-400" size={24} />
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Maximum 10 images
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Additional Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="refundPolicy">Refund Policy</Label>
                  <Select value={formData.refundPolicy} onValueChange={(v) => handleInputChange('refundPolicy', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Refund</SelectItem>
                      <SelectItem value="partial">Partial Refund</SelectItem>
                      <SelectItem value="none">No Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ageRestriction">Age Restriction</Label>
                  <Select
                    value={formData.ageRestriction}
                    onValueChange={(v) => handleInputChange('ageRestriction', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ages</SelectItem>
                      <SelectItem value="18+">18+</SelectItem>
                      <SelectItem value="21+">21+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Accessibility Options</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Checkbox id="wheelchair" />
                      <Label htmlFor="wheelchair" className="text-sm">
                        Wheelchair accessible
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="parking" />
                      <Label htmlFor="parking" className="text-sm">
                        Parking available
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="transit" />
                      <Label htmlFor="transit" className="text-sm">
                        Public transit nearby
                      </Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={formData.terms}
                    onChange={(e) => handleInputChange('terms', e.target.value)}
                    placeholder="Enter terms and conditions..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="publish">Publish Immediately</Label>
                    <p className="text-xs text-neutral-500">Make event visible to public</p>
                  </div>
                  <Switch
                    id="publish"
                    checked={formData.publishImmediately}
                    onCheckedChange={(v) => handleInputChange('publishImmediately', v)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons (Sticky) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg py-4 z-10">
          <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              <ChevronLeft size={16} className="mr-2" />
              Cancel
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleSave(true)} disabled={isSaving}>
                Save as Draft
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate('event-detail', event.id)}
                disabled={isSaving}
              >
                <Eye size={16} className="mr-2" />
                Preview
              </Button>
              <Button
                className="bg-teal-500 hover:bg-teal-600"
                onClick={() => handleSave(false)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save & Publish
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Add spacing for sticky footer */}
        <div className="h-24" />
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave? All changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Continue Editing
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={() => onNavigate('event-management')}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
