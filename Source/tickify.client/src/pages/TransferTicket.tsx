import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Send, User, Mail, AlertTriangle, CheckCircle, Ticket as TicketIcon, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { mockOrders, mockEvents } from '../mockData';
import type { Order, OrderTicket } from '../types';

interface TransferTicketProps {
  ticketId?: string;
  orders?: Order[];
  onNavigate: (page: string, id?: string) => void;
}

interface TransferFormData {
  recipientEmail: string;
  recipientName: string;
  message: string;
  includeSeatInfo: boolean;
  termsAccepted: boolean;
}

const STEPS = [
  { number: 1, label: 'Select Ticket' },
  { number: 2, label: 'Enter Details' },
  { number: 3, label: 'Confirm' },
  { number: 4, label: 'Complete' }
];

export function TransferTicket({ ticketId, orders, onNavigate }: TransferTicketProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<OrderTicket & { eventTitle: string; eventDate: string; eventVenue: string } | null>(null);
  const [formData, setFormData] = useState<TransferFormData>({
    recipientEmail: '',
    recipientName: '',
    message: '',
    includeSeatInfo: true,
    termsAccepted: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [transferCode, setTransferCode] = useState<string>('');

  // Get all transferable tickets from user's orders
  const transferableTickets: Array<OrderTicket & { eventTitle: string; eventDate: string; eventVenue: string }> = [];
  
  (orders || mockOrders).forEach(order => {
    const event = mockEvents.find(e => e.id === order.eventId);
    if (event) {
      order.tickets.forEach(ticket => {
        transferableTickets.push({
          ...ticket,
          eventTitle: event.title,
          eventDate: event.date,
          eventVenue: event.venue
        });
      });
    }
  });

  // Pre-select ticket if ticketId is provided
  useState(() => {
    if (ticketId) {
      const ticket = transferableTickets.find(t => t.id === ticketId);
      if (ticket) {
        setSelectedTicket(ticket);
        setCurrentStep(2);
      }
    }
  });

  const currentUserEmail = 'user@example.com'; // Would come from auth store

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleTicketSelect = (ticket: typeof transferableTickets[0]) => {
    setSelectedTicket(ticket);
  };

  const handleFormChange = (field: keyof TransferFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipientEmail.trim()) {
      newErrors.recipientEmail = 'Recipient email is required';
    } else if (!validateEmail(formData.recipientEmail)) {
      newErrors.recipientEmail = 'Please enter a valid email address';
    } else if (formData.recipientEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
      newErrors.recipientEmail = 'You cannot transfer a ticket to yourself';
    }

    if (formData.message.length > 200) {
      newErrors.message = 'Message cannot exceed 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedTicket) {
        alert('Please select a ticket to transfer');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      if (!formData.termsAccepted) {
        setErrors({ terms: 'Please accept the terms to continue' });
        return;
      }
      // Simulate API call
      const code = `TRF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setTransferCode(code);
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep < 4) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this transfer?')) {
      onNavigate('my-tickets');
    }
  };

  const handleTransferAnother = () => {
    setCurrentStep(1);
    setSelectedTicket(null);
    setFormData({
      recipientEmail: '',
      recipientName: '',
      message: '',
      includeSeatInfo: true,
      termsAccepted: false
    });
    setErrors({});
    setTransferCode('');
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate('my-tickets')}
            className="mb-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to My Tickets
          </Button>
          <h1 className="mb-2">Transfer Ticket</h1>
          <p className="text-neutral-600">
            Transfer your ticket to another person
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      currentStep >= step.number
                        ? 'bg-teal-500 text-white'
                        : 'bg-neutral-200 text-neutral-500'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle size={20} />
                    ) : (
                      <span>{step.number}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 hidden sm:block ${
                      currentStep >= step.number
                        ? 'text-teal-600'
                        : 'text-neutral-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 -mx-2 ${
                      currentStep > step.number
                        ? 'bg-teal-500'
                        : 'bg-neutral-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {/* Step 1: Select Ticket */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4">Select a Ticket to Transfer</h3>
                  <p className="text-sm text-neutral-600 mb-6">
                    Choose from your available tickets below
                  </p>
                </div>

                {transferableTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <TicketIcon className="mx-auto text-neutral-400 mb-4" size={48} />
                    <h3 className="text-neutral-900 mb-2">No Transferable Tickets</h3>
                    <p className="text-neutral-600">
                      You don't have any tickets available for transfer
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {transferableTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => handleTicketSelect(ticket)}
                        className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                          selectedTicket?.id === ticket.id
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-neutral-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <TicketIcon className="text-neutral-600" size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-neutral-900 mb-1 truncate">
                              {ticket.eventTitle}
                            </div>
                            <div className="text-sm text-neutral-600">
                              {new Date(ticket.eventDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-teal-100 text-teal-700 text-xs">
                                {ticket.tierName}
                              </Badge>
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                Valid
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Transfer Details */}
            {currentStep === 2 && selectedTicket && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2">Transfer Details</h3>
                  <p className="text-sm text-neutral-600">
                    Enter the recipient's information
                  </p>
                </div>

                {/* Selected Ticket Preview */}
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <TicketIcon className="text-teal-600" size={20} />
                    <div>
                      <div className="text-sm text-neutral-900">{selectedTicket.eventTitle}</div>
                      <div className="text-xs text-neutral-600">
                        {selectedTicket.tierName} • {new Date(selectedTicket.eventDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning Alert */}
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    You will no longer have access to this ticket after the transfer is completed
                  </AlertDescription>
                </Alert>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipientEmail">
                      Recipient Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                      <Input
                        id="recipientEmail"
                        type="email"
                        placeholder="recipient@example.com"
                        value={formData.recipientEmail}
                        onChange={(e) => handleFormChange('recipientEmail', e.target.value)}
                        className={`pl-10 ${errors.recipientEmail ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.recipientEmail && (
                      <p className="text-sm text-red-500 mt-1">{errors.recipientEmail}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                      <Input
                        id="recipientName"
                        type="text"
                        placeholder="John Doe"
                        value={formData.recipientName}
                        onChange={(e) => handleFormChange('recipientName', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">
                      Transfer Message (Optional)
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Add a personal message for the recipient..."
                      value={formData.message}
                      onChange={(e) => handleFormChange('message', e.target.value)}
                      className="mt-1 min-h-[100px]"
                      maxLength={200}
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-neutral-500">
                        {formData.message.length}/200 characters
                      </p>
                      {errors.message && (
                        <p className="text-xs text-red-500">{errors.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includeSeatInfo"
                      checked={formData.includeSeatInfo}
                      onCheckedChange={(checked) => 
                        handleFormChange('includeSeatInfo', checked)
                      }
                    />
                    <Label 
                      htmlFor="includeSeatInfo"
                      className="text-sm cursor-pointer"
                    >
                      Include seat information in transfer
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && selectedTicket && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2">Confirm Transfer</h3>
                  <p className="text-sm text-neutral-600">
                    Please review the transfer details before confirming
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ticket Info */}
                  <div>
                    <h4 className="text-sm text-neutral-600 mb-3">Ticket Details</h4>
                    <Card className="border-teal-200 bg-teal-50">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-neutral-600">Event</div>
                            <div className="text-sm text-neutral-900">{selectedTicket.eventTitle}</div>
                          </div>
                          <div>
                            <div className="text-xs text-neutral-600">Date</div>
                            <div className="text-sm text-neutral-900">
                              {new Date(selectedTicket.eventDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-neutral-600">Tier</div>
                            <div className="text-sm text-neutral-900">{selectedTicket.tierName}</div>
                          </div>
                          <div>
                            <div className="text-xs text-neutral-600">Venue</div>
                            <div className="text-sm text-neutral-900">{selectedTicket.eventVenue}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Transfer Info */}
                  <div>
                    <h4 className="text-sm text-neutral-600 mb-3">Transfer Information</h4>
                    <div className="space-y-4">
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="text-xs text-neutral-600 mb-1">From</div>
                        <div className="text-sm text-neutral-900">Current User</div>
                        <div className="text-xs text-neutral-600">{currentUserEmail}</div>
                      </div>

                      <div className="flex justify-center">
                        <ArrowRight className="text-neutral-400" size={20} />
                      </div>

                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="text-xs text-neutral-600 mb-1">To</div>
                        <div className="text-sm text-neutral-900">
                          {formData.recipientName || 'Recipient'}
                        </div>
                        <div className="text-xs text-neutral-600">{formData.recipientEmail}</div>
                      </div>

                      {formData.message && (
                        <div className="bg-neutral-50 rounded-lg p-4">
                          <div className="text-xs text-neutral-600 mb-1">Message</div>
                          <div className="text-sm text-neutral-900 italic">"{formData.message}"</div>
                        </div>
                      )}

                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-900">Transfer Fee</span>
                          <span className="text-green-600">Free</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="border-t pt-4">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="termsAccepted"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => 
                        handleFormChange('termsAccepted', checked)
                      }
                    />
                    <Label 
                      htmlFor="termsAccepted"
                      className="text-sm cursor-pointer"
                    >
                      I confirm that the transfer details are correct and I understand that this action cannot be undone
                    </Label>
                  </div>
                  {errors.terms && (
                    <p className="text-sm text-red-500 mt-2">{errors.terms}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {currentStep === 4 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-500" size={32} />
                </div>
                <h3 className="text-neutral-900 mb-2">Transfer Initiated!</h3>
                <p className="text-neutral-600 mb-6">
                  The recipient will receive an email with an acceptance link
                </p>

                <div className="bg-neutral-50 rounded-xl p-6 mb-6 max-w-md mx-auto">
                  <div className="text-sm text-neutral-600 mb-2">Transfer Code</div>
                  <div className="text-2xl text-teal-600 font-mono tracking-wider mb-4">
                    {transferCode}
                  </div>
                  <p className="text-xs text-neutral-500">
                    Save this code for your records. The recipient will need to accept the transfer within 48 hours.
                  </p>
                </div>

                <div className="space-y-3 max-w-md mx-auto">
                  <Button
                    onClick={() => onNavigate('my-tickets')}
                    className="w-full bg-teal-500 hover:bg-teal-600"
                  >
                    Back to My Tickets
                  </Button>
                  <Button
                    onClick={handleTransferAnother}
                    variant="outline"
                    className="w-full"
                  >
                    Transfer Another Ticket
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex gap-3 mt-6">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft size={16} className="mr-2" />
                Previous
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <X size={16} className="mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 bg-teal-500 hover:bg-teal-600"
              disabled={currentStep === 1 && !selectedTicket}
            >
              {currentStep === 3 ? (
                <>
                  <Send size={16} className="mr-2" />
                  Confirm & Send
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}