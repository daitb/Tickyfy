import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Clock,
  Check,
  AlertTriangle,
  CreditCard,
  Gift,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { createRefundRequest } from '../../services/refundService';
import { toast } from 'sonner';

interface TicketRefundFormProps {
  ticketId: string;
  orderId: string;
  bookingId: number; // Backend booking ID
  ticketPrice: number;
  eventDate: string;
  eventTitle: string;
  onRefundSubmitted?: () => void;
}

/**
 * Component hiển thị form yêu cầu refund cho ticket
 * Tính toán refund amount theo policy dựa trên số ngày trước event
 */
export function TicketRefundForm({
  ticketId,
  orderId,
  bookingId,
  ticketPrice,
  eventDate,
  eventTitle,
  onRefundSubmitted,
}: TicketRefundFormProps) {
  const { t } = useTranslation('translation');
  const [refundReason, setRefundReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [daysUntilEvent, setDaysUntilEvent] = useState<number>(0);
  const [isEligible, setIsEligible] = useState(false);

  // Tính toán số ngày còn lại trước event
  useEffect(() => {
    if (eventDate) {
      try {
        // Parse event date - có thể là ISO string hoặc date string
        const eventDateTime = new Date(eventDate);
        const now = new Date();
        
        // Reset time về 00:00:00 để tính chính xác số ngày
        const eventDateOnly = new Date(eventDateTime.getFullYear(), eventDateTime.getMonth(), eventDateTime.getDate());
        const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const diffTime = eventDateOnly.getTime() - todayOnly.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        setDaysUntilEvent(diffDays);
        // Eligible nếu >= 3 ngày
        setIsEligible(diffDays >= 3);
      } catch (error) {
        console.error('Error parsing event date:', error);
        setDaysUntilEvent(0);
        setIsEligible(false);
      }
    }
  }, [eventDate]);

  // Tính toán refund amount theo policy
  const calculateRefundAmount = () => {
    if (daysUntilEvent < 3 || ticketPrice <= 0) {
      return 0; // Không được refund
    }

    let refundPercentage = 0;
    if (daysUntilEvent >= 7) {
      refundPercentage = 1.0; // 100% refund
    } else if (daysUntilEvent >= 3) {
      refundPercentage = 0.5; // 50% refund
    }

    // Tính service fee trên refundable amount (5% của số tiền gốc)
    const serviceFee = ticketPrice * 0.05;
    
    // Refundable amount = ticketPrice * refundPercentage
    const refundableAmount = ticketPrice * refundPercentage;
    
    // Final refund = refundableAmount - serviceFee
    const refundAmount = refundableAmount - serviceFee;

    return Math.max(0, Math.round(refundAmount)); // Đảm bảo không âm và làm tròn
  };

  const refundAmount = calculateRefundAmount();
  const serviceFee = ticketPrice * 0.05;
  const refundPercentage = daysUntilEvent >= 7 ? 100 : daysUntilEvent >= 3 ? 50 : 0;
  const refundableAmount = refundPercentage > 0 ? ticketPrice * (refundPercentage / 100) : 0;

  const handleSubmit = () => {
    if (!refundReason || !agreeToTerms) {
      toast.error(t('pages.ticketRefund.fillRequiredFields'));
      return;
    }

    if (!isEligible || refundAmount <= 0) {
      toast.error(t('pages.ticketRefund.notEligible'));
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmRefund = async () => {
    setIsSubmitting(true);

    try {
      await createRefundRequest({
        bookingId: bookingId,
        refundAmount: refundAmount,
        reason: refundReason + (additionalDetails ? `\n\n${additionalDetails}` : ''),
      });

      setShowConfirmation(false);
      setShowSuccess(true);
      toast.success(t('pages.ticketRefund.requestSubmitted'));
      
      if (onRefundSubmitted) {
        onRefundSubmitted();
      }
    } catch (error: any) {
      console.error('Error submitting refund request:', error);
      const errorMessage = error.response?.data?.message || error.message || t('pages.ticketRefund.submitError');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    if (!price || price <= 0) return '0 ₫';
    
    // Format số tiền theo chuẩn Việt Nam
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(price));
  };

  return (
    <>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={20} />
            {t('pages.ticketRefund.requestRefund')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Eligibility Status */}
          {!isEligible || daysUntilEvent < 3 ? (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="text-red-600" size={16} />
              <AlertDescription className="text-red-800">
                {daysUntilEvent < 0 
                  ? t('pages.ticketRefund.notEligibleMessage', { days: 0 })
                  : t('pages.ticketRefund.notEligibleMessage', { days: daysUntilEvent })
                }
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-green-50 border-green-200">
              <Check className="text-green-600" size={16} />
              <AlertDescription className="text-green-800">
                {t('pages.ticketRefund.eligibleMessage', { days: daysUntilEvent, percentage: refundPercentage })}
              </AlertDescription>
            </Alert>
          )}

          {/* Refund Calculation */}
          <div className="p-4 bg-neutral-50 rounded-lg space-y-3">
            <div className="text-sm font-medium text-neutral-900 mb-3">
              {t('pages.ticketRefund.refundCalculation')}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">{t('pages.ticketRefund.originalAmount')}:</span>
                <span className="text-neutral-900 font-medium">{formatPrice(ticketPrice)}</span>
              </div>
              
              {refundPercentage > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">{t('pages.ticketRefund.refundPercentage')}:</span>
                    <span className="text-neutral-900 font-medium">{refundPercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">{t('pages.ticketRefund.refundableAmount')}:</span>
                    <span className="text-neutral-900 font-medium">
                      {formatPrice(refundableAmount)}
                    </span>
                  </div>
                </>
              )}
              
              {refundPercentage > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">{t('pages.ticketRefund.serviceFee')} ({t('pages.ticketRefund.nonRefundable')}):</span>
                  <span className="text-red-600 font-medium">-{formatPrice(serviceFee)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-neutral-900 font-semibold">{t('pages.ticketRefund.estimatedRefund')}:</span>
                <span className={`text-2xl font-bold ${refundAmount > 0 ? 'text-green-600' : 'text-neutral-400'}`}>
                  {formatPrice(refundAmount)}
                </span>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200 mt-4">
              <Clock className="text-blue-600" size={14} />
              <AlertDescription className="text-blue-800 text-xs">
                {t('pages.ticketRefund.processingTime')}
              </AlertDescription>
            </Alert>
          </div>

          {/* Refund Policy Summary */}
          <div className="p-4 bg-neutral-50 rounded-lg space-y-2 text-sm">
            <div className="font-medium text-neutral-900 mb-2">
              {t('pages.ticketRefund.refundPolicy')}
            </div>
            <div className="flex gap-2">
              <Check size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-700">
                {t('pages.ticketRefund.fullRefund')}: 7+ {t('pages.ticketRefund.daysBeforeEvent')}
              </span>
            </div>
            <div className="flex gap-2">
              <Check size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-700">
                {t('pages.ticketRefund.halfRefund')}: 3-7 {t('pages.ticketRefund.daysBeforeEvent')}
              </span>
            </div>
            <div className="flex gap-2">
              <AlertCircle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-700">
                {t('pages.ticketRefund.noRefund')}: {'<'}3 {t('pages.ticketRefund.daysBeforeEvent')}
              </span>
            </div>
          </div>

          {/* Refund Reason */}
          <div className="space-y-2">
            <Label htmlFor="refundReason">
              {t('pages.ticketRefund.refundReason')} <span className="text-red-500">*</span>
            </Label>
            <Select value={refundReason} onValueChange={setRefundReason}>
              <SelectTrigger id="refundReason">
                <SelectValue placeholder={t('pages.ticketRefund.selectReason')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cancelled">{t('pages.ticketRefund.reasonCancelled')}</SelectItem>
                <SelectItem value="schedule">{t('pages.ticketRefund.reasonSchedule')}</SelectItem>
                <SelectItem value="personal">{t('pages.ticketRefund.reasonPersonal')}</SelectItem>
                <SelectItem value="medical">{t('pages.ticketRefund.reasonMedical')}</SelectItem>
                <SelectItem value="not-described">{t('pages.ticketRefund.reasonNotDescribed')}</SelectItem>
                <SelectItem value="venue">{t('pages.ticketRefund.reasonVenue')}</SelectItem>
                <SelectItem value="accidental">{t('pages.ticketRefund.reasonAccidental')}</SelectItem>
                <SelectItem value="other">{t('pages.ticketRefund.reasonOther')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label htmlFor="additionalDetails">
              {t('pages.ticketRefund.additionalDetails')} ({t('common.optional')})
            </Label>
            <Textarea
              id="additionalDetails"
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder={t('pages.ticketRefund.additionalDetailsPlaceholder')}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-neutral-500">
              {additionalDetails.length}/500 {t('common.characters')}
            </p>
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
            />
            <label htmlFor="terms" className="text-sm text-neutral-700 cursor-pointer">
              {t('pages.ticketRefund.agreeToTerms')}
              <Button variant="link" className="p-0 h-auto ml-1" onClick={() => onRefundSubmitted?.()}>
                {t('pages.ticketRefund.viewTerms')}
              </Button>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!isEligible || refundAmount <= 0 || !refundReason || !agreeToTerms}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="lg"
          >
            {t('pages.ticketRefund.submitRequest')}
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-yellow-600" size={32} />
              </div>
            </div>
            <DialogTitle className="text-center">
              {t('pages.ticketRefund.confirmTitle')}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t('pages.ticketRefund.confirmDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">{t('pages.ticketRefund.orderId')}:</span>
              <span className="text-neutral-900">#{orderId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">{t('pages.ticketRefund.event')}:</span>
              <span className="text-neutral-900">{eventTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">{t('pages.ticketRefund.refundAmount')}:</span>
              <span className="text-green-600 font-medium">{formatPrice(refundAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">{t('pages.ticketRefund.processingTime')}:</span>
              <span className="text-neutral-900">5-7 {t('pages.ticketRefund.businessDays')}</span>
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
                  {t('pages.ticketRefund.processing')}...
                </>
              ) : (
                t('pages.ticketRefund.confirmRefund')
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="w-full"
            >
              {t('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="text-green-600" size={40} />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              {t('pages.ticketRefund.successTitle')}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t('pages.ticketRefund.successDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="p-4 bg-neutral-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-600">{t('pages.ticketRefund.expectedRefund')}:</span>
                <span className="text-green-600 font-medium">{formatPrice(refundAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">{t('pages.ticketRefund.status')}:</span>
                <Badge className="bg-yellow-100 text-yellow-700">{t('pages.ticketRefund.underReview')}</Badge>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="text-blue-600" size={14} />
              <AlertDescription className="text-xs text-blue-800">
                {t('pages.ticketRefund.confirmationEmailSent')}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="flex-col gap-2">
            <Button
              onClick={() => {
                setShowSuccess(false);
                if (onRefundSubmitted) {
                  onRefundSubmitted();
                }
              }}
              className="w-full"
            >
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

