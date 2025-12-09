import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Check,
  AlertCircle,
  CreditCard,
  Gift,
  Building,
  Clock,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
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
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { mockEvents, mockOrders } from '../mockData';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface RefundRequestProps {
  orderId?: string;
  onNavigate: (page: string, orderId?: string) => void;
}

export function RefundRequest({ orderId, onNavigate }: RefundRequestProps) {
  const { t } = useTranslation();
  const [selectedOrderId, setSelectedOrderId] = useState(orderId || '');
  const [refundReason, setRefundReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [feedback, setFeedback] = useState('');
  const [refundMethod, setRefundMethod] = useState('original');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOrder = mockOrders.find((o) => o.id === selectedOrderId);
  const event = selectedOrder ? mockEvents.find((e) => e.id === selectedOrder.eventId) : null;

  // Calculate refund amount
  const originalAmount = selectedOrder?.total || 0;
  const serviceFee = originalAmount * 0.05;
  const cancellationFee = 0; // Would be calculated based on timing
  const refundAmount = originalAmount - serviceFee - cancellationFee;

  const daysUntilEvent = 5; // Mock calculation
  const isEligible = daysUntilEvent >= 3;

  const handleSubmit = async () => {
    if (!selectedOrderId || !refundReason || !agreeToTerms) {
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmRefund = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setShowConfirmation(false);
    setShowSuccess(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
          <button onClick={() => onNavigate('user-profile')} className="hover:text-neutral-900">
            Dashboard
          </button>
          <span>/</span>
          <button onClick={() => onNavigate('my-tickets')} className="hover:text-neutral-900">
            Orders
          </button>
          <span>/</span>
          <span className="text-neutral-900">Refund Request</span>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="mb-2">Request Refund</h1>
          <p className="text-neutral-600">We're sorry to see you go. Please tell us why.</p>
          <Button variant="link" className="p-0 h-auto text-purple-600 mt-1">
            View Refund Policy →
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Eligibility Check */}
            {!selectedOrderId && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="text-blue-600" size={16} />
                <AlertDescription className="text-blue-800">
                  Check if your order is eligible for refund
                </AlertDescription>
              </Alert>
            )}

            {/* Order Selection */}
            {!orderId && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <RadioGroup value={selectedOrderId} onValueChange={setSelectedOrderId}>
                    {mockOrders.map((order) => {
                      const orderEvent = mockEvents.find((e) => e.id === order.eventId);
                      return (
                        <div key={order.id} className="flex items-start gap-3 p-4 border rounded-lg">
                          <RadioGroupItem value={order.id} id={order.id} />
                          <label htmlFor={order.id} className="flex-1 cursor-pointer">
                            <div className="flex gap-3">
                              <div className="w-20 h-20 rounded bg-neutral-100 overflow-hidden flex-shrink-0">
                                <ImageWithFallback
                                  src={orderEvent?.image || ''}
                                  alt={orderEvent?.title || ''}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm text-neutral-500 mb-1">#{order.id}</div>
                                <div className="text-neutral-900 mb-1">{orderEvent?.title}</div>
                                <div className="text-sm text-neutral-600">{orderEvent?.date}</div>
                                <div className="text-sm text-neutral-600">
                                  {order.tickets.length} tickets • ${order.total.toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <Badge className="bg-green-100 text-green-700">
                                  Full Refund Eligible
                                </Badge>
                                <div className="text-xs text-neutral-500 mt-1">
                                  {daysUntilEvent} days remaining
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Refund Details */}
            {selectedOrder && event && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Refund Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Order Summary */}
                    <div className="p-4 bg-neutral-50 rounded-lg">
                      <div className="flex gap-3 mb-3">
                        <div className="w-16 h-16 rounded bg-neutral-100 overflow-hidden flex-shrink-0">
                          <ImageWithFallback
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-sm text-neutral-500">Order #{selectedOrder.id}</div>
                          <div className="text-neutral-900">{event.title}</div>
                          <div className="text-sm text-neutral-600">{event.date}</div>
                        </div>
                      </div>
                    </div>

                    {/* Refund Calculation */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Original amount:</span>
                        <span className="text-neutral-900">${originalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Service fee (non-refundable):</span>
                        <span className="text-red-600">-${serviceFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Cancellation fee:</span>
                        <span className="text-neutral-900">-${cancellationFee.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-neutral-900">Estimated refund:</span>
                        <span className="text-2xl text-green-600">${refundAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <Alert className="bg-blue-50 border-blue-200">
                      <Clock className="text-blue-600" size={16} />
                      <AlertDescription className="text-blue-800 text-sm">
                        Processing time: 5-7 business days • Refund will be issued to original payment method
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                {/* Refund Reason */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Why are you requesting a refund? <span className="text-red-500">*</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select value={refundReason} onValueChange={setRefundReason}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cancelled">Event cancelled by organizer</SelectItem>
                        <SelectItem value="schedule">Cannot attend - schedule conflict</SelectItem>
                        <SelectItem value="personal">Cannot attend - personal reasons</SelectItem>
                        <SelectItem value="medical">Cannot attend - medical reasons</SelectItem>
                        <SelectItem value="not-described">Event not as described</SelectItem>
                        <SelectItem value="venue">Venue issues</SelectItem>
                        <SelectItem value="accidental">Accidental purchase</SelectItem>
                        <SelectItem value="alternative">Found better alternative</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>

                    <div>
                      <Label htmlFor="details">Additional information (Optional)</Label>
                      <Textarea
                        id="details"
                        value={additionalDetails}
                        onChange={(e) => setAdditionalDetails(e.target.value)}
                        placeholder="Please provide any additional details..."
                        rows={4}
                        maxLength={500}
                        className="mt-2"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        {additionalDetails.length}/500 characters
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="feedback">What could we have done better? (Optional)</Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Your feedback helps us improve"
                        rows={3}
                        maxLength={300}
                        className="mt-2"
                      />
                      <p className="text-xs text-neutral-500 mt-1">{feedback.length}/300 characters</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Refund Method */}
                <Card>
                  <CardHeader>
                    <CardTitle>Refund Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={refundMethod} onValueChange={setRefundMethod}>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-4 border rounded-lg">
                          <RadioGroupItem value="original" id="original" className="mt-1" />
                          <label htmlFor="original" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <CreditCard size={18} className="text-neutral-600" />
                              <span className="text-neutral-900">Original payment method (Recommended)</span>
                            </div>
                            <div className="text-sm text-neutral-600 ml-6">
                              Visa ending in 4242 • Faster processing (5-7 days)
                            </div>
                          </label>
                        </div>

                        <div className="flex items-start gap-3 p-4 border rounded-lg bg-purple-50 border-purple-200">
                          <RadioGroupItem value="credit" id="credit" className="mt-1" />
                          <label htmlFor="credit" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <Gift size={18} className="text-purple-600" />
                              <span className="text-neutral-900">Store credit</span>
                              <Badge className="bg-purple-600 text-white">+10% bonus</Badge>
                            </div>
                            <div className="text-sm text-neutral-600 ml-6">
                              Receive 110% as Tickify credit • Instant credit to your account
                            </div>
                          </label>
                        </div>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Terms */}
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm text-neutral-700 cursor-pointer">
                    I understand and agree to the refund policy and terms
                    <Button variant="link" className="p-0 h-auto ml-1">
                      View terms
                    </Button>
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!refundReason || !agreeToTerms}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                >
                  Request Refund
                </Button>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Refund Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Refund Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <Check size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-700">Full refund: 7+ days before event</span>
                </div>
                <div className="flex gap-2">
                  <Check size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-700">50% refund: 3-7 days before event</span>
                </div>
                <div className="flex gap-2">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-700">No refund: {'<'}3 days before event</span>
                </div>
                <Separator />
                <p className="text-xs text-neutral-500">Service fees are non-refundable</p>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <AlertCircle size={16} className="mr-2" />
                  Contact Support
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Live Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-yellow-600" size={32} />
              </div>
            </div>
            <DialogTitle className="text-center">Confirm Refund Request</DialogTitle>
            <DialogDescription className="text-center">
              This action cannot be undone. Your tickets will be cancelled immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Order ID:</span>
              <span className="text-neutral-900">#{selectedOrder?.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Event:</span>
              <span className="text-neutral-900">{event?.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Refund amount:</span>
              <span className="text-green-600">${refundAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Processing time:</span>
              <span className="text-neutral-900">5-7 business days</span>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2">
            <Button
              onClick={handleConfirmRefund}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                'Confirm Refund'
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowConfirmation(false)} className="w-full">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="text-green-600" size={40} />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Refund Request Submitted</DialogTitle>
            <DialogDescription className="text-center">
              Your refund request has been received and is being processed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="p-4 bg-neutral-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-600">Request ID:</span>
                <span className="text-neutral-900">#REF-78945</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Expected refund:</span>
                <span className="text-green-600">${refundAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Status:</span>
                <Badge className="bg-yellow-100 text-yellow-700">Under review</Badge>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-neutral-900 mb-3">What happens next?</div>
              <div className="space-y-2 text-xs text-neutral-600">
                <div className="flex gap-2">
                  <Check size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Request review (24-48 hours)</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-300 flex-shrink-0 mt-0.5" />
                  <span>Approval notification</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-300 flex-shrink-0 mt-0.5" />
                  <span>Refund processed</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-300 flex-shrink-0 mt-0.5" />
                  <span>Funds returned (5-7 days)</span>
                </div>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="text-blue-600" size={14} />
              <AlertDescription className="text-xs text-blue-800">
                A confirmation email has been sent to your email
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="flex-col gap-2">
            <Button onClick={() => onNavigate('my-tickets')} className="w-full">
              Back to Orders
            </Button>
            <Button variant="outline" className="w-full">
              <Download size={16} className="mr-2" />
              Download Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
