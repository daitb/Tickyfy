import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  User,
  Mail,
  AlertTriangle,
  CheckCircle,
  Ticket as TicketIcon,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { ticketService, type TicketDto } from "../services/ticketService";
import { authService } from "../services/authService";
import { useEffect } from "react";
import type { Order, OrderTicket } from "../types";

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

// STEPS sẽ được tạo động với translation

export function TransferTicket({
  ticketId,
  orders,
  onNavigate,
}: TransferTicketProps) {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);

  // Use useMemo to update STEPS when language changes
  const STEPS = useMemo(
    () => [
      { number: 1, label: t("transfer.ticket.step1") },
      { number: 2, label: t("transfer.ticket.step2") },
      { number: 3, label: t("transfer.ticket.step3") },
      { number: 4, label: t("transfer.ticket.step4") },
    ],
    [t]
  );

  const [selectedTicket, setSelectedTicket] = useState<TicketDto | null>(null);
  const [transferableTickets, setTransferableTickets] = useState<TicketDto[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [formData, setFormData] = useState<TransferFormData>({
    recipientEmail: "",
    recipientName: "",
    message: "",
    includeSeatInfo: true,
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [transferCode, setTransferCode] = useState<string>("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Get current user email
  const currentUser = authService.getCurrentUser();
  const currentUserEmail = currentUser?.email || "";

  // Load transferable tickets from API
  useEffect(() => {
    const loadTransferableTickets = async () => {
      try {
        setIsLoading(true);
        if (!authService.isAuthenticated()) {
          onNavigate("login");
          return;
        }

        const allTickets = await ticketService.getMyTickets();

        // Filter only transferable tickets: status = 'Valid' and not used
        const transferable = allTickets.filter(
          (ticket) =>
            ticket.status.toLowerCase() === "valid" &&
            !ticket.isUsed &&
            !ticket.usedAt
        );

        setTransferableTickets(transferable);

        // Pre-select ticket if ticketId is provided
        if (ticketId) {
          const ticket = transferable.find(
            (t) => t.ticketId.toString() === ticketId
          );
          if (ticket) {
            setSelectedTicket(ticket);
            setCurrentStep(2);
          }
        }
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          "Không thể tải danh sách vé. Vui lòng thử lại.";
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransferableTickets();
  }, [ticketId, onNavigate]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleTicketSelect = (ticket: TicketDto) => {
    setSelectedTicket(ticket);
  };

  const handleFormChange = (field: keyof TransferFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipientEmail.trim()) {
      newErrors.recipientEmail = t("transfer.ticket.recipientEmailRequired");
    } else if (!validateEmail(formData.recipientEmail)) {
      newErrors.recipientEmail = t("transfer.ticket.recipientEmailInvalid");
    } else if (
      formData.recipientEmail.toLowerCase() === currentUserEmail.toLowerCase()
    ) {
      newErrors.recipientEmail = t("transfer.ticket.recipientEmailSelf");
    }

    if (formData.message.length > 200) {
      newErrors.message = t("transfer.ticket.messageExceeded");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!selectedTicket) {
        toast.error(t("transfer.ticket.selectTicketError"));
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      if (!formData.termsAccepted) {
        const errorMsg = t("transfer.ticket.termsRequired");
        setErrors({ terms: errorMsg });
        toast.error(errorMsg);
        return;
      }

      // Call API to transfer ticket
      if (!selectedTicket) {
        toast.error(t("transfer.ticket.selectTicketError"));
        return;
      }

      await handleTransferTicket();
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep < 4) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    onNavigate("my-tickets");
  };

  const handleTransferTicket = async () => {
    if (!selectedTicket) return;

    try {
      setIsTransferring(true);

      await ticketService.transferTicket(selectedTicket.ticketId.toString(), {
        recipientEmail: formData.recipientEmail,
        recipientName:
          formData.recipientName || formData.recipientEmail.split("@")[0],
      });

      // Generate transfer code for display
      const code = `TRF-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;
      setTransferCode(code);
      setCurrentStep(4);

      // Remove transferred ticket from list
      setTransferableTickets((prev) =>
        prev.filter((t) => t.ticketId !== selectedTicket.ticketId)
      );

      toast.success(t("transfer.ticket.successMessage"));

      // Trigger reload in MyTickets page
      window.dispatchEvent(new Event("tickets-updated"));
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        t("transfer.ticket.errorMessage");
      toast.error(errorMsg);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleTransferAnother = () => {
    setCurrentStep(1);
    setSelectedTicket(null);
    setFormData({
      recipientEmail: "",
      recipientName: "",
      message: "",
      includeSeatInfo: true,
      termsAccepted: false,
    });
    setErrors({});
    setTransferCode("");
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate("my-tickets")}
            className="mb-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            {t("transfer.ticket.backToMyTickets")}
          </Button>
          <h1 className="mb-2">{t("transfer.ticket.title")}</h1>
          <p className="text-neutral-600">{t("transfer.ticket.subtitle")}</p>
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
                        ? "bg-teal-500 text-white"
                        : "bg-neutral-200 text-neutral-500"
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
                        ? "text-teal-600"
                        : "text-neutral-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 -mx-2 ${
                      currentStep > step.number
                        ? "bg-teal-500"
                        : "bg-neutral-200"
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
                  <h3 className="mb-4">{t("transfer.ticket.selectTicket")}</h3>
                  <p className="text-sm text-neutral-600 mb-6">
                    {t("transfer.ticket.selectTicketDescription")}
                  </p>
                </div>

                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <p className="text-neutral-600">
                      {t("transfer.ticket.loadingTickets")}
                    </p>
                  </div>
                ) : transferableTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <TicketIcon
                      className="mx-auto text-neutral-400 mb-4"
                      size={48}
                    />
                    <h3 className="text-neutral-900 mb-2">
                      {t("transfer.ticket.noTransferableTickets")}
                    </h3>
                    <p className="text-neutral-600">
                      {t("transfer.ticket.noTransferableTicketsDescription")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-neutral-600">
                      {t("transfer.ticket.foundTickets")}{" "}
                      <strong>{transferableTickets.length}</strong>{" "}
                      {transferableTickets.length === 1
                        ? t("transfer.ticket.foundTicketsSingular")
                        : t("transfer.ticket.foundTicketsPlural")}{" "}
                      {t("transfer.ticket.foundTicketsSuffix")}
                    </p>
                  </div>
                )}

                {!isLoading && transferableTickets.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {transferableTickets.map((ticket) => (
                      <button
                        key={ticket.ticketId}
                        onClick={() => handleTicketSelect(ticket)}
                        className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                          selectedTicket?.ticketId === ticket.ticketId
                            ? "border-teal-500 bg-teal-50"
                            : "border-neutral-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <TicketIcon
                              className="text-neutral-600"
                              size={24}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-neutral-900 mb-1 truncate">
                              {ticket.eventTitle}
                            </div>
                            <div className="text-sm text-neutral-600">
                              {new Date(
                                ticket.eventStartDate
                              ).toLocaleDateString(
                                i18n.language === "vi" ? "vi-VN" : "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-teal-100 text-teal-700 text-xs">
                                {ticket.ticketTypeName}
                              </Badge>
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                {ticket.status}
                              </Badge>
                            </div>
                            {ticket.seatNumber && (
                              <div className="text-xs text-neutral-500 mt-1">
                                {t("transfer.ticket.seatLabel")}{" "}
                                {ticket.seatNumber}
                              </div>
                            )}
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
                  <h3 className="mb-2">
                    {t("transfer.ticket.transferDetails")}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {t("transfer.ticket.enterRecipientInfo")}
                  </p>
                </div>

                {/* Selected Ticket Preview */}
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <TicketIcon className="text-teal-600" size={20} />
                    <div>
                      <div className="text-sm text-neutral-900">
                        {selectedTicket.eventTitle}
                      </div>
                      <div className="text-xs text-neutral-600">
                        {selectedTicket.ticketTypeName} •{" "}
                        {new Date(
                          selectedTicket.eventStartDate
                        ).toLocaleDateString(
                          i18n.language === "vi" ? "vi-VN" : "en-US",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )}
                      </div>
                      {selectedTicket.seatNumber && (
                        <div className="text-xs text-neutral-500 mt-1">
                          {t("transfer.ticket.seatLabel")}{" "}
                          {selectedTicket.seatNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Warning Alert */}
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    {t("transfer.ticket.warning")}
                  </AlertDescription>
                </Alert>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipientEmail">
                      {t("transfer.ticket.recipientEmail")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                        size={18}
                      />
                      <Input
                        id="recipientEmail"
                        type="email"
                        placeholder="recipient@example.com"
                        value={formData.recipientEmail}
                        onChange={(e) =>
                          handleFormChange("recipientEmail", e.target.value)
                        }
                        className={`pl-10 ${
                          errors.recipientEmail ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                    {errors.recipientEmail && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.recipientEmail}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="recipientName">
                      {t("transfer.ticket.recipientName")}
                    </Label>
                    <div className="relative mt-1">
                      <User
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                        size={18}
                      />
                      <Input
                        id="recipientName"
                        type="text"
                        placeholder={t(
                          "transfer.ticket.recipientNamePlaceholder"
                        )}
                        value={formData.recipientName}
                        onChange={(e) =>
                          handleFormChange("recipientName", e.target.value)
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">
                      {t("transfer.ticket.message")}
                    </Label>
                    <Textarea
                      id="message"
                      placeholder={t("transfer.ticket.messagePlaceholder")}
                      value={formData.message}
                      onChange={(e) =>
                        handleFormChange("message", e.target.value)
                      }
                      className="mt-1 min-h-[100px]"
                      maxLength={200}
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-neutral-500">
                        {formData.message.length}/200{" "}
                        {t("transfer.ticket.messageMaxLength")}
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
                        handleFormChange("includeSeatInfo", checked)
                      }
                    />
                    <Label
                      htmlFor="includeSeatInfo"
                      className="text-sm cursor-pointer"
                    >
                      {t("transfer.ticket.includeSeatInfo")}
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && selectedTicket && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2">
                    {t("transfer.ticket.confirmTransfer")}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {t("transfer.ticket.reviewDetails")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ticket Info */}
                  <div>
                    <h4 className="text-sm text-neutral-600 mb-3">
                      {t("transfer.ticket.ticketDetails")}
                    </h4>
                    <Card className="border-teal-200 bg-teal-50">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-neutral-600">
                              {t("transfer.ticket.event")}
                            </div>
                            <div className="text-sm text-neutral-900">
                              {selectedTicket.eventTitle}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-neutral-600">
                              {t("transfer.ticket.date")}
                            </div>
                            <div className="text-sm text-neutral-900">
                              {new Date(
                                selectedTicket.eventStartDate
                              ).toLocaleDateString(
                                i18n.language === "vi" ? "vi-VN" : "en-US",
                                {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-neutral-600">
                              {t("transfer.ticket.tier")}
                            </div>
                            <div className="text-sm text-neutral-900">
                              {selectedTicket.ticketTypeName}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-neutral-600">
                              {t("transfer.ticket.venue")}
                            </div>
                            <div className="text-sm text-neutral-900">
                              {selectedTicket.eventVenue}
                            </div>
                          </div>
                          {selectedTicket.seatNumber && (
                            <div>
                              <div className="text-xs text-neutral-600">
                                {t("transfer.ticket.seat")}
                              </div>
                              <div className="text-sm text-neutral-900">
                                {selectedTicket.seatNumber}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Transfer Info */}
                  <div>
                    <h4 className="text-sm text-neutral-600 mb-3">
                      {t("transfer.ticket.transferInformation")}
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="text-xs text-neutral-600 mb-1">
                          {t("transfer.ticket.from")}
                        </div>
                        <div className="text-sm text-neutral-900">
                          {currentUser?.fullName || t("common.currentUser")}
                        </div>
                        <div className="text-xs text-neutral-600">
                          {currentUserEmail}
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <ArrowRight className="text-neutral-400" size={20} />
                      </div>

                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="text-xs text-neutral-600 mb-1">
                          {t("transfer.ticket.to")}
                        </div>
                        <div className="text-sm text-neutral-900">
                          {formData.recipientName ||
                            t("transfer.ticket.recipient")}
                        </div>
                        <div className="text-xs text-neutral-600">
                          {formData.recipientEmail}
                        </div>
                      </div>

                      {formData.message && (
                        <div className="bg-neutral-50 rounded-lg p-4">
                          <div className="text-xs text-neutral-600 mb-1">
                            {t("transfer.ticket.message")}
                          </div>
                          <div className="text-sm text-neutral-900 italic">
                            "{formData.message}"
                          </div>
                        </div>
                      )}

                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-900">
                            {t("transfer.ticket.transferFee")}
                          </span>
                          <span className="text-green-600">
                            {t("transfer.ticket.free")}
                          </span>
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
                        handleFormChange("termsAccepted", checked)
                      }
                    />
                    <Label
                      htmlFor="termsAccepted"
                      className="text-sm cursor-pointer"
                    >
                      {t("transfer.ticket.termsAccept")}
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
                <h3 className="text-neutral-900 mb-2">
                  {t("transfer.ticket.transferInitiated")}
                </h3>
                <p className="text-neutral-600 mb-6">
                  {t("transfer.ticket.recipientWillReceiveEmail")}
                </p>

                <div className="bg-neutral-50 rounded-xl p-6 mb-6 max-w-md mx-auto">
                  <div className="text-sm text-neutral-600 mb-2">
                    {t("transfer.ticket.transferCode")}
                  </div>
                  <div className="text-2xl text-teal-600 font-mono tracking-wider mb-4">
                    {transferCode}
                  </div>
                  <p className="text-xs text-neutral-500">
                    {t("transfer.ticket.saveCodeForRecords")}
                  </p>
                </div>

                <div className="space-y-3 max-w-md mx-auto">
                  <Button
                    onClick={() => onNavigate("my-tickets")}
                    className="w-full bg-teal-500 hover:bg-teal-600"
                  >
                    {t("transfer.ticket.backToMyTickets")}
                  </Button>
                  <Button
                    onClick={handleTransferAnother}
                    variant="outline"
                    className="w-full"
                  >
                    {t("transfer.ticket.transferAnother")}
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
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft size={16} className="mr-2" />
                {t("transfer.ticket.previous")}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <X size={16} className="mr-2" />
              {t("transfer.ticket.cancel")}
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 bg-teal-500 hover:bg-teal-600"
              disabled={
                (currentStep === 1 && !selectedTicket) || isTransferring
              }
            >
              {isTransferring ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t("transfer.ticket.transferring")}
                </>
              ) : currentStep === 3 ? (
                <>
                  <Send size={16} className="mr-2" />
                  {t("transfer.ticket.confirmAndSend")}
                </>
              ) : (
                <>
                  {t("transfer.ticket.next")}
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.cancelConfirm")}</DialogTitle>
            <DialogDescription>
              {t("common.cancelConfirmMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              {t("common.no")}
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              {t("common.yes")}, {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
