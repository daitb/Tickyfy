import { useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ProgressSteps } from '../components/ProgressSteps';
import { FeeBreakdown } from '../components/FeeBreakdown';
import { Separator } from '../components/ui/separator';
import { CartItem, Order } from '../types';

interface CheckoutProps {
  items: CartItem[];
  onNavigate: (page: string) => void;
  onCompleteOrder: (order: Order) => void;
}

export function Checkout({ items, onNavigate, onCompleteOrder }: CheckoutProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const steps = [
    { number: 1, label: 'Information' },
    { number: 2, label: 'Payment' },
    { number: 3, label: 'Review' }
  ];

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceFee = subtotal * 0.05;
  const total = subtotal + serviceFee;

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Create mock order
    const order: Order = {
      id: `ord-${Date.now()}`,
      userId: 'user-1',
      eventId: items[0].eventId,
      tickets: items.map((item, index) => ({
        id: `tkt-${Date.now()}-${index}`,
        tierId: item.tierId,
        tierName: item.tierName,
        price: item.price,
        qrCode: `QR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: 'valid'
      })),
      subtotal,
      serviceFee,
      total,
      status: 'completed',
      createdAt: new Date().toISOString(),
      userEmail: formData.email,
      userName: formData.name
    };

    onCompleteOrder(order);
    onNavigate('success');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const isStepValid = () => {
    if (currentStep === 1) {
      return formData.email && formData.name && formData.phone;
    }
    if (currentStep === 2) {
      return formData.cardNumber && formData.expiry && formData.cvv;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="mb-4">Checkout</h1>
        
        <ProgressSteps steps={steps} currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-8">
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-6">Contact Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                          Tickets will be sent to this email
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Nguyen Van A"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+84 xxx xxx xxx"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Payment */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <CreditCard className="text-orange-500" size={24} />
                      <h3>Payment Details</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cardNumber">Card Number *</Label>
                        <Input
                          id="cardNumber"
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={formData.cardNumber}
                          onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiry">Expiry Date *</Label>
                          <Input
                            id="expiry"
                            type="text"
                            placeholder="MM/YY"
                            value={formData.expiry}
                            onChange={(e) => handleInputChange('expiry', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="cvv">CVV *</Label>
                          <Input
                            id="cvv"
                            type="text"
                            placeholder="123"
                            value={formData.cvv}
                            onChange={(e) => handleInputChange('cvv', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                      <div className="flex items-start gap-3">
                        <Lock className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
                        <div className="text-sm text-blue-700">
                          <p className="mb-1">Your payment is secure</p>
                          <p className="text-xs">
                            All transactions are encrypted and processed securely through our payment partners.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-6">Review Your Order</h3>

                    <div className="space-y-4">
                      {/* Contact Info */}
                      <div className="bg-neutral-50 rounded-xl p-4">
                        <h4 className="mb-2">Contact Information</h4>
                        <div className="text-sm text-neutral-600 space-y-1">
                          <p>{formData.name}</p>
                          <p>{formData.email}</p>
                          <p>{formData.phone}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="bg-neutral-50 rounded-xl p-4">
                        <h4 className="mb-3">Tickets</h4>
                        <div className="space-y-3">
                          {items.map((item, index) => (
                            <div key={index}>
                              <div className="text-sm">
                                <div className="text-neutral-900">{item.eventTitle}</div>
                                <div className="text-neutral-600 mt-1">
                                  {item.tierName} × {item.quantity}
                                </div>
                              </div>
                              {index < items.length - 1 && (
                                <Separator className="mt-3" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="bg-neutral-50 rounded-xl p-4">
                        <h4 className="mb-2">Payment Method</h4>
                        <div className="text-sm text-neutral-600">
                          Card ending in {formData.cardNumber.slice(-4)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
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
                {currentStep < 3 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    <Lock size={16} className="mr-2" />
                    Complete Purchase
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <FeeBreakdown
                subtotal={subtotal}
                serviceFee={serviceFee}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
