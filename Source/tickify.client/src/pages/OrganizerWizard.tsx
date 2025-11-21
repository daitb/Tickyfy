import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { ProgressSteps } from '../components/ProgressSteps';
import { cities } from '../mockData';
import { eventService, type CreateEventDto } from '../services/eventService';
import { categoryService, type CategoryDto } from '../services/categoryService';
import { authService } from '../services/authService';
import type { Category, Event, TicketTier } from "../types";

interface OrganizerWizardProps {
  onNavigate: (page: string) => void;
}

export function OrganizerWizard({ onNavigate }: OrganizerWizardProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [eventData, setEventData] = useState<Partial<Event>>({
    category: 'Music',
    city: cities[0],
    ticketTiers: [],
    policies: {
      refundable: true,
      transferable: true
    }
  });

  const [ticketTiers, setTicketTiers] = useState<Partial<TicketTier>[]>([
    { name: '', price: 0, total: 100, description: '' }
  ]);

  // Get current user
  const user = authService.getCurrentUser();
  const organizerId = user?.organizerId || 1;

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await categoryService.getCategories();
        setCategories(cats);
        // Set first category as default if available
        if (cats.length > 0 && !eventData.category) {
          setEventData(prev => ({ ...prev, category: cats[0].categoryName as any }));
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  const steps = [
    { number: 1, label: 'Basics' },
    { number: 2, label: 'Schedule & Venue' },
    { number: 3, label: 'Ticketing' },
    { number: 4, label: 'Policies' },
    { number: 5, label: 'Review' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setEventData({ ...eventData, [field]: value });
  };

  const handleAddTier = () => {
    setTicketTiers([...ticketTiers, { name: '', price: 0, total: 100, description: '' }]);
  };

  const handleRemoveTier = (index: number) => {
    setTicketTiers(ticketTiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: string, value: any) => {
    const newTiers = [...ticketTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTicketTiers(newTiers);
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);

      // Validate required fields
      if (!eventData.title || !eventData.description || !eventData.venue || !eventData.date || !eventData.time) {
        alert('Please fill in all required fields');
        return;
      }

      // Combine date and time
      const eventDate = eventData.date || '';
      const eventTime = eventData.time || '00:00';
      const startDateTime = `${eventDate}T${eventTime}:00`;
      const endDateTime = `${eventDate}T23:59:00`; // Default end time

      // Map category name to categoryId
      const selectedCategory = categories.find(c => c.categoryName === eventData.category);
      const categoryId = selectedCategory?.categoryId || 1; // Fallback to 1 if not found

      // Prepare event data
      const createEventDto: CreateEventDto = {
        organizerId: organizerId,
        categoryId: categoryId,
        title: eventData.title,
        description: eventData.description,
        venue: eventData.venue,
        imageUrl: eventData.image,
        startDate: startDateTime,
        endDate: endDateTime,
        totalSeats: ticketTiers.reduce((sum, tier) => sum + (tier.total || 0), 0),
        isFeatured: false,
        ticketTypes: ticketTiers.map(tier => ({
          typeName: tier.name || 'General',
          price: tier.price || 0,
          quantity: tier.total || 0,
          description: tier.description
        }))
      };

      // POST /api/events - Create event
      const createdEvent = await eventService.createEvent(createEventDto);

      alert(`Event "${createdEvent.title}" created successfully! It will be reviewed by admin.`);
      onNavigate('organizer-dashboard');
    } catch (error: any) {
      console.error('Error creating event:', error);
      alert(error.response?.data?.message || error.message || 'Failed to create event. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => onNavigate('home')}
            className="mb-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <h1>Create New Event</h1>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <div className="bg-white rounded-2xl p-8 mt-8">
          {/* Step 1: Basics */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="mb-6">Event Basics</h3>

              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Summer Music Festival 2025"
                  value={eventData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  placeholder="summer-music-festival-2025"
                  value={eventData.slug || ''}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  tickify.vn/events/{eventData.slug || 'your-event'}
                </p>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={eventData.category}
                  onValueChange={(value) => handleInputChange('category', value as Category)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.categoryId} value={cat.categoryName}>
                        {cat.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event..."
                  value={eventData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="mt-1 min-h-[120px]"
                />
              </div>

              <div>
                <Label>Event Image</Label>
                <div className="mt-1 border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-orange-500 transition-colors cursor-pointer">
                  <Upload className="mx-auto text-neutral-400 mb-2" size={32} />
                  <p className="text-sm text-neutral-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Schedule & Venue */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="mb-6">Schedule & Venue</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Event Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={eventData.date || ''}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="time">Start Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={eventData.time || ''}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="venue">Venue Name *</Label>
                <Input
                  id="venue"
                  placeholder="e.g., Phu Tho Stadium"
                  value={eventData.venue || ''}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="city">City *</Label>
                <Select
                  value={eventData.city}
                  onValueChange={(value) => handleInputChange('city', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Ticketing */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3>Ticket Tiers</h3>
                <Button
                  onClick={handleAddTier}
                  variant="outline"
                  size="sm"
                >
                  <Plus size={16} className="mr-2" />
                  Add Tier
                </Button>
              </div>

              <div className="space-y-4">
                {ticketTiers.map((tier, index) => (
                  <div key={index} className="border border-neutral-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-4">
                      <h4>Tier {index + 1}</h4>
                      {ticketTiers.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTier(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Tier Name *</Label>
                        <Input
                          placeholder="e.g., General Admission"
                          value={tier.name || ''}
                          onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Price (VND) *</Label>
                        <Input
                          type="number"
                          placeholder="500000"
                          value={tier.price || ''}
                          onChange={(e) => handleTierChange(index, 'price', parseInt(e.target.value))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Total Tickets *</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={tier.total || ''}
                          onChange={(e) => handleTierChange(index, 'total', parseInt(e.target.value))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Input
                          placeholder="Brief description"
                          value={tier.description || ''}
                          onChange={(e) => handleTierChange(index, 'description', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Policies */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="mb-6">Ticket Policies</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl">
                  <div>
                    <div className="text-neutral-900">Refundable Tickets</div>
                    <div className="text-sm text-neutral-500">
                      Allow customers to request refunds
                    </div>
                  </div>
                  <Switch
                    checked={eventData.policies?.refundable || false}
                    onCheckedChange={(checked) => 
                      handleInputChange('policies', { ...eventData.policies, refundable: checked })
                    }
                  />
                </div>

                {eventData.policies?.refundable && (
                  <div className="ml-4">
                    <Label>Refund Deadline</Label>
                    <Input
                      type="date"
                      value={eventData.policies?.refundDeadline || ''}
                      onChange={(e) => 
                        handleInputChange('policies', { 
                          ...eventData.policies, 
                          refundDeadline: e.target.value 
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl">
                  <div>
                    <div className="text-neutral-900">Transferable Tickets</div>
                    <div className="text-sm text-neutral-500">
                      Allow customers to transfer tickets to others
                    </div>
                  </div>
                  <Switch
                    checked={eventData.policies?.transferable || false}
                    onCheckedChange={(checked) => 
                      handleInputChange('policies', { ...eventData.policies, transferable: checked })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="mb-6">Review & Publish</h3>

              <div className="space-y-4">
                <div className="bg-neutral-50 rounded-xl p-4">
                  <h4 className="mb-3">Event Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Title:</dt>
                      <dd className="text-neutral-900">{eventData.title}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Category:</dt>
                      <dd className="text-neutral-900">{eventData.category}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Date:</dt>
                      <dd className="text-neutral-900">{eventData.date} at {eventData.time}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Venue:</dt>
                      <dd className="text-neutral-900">{eventData.venue}, {eventData.city}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-neutral-50 rounded-xl p-4">
                  <h4 className="mb-3">Ticket Tiers ({ticketTiers.length})</h4>
                  <div className="space-y-2">
                    {ticketTiers.map((tier, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span className="text-neutral-900">{tier.name}</span>
                        <span className="text-neutral-600">
                          {(tier.price || 0).toLocaleString()} VND × {tier.total}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-xl p-4">
                  <h4 className="mb-3">Policies</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${eventData.policies?.refundable ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-neutral-900">
                        {eventData.policies?.refundable ? 'Refundable' : 'Non-refundable'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${eventData.policies?.transferable ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-neutral-900">
                        {eventData.policies?.transferable ? 'Transferable' : 'Non-transferable'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Back
              </Button>
            )}
            {currentStep < 5 ? (
              <Button
                onClick={handleNext}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Publishing...
                  </>
                ) : (
                  'Publish Event'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
