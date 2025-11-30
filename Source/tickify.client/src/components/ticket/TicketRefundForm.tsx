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
  const { t } = useTranslation();
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
      const eventDateTime = new Date(eventDate);
      const now = new Date();
      const diffTime = eventDateTime.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysUntilEvent(diffDays);

      // Eligible nếu >= 3 ngày
      setIsEligible(diffDays >= 3);
    }
  }, [eventDate]);

  // Tính toán refund amount theo policy
  const calculateRefundAmount = () => {
    if (daysUntilEvent < 3) {
      return 0; // Không được refund
    }

    const serviceFee = ticketPrice * 0.05; // 5% service fee không hoàn lại
    let refundPercentage = 0;

    if (daysUntilEvent >= 7) {
      refundPercentage = 1.0; // 100% refund
    } else if (daysUntilEvent >= 3) {
      refundPercentage = 0.5; // 50% refund
    }

    const refundableAmount = ticketPrice * refundPercentage;
    const refundAmount = refundableAmount - serviceFee;

    return Math.max(0, refundAmount); // Đảm bảo không âm
  };

  const refundAmount = calculateRefundAmount();
  const serviceFee = ticketPrice * 0.05;
  const refundPercentage = daysUntilEvent >= 7 ? 100 : daysUntilEvent >= 3 ? 50 : 0;

  const handleSubmit = () => {
    if (!refundReason || !agreeToTerms) {
      toast.error(t('ticketRefund.fillRequiredFields'));
      return;
    }

    if (!isEligible || refundAmount <= 0) {
      toast.error(t('ticketRefund.notEligible'));
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
      toast.success(t('ticketRefund.requestSubmitted'));
      
      if (onRefundSubmitted) {
        onRefundSubmitted();
      }
    } catch (error: any) {
      console.error('Error submitting refund request:', error);
      const errorMessage = error.response?.data?.message || error.message || t('ticketRefund.submitError');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={20} />
            {t('ticketRefund.requestRefund')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Eligibility Status */}
          {!isEligible ? (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="text-red-600" size={16} />
              <AlertDescription className="text-red-800">
                {t('ticketRefund.notEligibleMessage', { days: daysUntilEvent })}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-blue-50 border-blue-200">
              <Check className="text-blue-600" size={16} />
              <AlertDescription className="text-blue-800">
                {t('ticketRefund.eligibleMessage', { days: daysUntilEvent, percentage: refundPercentage })}
              </AlertDescription>
            </Alert>
          )}

          {/* Refund Calculation */}
          <div className="p-4 bg-neutral-50 rounded-lg space-y-3">
            <div className="text-sm font-medium text-neutral-900 mb-3">
              {t('ticketRefund.refundCalculation')}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">{t('ticketRefund.originalAmount')}:</span>
                <span className="text-neutral-900">{formatPrice(ticketPrice)}</span>
              </div>
              
              {refundPercentage > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">{t('ticketRefund.refundPercentage')}:</span>
                    <span className="text-neutral-900">{refundPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">{t('ticketRefund.refundableAmount')}:</span>
                    <span className="text-neutral-900">
                      {formatPrice(ticketPrice * (refundPercentage / 100))}
                    </span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between">
                <span className="text-neutral-600">{t('ticketRefund.serviceFee')} ({t('ticketRefund.nonRefundable')}):</span>
                <span className="text-red-600">-{formatPrice(serviceFee)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-900 font-medium">{t('ticketRefund.estimatedRefund')}:</span>
                <span className="text-2xl text-green-600 font-bold">
                  {formatPrice(refundAmount)}
                </span>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200 mt-4">
              <Clock className="text-blue-600" size={14} />
              <AlertDescription className="text-blue-800 text-xs">
                {t('ticketRefund.processingTime')}
              </AlertDescription>
            </Alert>
          </div>

          {/* Refund Policy Summary */}
          <div className="p-4 bg-neutral-50 rounded-lg space-y-2 text-sm">
            <div className="font-medium text-neutral-900 mb-2">
              {t('ticketRefund.refundPolicy')}
            </div>
            <div className="flex gap-2">
              <Check size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-700">
                {t('ticketRefund.fullRefund')}: 7+ {t('ticketRefund.daysBeforeEvent')}
              </span>
            </div>
            <div className="flex gap-2">
              <Check size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-700">
                {t('ticketRefund.halfRefund')}: 3-7 {t('ticketRefund.daysBeforeEvent')}
              </span>
            </div>
            <div className="flex gap-2">
              <AlertCircle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-700">
                {t('ticketRefund.noRefund')}: {'<'}3 {t('ticketRefund.daysBeforeEvent')}
              </span>
            </div>
          </div>

          {/* Refund Reason */}
          <div className="space-y-2">
            <Label htmlFor="refundReason">
              {t('ticketRefund.refundReason')} <span className="text-red-500">*</span>
            </Label>
            <Select value={refundReason} onValueChange={setRefundReason}>
              <SelectTrigger id="refundReason">
                <SelectValue placeholder={t('ticketRefund.selectReason')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cancelled">{t('ticketRefund.reasonCancelled')}</SelectItem>
                <SelectItem value="schedule">{t('ticketRefund.reasonSchedule')}</SelectItem>
                <SelectItem value="personal">{t('ticketRefund.reasonPersonal')}</SelectItem>
                <SelectItem value="medical">{t('ticketRefund.reasonMedical')}</SelectItem>
                <SelectItem value="not-described">{t('ticketRefund.reasonNotDescribed')}</SelectItem>
                <SelectItem value="venue">{t('ticketRefund.reasonVenue')}</SelectItem>
                <SelectItem value="accidental">{t('ticketRefund.reasonAccidental')}</SelectItem>
                <SelectItem value="other">{t('ticketRefund.reasonOther')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label htmlFor="additionalDetails">
              {t('ticketRefund.additionalDetails')} ({t('common.optional')})
            </Label>
            <Textarea
              id="additionalDetails"
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder={t('ticketRefund.additionalDetailsPlaceholder')}
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
              {t('ticketRefund.agreeToTerms')}
              <Button variant="link" className="p-0 h-auto ml-1" onClick={() => onRefundSubmitted?.()}>
                {t('ticketRefund.viewTerms')}
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
            {t('ticketRefund.submitRequest')}
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
              {t('ticketRefund.confirmTitle')}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t('ticketRefund.confirmDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">{t('ticketRefund.orderId')}:</span>
              <span className="text-neutral-900">#{orderId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">{t('ticketRefund.event')}:</span>
              <span className="text-neutral-900">{eventTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">{t('ticketRefund.refundAmount')}:</span>
              <span className="text-green-600 font-medium">{formatPrice(refundAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">{t('ticketRefund.processingTime')}:</span>
              <span className="text-neutral-900">5-7 {t('ticketRefund.businessDays')}</span>
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
                  {t('ticketRefund.processing')}...
                </>
              ) : (
                t('ticketRefund.confirmRefund')
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
              {t('ticketRefund.successTitle')}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t('ticketRefund.successDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="p-4 bg-neutral-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-600">{t('ticketRefund.expectedRefund')}:</span>
                <span className="text-green-600 font-medium">{formatPrice(refundAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">{t('ticketRefund.status')}:</span>
                <Badge className="bg-yellow-100 text-yellow-700">{t('ticketRefund.underReview')}</Badge>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="text-blue-600" size={14} />
              <AlertDescription className="text-xs text-blue-800">
                {t('ticketRefund.confirmationEmailSent')}
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

