import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Wallet, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import {
  validateMomoPhone,
  validateCardNumber,
  validateCardExpiry,
  validateCVV,
  validateCardholderName,
  formatCardNumber,
  formatExpiryDate,
  formatPhoneNumber,
} from '../utils/validation';

interface PaymentMethodSelectorProps {
  onPaymentMethodChange: (method: PaymentMethod, details?: any) => void;
  selectedMethod?: PaymentMethod;
}

export type PaymentMethod = 'momo' | 'vnpay' | 'credit-card';

export function PaymentMethodSelector({ 
  onPaymentMethodChange, 
  selectedMethod 
}: PaymentMethodSelectorProps) {
  const [method, setMethod] = useState<PaymentMethod>(selectedMethod || 'momo');
  const [momoPhone, setMomoPhone] = useState('');
  const [vnpayPhone, setVnpayPhone] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [errors, setErrors] = useState<{
    momoPhone?: string;
    cardNumber?: string;
    cardName?: string;
    cardExpiry?: string;
    cardCvv?: string;
  }>({});
  const [touched, setTouched] = useState<{
    momoPhone: boolean;
    cardNumber: boolean;
    cardName: boolean;
    cardExpiry: boolean;
    cardCvv: boolean;
  }>({
    momoPhone: false,
    cardNumber: false,
    cardName: false,
    cardExpiry: false,
    cardCvv: false,
  });

  const handleMethodChange = (newMethod: PaymentMethod) => {
    setMethod(newMethod);
    setErrors({});
    setTouched({
      momoPhone: false,
      cardNumber: false,
      cardName: false,
      cardExpiry: false,
      cardCvv: false,
    });
    onPaymentMethodChange(newMethod);
  };

  const validateMomoPhoneField = (phone: string) => {
    if (!touched.momoPhone) return;
    const validation = validateMomoPhone(phone);
    if (!validation.isValid) {
      setErrors({ ...errors, momoPhone: validation.error });
    } else {
      const newErrors = { ...errors };
      delete newErrors.momoPhone;
      setErrors(newErrors);
    }
  };

  const validateCardField = (field: string, value: string) => {
    const fieldTouched = touched[field as keyof typeof touched];
    if (!fieldTouched) return;

    let validation: { isValid: boolean; error?: string } = { isValid: true };

    switch (field) {
      case 'cardNumber':
        validation = validateCardNumber(value);
        break;
      case 'cardName':
        validation = validateCardholderName(value);
        break;
      case 'cardExpiry':
        validation = validateCardExpiry(value);
        break;
      case 'cardCvv':
        validation = validateCVV(value);
        break;
    }

    if (!validation.isValid) {
      setErrors({ ...errors, [field]: validation.error });
    } else {
      const newErrors = { ...errors };
      delete newErrors[field as keyof typeof newErrors];
      setErrors(newErrors);
    }
  };

  const handleMomoPhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setMomoPhone(formatted);
    validateMomoPhoneField(formatted);
    onPaymentMethodChange('momo', { phone: formatted });
  };

  const handleMomoPhoneBlur = () => {
    setTouched({ ...touched, momoPhone: true });
    validateMomoPhoneField(momoPhone);
  };

  const handleCardChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'number') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiry') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'name') {
      formattedValue = value.toUpperCase();
    }

    const updated = { ...cardDetails, [field]: formattedValue };
    setCardDetails(updated);
    validateCardField(field === 'number' ? 'cardNumber' : field === 'name' ? 'cardName' : field === 'expiry' ? 'cardExpiry' : 'cardCvv', formattedValue);
    onPaymentMethodChange('credit-card', updated);
  };

  const handleCardBlur = (field: string) => {
    const touchedField = field === 'number' ? 'cardNumber' : field === 'name' ? 'cardName' : field === 'expiry' ? 'cardExpiry' : 'cardCvv';
    setTouched({ ...touched, [touchedField]: true });
    const value = cardDetails[field as keyof typeof cardDetails];
    validateCardField(touchedField, value);
  };

  // Validate all fields when method changes or component mounts
  useEffect(() => {
    if (method === 'momo' && momoPhone && touched.momoPhone) {
      validateMomoPhoneField(momoPhone);
    }
    if (method === 'credit-card') {
      if (cardDetails.number && touched.cardNumber) validateCardField('cardNumber', cardDetails.number);
      if (cardDetails.name && touched.cardName) validateCardField('cardName', cardDetails.name);
      if (cardDetails.expiry && touched.cardExpiry) validateCardField('cardExpiry', cardDetails.expiry);
      if (cardDetails.cvv && touched.cardCvv) validateCardField('cardCvv', cardDetails.cvv);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  const paymentMethods = [
    {
      id: 'momo' as PaymentMethod,
      name: 'MoMo E-Wallet',
      icon: Wallet,
      description: 'Pay securely with MoMo',
      color: 'bg-pink-500',
      popular: true
    },
    {
      id: 'vnpay' as PaymentMethod,
      name: 'VNPay',
      icon: Smartphone,
      description: 'Pay via VNPay gateway',
      color: 'bg-blue-500',
      popular: true
    },
    {
      id: 'credit-card' as PaymentMethod,
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, JCB accepted',
      color: 'bg-teal-500',
      popular: false
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-6">Select Payment Method</h3>
        
        <RadioGroup value={method} onValueChange={handleMethodChange as any}>
          <div className="space-y-3">
            {paymentMethods.map((pm) => {
              const Icon = pm.icon;
              const isSelected = method === pm.id;
              
              return (
                <label
                  key={pm.id}
                  className={`relative flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-neutral-200 hover:border-teal-300 hover:bg-neutral-50'
                  }`}
                >
                  <RadioGroupItem 
                    value={pm.id} 
                    id={pm.id}
                    className="mt-1"
                  />
                  
                  <div className={`${pm.color} p-3 rounded-lg text-white`}>
                    <Icon size={24} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-neutral-900">{pm.name}</span>
                      {pm.popular && (
                        <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600">{pm.description}</p>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-teal-500 rounded-full p-1">
                      <Check className="text-white" size={16} />
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      {/* Payment Details Forms */}
      <div className="pt-4">
        {method === 'momo' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
              <h4 className="mb-2 text-pink-900">How to pay with MoMo</h4>
              <ol className="text-sm text-pink-800 space-y-1.5 list-decimal list-inside">
                <li>Enter your MoMo phone number below</li>
                <li>Click "Complete Payment" to proceed</li>
                <li>You'll receive a notification on your MoMo app</li>
                <li>Open the app and confirm the payment</li>
              </ol>
            </div>
            
            <div>
              <Label htmlFor="momo-phone">Số điện thoại MoMo *</Label>
              <Input
                id="momo-phone"
                type="tel"
                placeholder="09xx xxx xxx"
                value={momoPhone}
                onChange={(e) => handleMomoPhoneChange(e.target.value)}
                onBlur={handleMomoPhoneBlur}
                className={`mt-2 ${
                  touched.momoPhone && errors.momoPhone
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : touched.momoPhone && !errors.momoPhone && momoPhone
                    ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                    : ""
                }`}
              />
              {touched.momoPhone && errors.momoPhone && (
                <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                  <AlertCircle size={14} />
                  <span>{errors.momoPhone}</span>
                </div>
              )}
              {touched.momoPhone && !errors.momoPhone && momoPhone && (
                <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                  <Check size={14} />
                  <span>Số điện thoại MoMo hợp lệ</span>
                </div>
              )}
              {!touched.momoPhone && (
                <p className="text-xs text-neutral-500 mt-2">
                  Nhập số điện thoại đã liên kết với tài khoản MoMo của bạn
                </p>
              )}
            </div>
          </div>
        )}

        {method === 'vnpay' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="mb-2 text-blue-900">How to pay with VNPay</h4>
              <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
                <li>Click "Complete Payment" to proceed</li>
                <li>You'll be redirected to VNPay payment gateway</li>
                <li>Select your bank and complete payment</li>
                <li>Return to Tickify to view your tickets</li>
              </ol>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <h5 className="text-sm mb-3 text-neutral-700">Supported Banks</h5>
              <div className="grid grid-cols-3 gap-3">
                {['Vietcombank', 'Techcombank', 'VietinBank', 'BIDV', 'ACB', 'MB Bank'].map((bank) => (
                  <div 
                    key={bank}
                    className="text-xs text-center p-2 bg-neutral-50 rounded border border-neutral-200"
                  >
                    {bank}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {method === 'credit-card' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
              <p className="text-sm text-teal-800">
                <strong>Secure payment:</strong> We accept Visa, Mastercard, and JCB. Your card details are encrypted and never stored.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="card-number">Số thẻ *</Label>
                <Input
                  id="card-number"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={(e) => handleCardChange('number', e.target.value)}
                  onBlur={() => handleCardBlur('number')}
                  maxLength={19}
                  className={`mt-2 ${
                    touched.cardNumber && errors.cardNumber
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : touched.cardNumber && !errors.cardNumber && cardDetails.number
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                      : ""
                  }`}
                />
                {touched.cardNumber && errors.cardNumber && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                    <AlertCircle size={14} />
                    <span>{errors.cardNumber}</span>
                  </div>
                )}
                {touched.cardNumber && !errors.cardNumber && cardDetails.number && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                    <Check size={14} />
                    <span>Số thẻ hợp lệ</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="card-name">Tên chủ thẻ *</Label>
                <Input
                  id="card-name"
                  type="text"
                  placeholder="NGUYEN VAN A"
                  value={cardDetails.name}
                  onChange={(e) => handleCardChange('name', e.target.value)}
                  onBlur={() => handleCardBlur('name')}
                  className={`mt-2 ${
                    touched.cardName && errors.cardName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : touched.cardName && !errors.cardName && cardDetails.name
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                      : ""
                  }`}
                />
                {touched.cardName && errors.cardName && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                    <AlertCircle size={14} />
                    <span>{errors.cardName}</span>
                  </div>
                )}
                {touched.cardName && !errors.cardName && cardDetails.name && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                    <Check size={14} />
                    <span>Tên chủ thẻ hợp lệ</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="card-expiry">Ngày hết hạn *</Label>
                  <Input
                    id="card-expiry"
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => handleCardChange('expiry', e.target.value)}
                    onBlur={() => handleCardBlur('expiry')}
                    maxLength={5}
                    className={`mt-2 ${
                      touched.cardExpiry && errors.cardExpiry
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : touched.cardExpiry && !errors.cardExpiry && cardDetails.expiry
                        ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                        : ""
                    }`}
                  />
                  {touched.cardExpiry && errors.cardExpiry && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                      <AlertCircle size={14} />
                      <span>{errors.cardExpiry}</span>
                    </div>
                  )}
                  {touched.cardExpiry && !errors.cardExpiry && cardDetails.expiry && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                      <Check size={14} />
                      <span>Hợp lệ</span>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="card-cvv">CVV *</Label>
                  <Input
                    id="card-cvv"
                    type="text"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => handleCardChange('cvv', e.target.value)}
                    onBlur={() => handleCardBlur('cvv')}
                    maxLength={4}
                    className={`mt-2 ${
                      touched.cardCvv && errors.cardCvv
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : touched.cardCvv && !errors.cardCvv && cardDetails.cvv
                        ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                        : ""
                    }`}
                  />
                  {touched.cardCvv && errors.cardCvv && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                      <AlertCircle size={14} />
                      <span>{errors.cardCvv}</span>
                    </div>
                  )}
                  {touched.cardCvv && !errors.cardCvv && cardDetails.cvv && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                      <Check size={14} />
                      <span>Hợp lệ</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {['Visa', 'Mastercard', 'JCB'].map((card) => (
                  <div 
                    key={card}
                    className="flex-1 text-xs text-center py-2 bg-neutral-100 rounded border border-neutral-200"
                  >
                    {card}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
