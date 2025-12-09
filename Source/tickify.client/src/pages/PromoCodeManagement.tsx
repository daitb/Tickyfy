import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Tag,
  Plus,
  Upload,
  Copy,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Progress } from "../components/ui/progress";
import { promoCodeService } from "../services/promoCodeService";
import type {
  PromoCode,
  CreatePromoCodeDto,
  UpdatePromoCodeDto,
} from "../services/promoCodeService";
import { authService } from "../services/authService";
import { toast } from "sonner";

export function PromoCodeManagement() {
  const { t } = useTranslation();
  const currentUser = authService.getCurrentUser();
  const hasPromoCodeAccess =
    currentUser?.role === "Admin" || currentUser?.role === "Organizer";
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [selectedCode, setSelectedCode] = useState<PromoCode | null>(null);
  const [codeToDelete, setCodeToDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState<CreatePromoCodeDto>({
    code: "",
    description: "",
    discountPercent: undefined,
    discountAmount: undefined,
    minimumPurchase: undefined,
    maxUses: undefined,
    maxUsesPerUser: undefined,
    validFrom: undefined,
    validTo: undefined,
  });

  const loadPromoCodes = useCallback(async () => {
    try {
      setLoading(true);
      const codes = await promoCodeService.getAll();
      setPromoCodes(codes || []);
    } catch (error) {
      console.error("Failed to load promo codes:", error);
      if (
        (error as { response?: { status?: number } }).response?.status === 403
      ) {
        toast.error(t("promoCode.errors.noPermission"));
      } else if (
        (error as { response?: { status?: number } }).response?.status === 401
      ) {
        toast.error(t("promoCode.errors.pleaseLogin"));
      } else {
        toast.error(t("promoCode.errors.loadFailed"));
      }
      setPromoCodes([]); // Ensure promoCodes is always an array
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load promo codes on component mount
  useEffect(() => {
    loadPromoCodes();
  }, [loadPromoCodes]);

  const filteredCodes = (promoCodes || []).filter((code) => {
    const matchesSearch =
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (code.description?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && code.isActive) ||
      (statusFilter === "inactive" && !code.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalCodes = promoCodes?.length || 0;
  const activeCodes = promoCodes?.filter((c) => c.isActive).length || 0;
  const totalRedemptions =
    promoCodes?.reduce((sum, c) => sum + c.currentUses, 0) || 0;

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-700">
        {t("promoCode.status.active")}
      </Badge>
    ) : (
      <Badge className="bg-neutral-200 text-neutral-700">
        {t("promoCode.status.inactive")}
      </Badge>
    );
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(t("promoCode.notifications.copiedToClipboard"));
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountPercent: undefined,
      discountAmount: undefined,
      minimumPurchase: undefined,
      maxUses: undefined,
      maxUsesPerUser: undefined,
      validFrom: undefined,
      validTo: undefined,
    });
  };

  const handleCreateCode = async () => {
    try {
      // Frontend validation
      if (!formData.code || formData.code.trim() === "") {
        toast.error(t("promoCode.errors.codeRequired"));
        return;
      }

      if (formData.code.length < 4 || formData.code.length > 20) {
        toast.error(t("promoCode.errors.codeInvalid"));
        return;
      }

      if (!formData.description || formData.description.trim() === "") {
        toast.error(t("promoCode.errors.descriptionRequired"));
        return;
      }

      if (!formData.discountPercent && !formData.discountAmount) {
        toast.error(t("promoCode.errors.discountRequired"));
        return;
      }

      if (formData.discountPercent && formData.discountAmount) {
        toast.error(t("promoCode.errors.discountBothSet"));
        return;
      }

      if (
        formData.discountPercent &&
        (formData.discountPercent < 1 || formData.discountPercent > 100)
      ) {
        toast.error(t("promoCode.errors.discountPercentRange"));
        return;
      }

      if (formData.discountAmount && formData.discountAmount <= 0) {
        toast.error(t("promoCode.errors.discountAmountInvalid"));
        return;
      }

      if (!formData.validFrom) {
        toast.error(t("promoCode.errors.validFromRequired"));
        return;
      }

      if (!formData.validTo) {
        toast.error(t("promoCode.errors.validToRequired"));
        return;
      }

      if (new Date(formData.validTo) <= new Date(formData.validFrom)) {
        toast.error(t("promoCode.errors.validToBeforeFrom"));
        return;
      }

      setSubmitting(true);
      const created = await promoCodeService.create(formData);
      toast.success(t("promoCode.notifications.createdSuccessfully"));
      setShowCreateDialog(false);
      resetForm();
      loadPromoCodes();
    } catch (error) {
      console.error("Failed to create promo code:", error);
      // Try to extract a useful message from the server response
      const err = error as unknown as {
        response?: { data?: { message?: string; errors?: unknown } };
        message?: string;
      };
      const message =
        err.response?.data?.message ??
        err.response?.data?.errors ??
        err.message ??
        t("promoCode.errors.createFailed");

      // Check for specific error types
      if (
        String(message).toLowerCase().includes("already exists") ||
        String(message).toLowerCase().includes("duplicate")
      ) {
        toast.error(t("promoCode.errors.codeExists"));
      } else {
        toast.error(String(message));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (code: PromoCode) => {
    try {
      // Check if description exists
      if (!code.description || code.description.trim() === "") {
        toast.error("Cannot toggle: Promo code has no description");
        return;
      }

      // Prepare update data with all required fields
      const updateData: UpdatePromoCodeDto = {
        code: code.code,
        description: code.description,
        discountPercent: code.discountPercent ?? undefined,
        discountAmount: code.discountAmount ?? undefined,
        minimumPurchase: code.minimumPurchase ?? undefined,
        maxUses: code.maxUses ?? undefined,
        maxUsesPerUser: code.maxUsesPerUser ?? undefined,
        validFrom: code.validFrom,
        validTo: code.validTo,
        isActive: !code.isActive,
        eventId: code.eventId,
        organizerId: code.organizerId,
      };

      await promoCodeService.update(code.promoCodeId, updateData);
      toast.success(
        code.isActive
          ? t("promoCode.notifications.deactivatedSuccessfully")
          : t("promoCode.notifications.activatedSuccessfully")
      );
      loadPromoCodes();
    } catch (error) {
      console.error("Failed to toggle promo code status:", error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMsg =
        err.response?.data?.message || t("promoCode.errors.updateFailed");
      toast.error(errorMsg);
    }
  };

  const handleEditCode = async () => {
    if (!selectedCode) return;

    try {
      // Frontend validation
      if (!formData.code || formData.code.trim() === "") {
        toast.error(t("promoCode.errors.codeRequired"));
        return;
      }

      if (formData.code.length < 4 || formData.code.length > 20) {
        toast.error(t("promoCode.errors.codeInvalid"));
        return;
      }

      if (!formData.description || formData.description.trim() === "") {
        toast.error(t("promoCode.errors.descriptionRequired"));
        return;
      }

      if (!formData.discountPercent && !formData.discountAmount) {
        toast.error(t("promoCode.errors.discountRequired"));
        return;
      }

      if (formData.discountPercent && formData.discountAmount) {
        toast.error(t("promoCode.errors.discountBothSet"));
        return;
      }

      if (
        formData.discountPercent &&
        (formData.discountPercent < 1 || formData.discountPercent > 100)
      ) {
        toast.error(t("promoCode.errors.discountPercentRange"));
        return;
      }

      if (formData.discountAmount && formData.discountAmount <= 0) {
        toast.error(t("promoCode.errors.discountAmountInvalid"));
        return;
      }

      if (!formData.validFrom) {
        toast.error(t("promoCode.errors.validFromRequired"));
        return;
      }

      if (!formData.validTo) {
        toast.error(t("promoCode.errors.validToRequired"));
        return;
      }

      if (new Date(formData.validTo) <= new Date(formData.validFrom)) {
        toast.error(t("promoCode.errors.validToBeforeFrom"));
        return;
      }

      setSubmitting(true);
      const updateData: UpdatePromoCodeDto = {
        ...formData,
        isActive: selectedCode.isActive,
      };
      const updated = await promoCodeService.update(
        selectedCode.promoCodeId,
        updateData
      );
      toast.success(t("promoCode.notifications.updatedSuccessfully"));
      setShowEditDialog(false);
      resetForm();
      loadPromoCodes();
    } catch (error) {
      console.error("Failed to update promo code:", error);
      const err = error as unknown as {
        response?: { data?: { message?: string; errors?: unknown } };
        message?: string;
      };
      const message =
        err.response?.data?.message ??
        err.response?.data?.errors ??
        err.message ??
        t("promoCode.errors.updateFailed");

      // Check for specific error types
      if (
        String(message).toLowerCase().includes("already exists") ||
        String(message).toLowerCase().includes("duplicate")
      ) {
        toast.error(t("promoCode.errors.codeExists"));
      } else {
        toast.error(String(message));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCode = async () => {
    if (!codeToDelete) return;

    try {
      await promoCodeService.delete(codeToDelete);
      toast.success(t("promoCode.notifications.deletedSuccessfully"));
      setCodeToDelete(null);
      loadPromoCodes();
    } catch (error) {
      console.error("Failed to delete promo code:", error);
      toast.error(t("promoCode.errors.deleteFailed"));
    }
  };

  const openEditDialog = (code: PromoCode) => {
    setSelectedCode(code);
    setFormData({
      code: code.code,
      description: code.description || "",
      discountPercent: code.discountPercent,
      discountAmount: code.discountAmount,
      minimumPurchase: code.minimumPurchase,
      maxUses: code.maxUses,
      maxUsesPerUser: code.maxUsesPerUser,
      validFrom: code.validFrom,
      validTo: code.validTo,
    });
    setShowEditDialog(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {!hasPromoCodeAccess ? (
          <Card className="p-16">
            <div className="text-center">
              <AlertCircle
                className="mx-auto text-neutral-400 mb-4"
                size={64}
              />
              <h3 className="text-neutral-900 mb-2">
                {t("promoCode.accessRestricted.title")}
              </h3>
              <p className="text-neutral-600 mb-6">
                {t("promoCode.accessRestricted.description")}
              </p>
              <p className="text-sm text-neutral-500">
                {t("promoCode.accessRestricted.currentRole")}:{" "}
                {currentUser?.role || "Guest"}
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <h1>{t("promoCode.title")}</h1>
              <div className="flex gap-3">
                <Button variant="outline">
                  <Upload size={18} className="mr-2" />
                  {t("promoCode.bulkImport")}
                </Button>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-teal-500 hover:bg-teal-600"
                >
                  <Plus size={18} className="mr-2" />
                  {t("promoCode.createNewCode")}
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-sm text-neutral-600">
                      {t("promoCode.stats.totalCodes")}
                    </div>
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Tag className="text-teal-600" size={20} />
                    </div>
                  </div>
                  <div className="text-2xl text-neutral-900 mb-1">
                    {totalCodes}
                  </div>
                  <div className="text-xs text-neutral-600">
                    {t("promoCode.stats.allPromoCodes")}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-sm text-neutral-600">
                      {t("promoCode.stats.activeCodes")}
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="text-green-600" size={20} />
                    </div>
                  </div>
                  <div className="text-2xl text-green-500 mb-1">
                    {activeCodes}
                  </div>
                  <div className="text-xs text-neutral-600">
                    {t("promoCode.stats.currentlyAvailable")}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-sm text-neutral-600">
                      {t("promoCode.stats.totalRedemptions")}
                    </div>
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-teal-600" size={20} />
                    </div>
                  </div>
                  <div className="text-2xl text-neutral-900 mb-1">
                    {totalRedemptions}
                  </div>
                  <div className="text-xs text-neutral-600">
                    {t("promoCode.stats.timesUsed")}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-sm text-neutral-600">
                      {t("promoCode.stats.avgDiscount")}
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-purple-600" size={20} />
                    </div>
                  </div>
                  <div className="text-2xl text-neutral-900 mb-1">
                    {promoCodes.length > 0
                      ? Math.round(
                          promoCodes.reduce(
                            (sum, c) => sum + (c.discountPercent || 0),
                            0
                          ) / promoCodes.length
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-xs text-neutral-600">
                    {t("promoCode.stats.averageValue")}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters & Search */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    placeholder={t("promoCode.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue
                        placeholder={t("promoCode.statusPlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("promoCode.filters.allStatus")}
                      </SelectItem>
                      <SelectItem value="active">
                        {t("promoCode.filters.active")}
                      </SelectItem>
                      <SelectItem value="inactive">
                        {t("promoCode.filters.inactive")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Promo Codes Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                <span className="ml-2 text-neutral-600">
                  {t("promoCode.loading")}
                </span>
              </div>
            ) : filteredCodes.length === 0 ? (
              <Card className="p-16">
                <div className="text-center">
                  <Tag className="mx-auto text-neutral-400 mb-4" size={64} />
                  <h3 className="text-neutral-900 mb-2">
                    {t("promoCode.emptyState.title")}
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    {t("promoCode.emptyState.description")}
                  </p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-teal-500 hover:bg-teal-600"
                  >
                    <Plus size={18} className="mr-2" />
                    {t("promoCode.createNewCode")}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCodes.map((code) => (
                  <Card
                    key={code.promoCodeId}
                    className="relative overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(code)}
                        className="h-6 px-2 text-xs"
                      >
                        {code.isActive
                          ? t("promoCode.card.deactivate")
                          : t("promoCode.card.activate")}
                      </Button>
                      {getStatusBadge(code.isActive)}
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xl font-mono">{code.code}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                          className="text-teal-500"
                        >
                          <Copy size={16} />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-lg text-neutral-900">
                            {code.discountPercent
                              ? `${code.discountPercent}% OFF`
                              : code.discountAmount
                              ? `${code.discountAmount.toLocaleString()}₫ OFF`
                              : "Free Ticket"}
                          </div>
                          <div className="text-sm text-neutral-600 mt-1">
                            {code.description}
                          </div>
                        </div>

                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-neutral-600">
                              {t("promoCode.card.validPeriod")}:
                            </span>
                            <span className="text-neutral-900">
                              {code.validFrom
                                ? new Date(code.validFrom).toLocaleDateString()
                                : "N/A"}{" "}
                              -{" "}
                              {code.validTo
                                ? new Date(code.validTo).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                          {code.minimumPurchase && (
                            <div className="flex justify-between">
                              <span className="text-neutral-600">
                                {t("promoCode.card.minPurchase")}:
                              </span>
                              <span className="text-neutral-900">
                                {code.minimumPurchase.toLocaleString()}₫
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-neutral-600">
                              {t("promoCode.card.usage")}
                            </span>
                            <span className="text-neutral-900">
                              {code.currentUses}/{code.maxUses || "∞"}{" "}
                              {t("promoCode.card.used")}
                            </span>
                          </div>
                          {code.maxUses && (
                            <Progress
                              value={(code.currentUses / code.maxUses) * 100}
                              className="h-2"
                            />
                          )}
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(code)}
                            className="flex-1"
                          >
                            <Edit size={14} className="mr-1" />
                            {t("promoCode.card.edit")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedCode(code);
                              setShowStatsDialog(true);
                            }}
                          >
                            <Eye size={14} className="mr-1" />
                            {t("promoCode.card.stats")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCodeToDelete(code.promoCodeId)}
                            className="text-red-600 border-red-600"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Create/Edit Promo Code Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("promoCode.createDialog.title")}</DialogTitle>
                  <DialogDescription>
                    {t("promoCode.createDialog.description")}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="code">
                      {t("promoCode.createDialog.fields.code")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder={t(
                          "promoCode.createDialog.placeholders.code"
                        )}
                        className="font-mono"
                        maxLength={20}
                      />
                      <Button variant="outline" onClick={generateRandomCode}>
                        {t("promoCode.createDialog.buttons.generate")}
                      </Button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {t("promoCode.createDialog.help.codeFormat")}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">
                      {t("promoCode.createDialog.fields.description")}
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder={t(
                        "promoCode.createDialog.placeholders.description"
                      )}
                      maxLength={200}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discountPercent">
                        {t("promoCode.createDialog.fields.discountPercent")}
                      </Label>
                      <Input
                        id="discountPercent"
                        type="number"
                        value={formData.discountPercent ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setFormData((prev) => ({
                              ...prev,
                              discountPercent: undefined,
                            }));
                          } else {
                            const numValue = Number(value);
                            if (!isNaN(numValue)) {
                              setFormData((prev) => ({
                                ...prev,
                                discountPercent: numValue,
                                discountAmount: undefined,
                              }));
                            }
                          }
                        }}
                        placeholder={t(
                          "promoCode.createDialog.placeholders.discountPercent"
                        )}
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        {t("promoCode.createDialog.help.discountPercent")}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="discountAmount">
                        {t("promoCode.createDialog.fields.discountAmount")}
                      </Label>
                      <Input
                        id="discountAmount"
                        type="number"
                        value={formData.discountAmount ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setFormData((prev) => ({
                              ...prev,
                              discountAmount: undefined,
                            }));
                          } else {
                            const numValue = Number(value);
                            if (!isNaN(numValue)) {
                              setFormData((prev) => ({
                                ...prev,
                                discountAmount: numValue,
                                discountPercent: undefined,
                              }));
                            }
                          }
                        }}
                        placeholder={t(
                          "promoCode.createDialog.placeholders.discountAmount"
                        )}
                        min="0"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        {t("promoCode.createDialog.help.discountAmount")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxUses">
                        {t("promoCode.createDialog.fields.maxUses")}
                      </Label>
                      <Input
                        id="maxUses"
                        type="number"
                        value={formData.maxUses || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxUses: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder={t(
                          "promoCode.createDialog.placeholders.optional"
                        )}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxUsesPerUser">
                        {t("promoCode.createDialog.fields.maxUsesPerUser")}
                      </Label>
                      <Input
                        id="maxUsesPerUser"
                        type="number"
                        value={formData.maxUsesPerUser || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxUsesPerUser: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder={t(
                          "promoCode.createDialog.placeholders.optional"
                        )}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="validFrom">
                        {t("promoCode.createDialog.fields.validFrom")}
                      </Label>
                      <Input
                        id="validFrom"
                        type="datetime-local"
                        value={
                          formData.validFrom
                            ? new Date(formData.validFrom)
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            validFrom: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : undefined,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="validTo">
                        {t("promoCode.createDialog.fields.validTo")}
                      </Label>
                      <Input
                        id="validTo"
                        type="datetime-local"
                        value={
                          formData.validTo
                            ? new Date(formData.validTo)
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            validTo: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : undefined,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="minimumPurchase">
                      {t("promoCode.createDialog.fields.minimumPurchase")}
                    </Label>
                    <Input
                      id="minimumPurchase"
                      type="number"
                      value={formData.minimumPurchase || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minimumPurchase: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder={t(
                        "promoCode.createDialog.placeholders.optional"
                      )}
                      min="0"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    disabled={submitting}
                  >
                    {t("promoCode.createDialog.buttons.cancel")}
                  </Button>
                  <Button
                    className="bg-teal-500 hover:bg-teal-600"
                    onClick={handleCreateCode}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("promoCode.createDialog.buttons.creating")}
                      </>
                    ) : (
                      t("promoCode.createDialog.buttons.createAndActivate")
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Promo Code Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("promoCode.editDialog.title")}</DialogTitle>
                  <DialogDescription>
                    {t("promoCode.editDialog.description")}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="edit-code">
                      {t("promoCode.editDialog.fields.code")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-code"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder={t("promoCode.editDialog.placeholders.code")}
                      className="font-mono"
                      maxLength={20}
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      {t("promoCode.editDialog.help.codeFormat")}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="edit-description">
                      {t("promoCode.editDialog.fields.description")}
                    </Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder={t(
                        "promoCode.editDialog.placeholders.description"
                      )}
                      maxLength={200}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-discountPercent">
                        {t("promoCode.editDialog.fields.discountPercent")}
                      </Label>
                      <Input
                        id="edit-discountPercent"
                        type="number"
                        value={formData.discountPercent ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setFormData((prev) => ({
                              ...prev,
                              discountPercent: undefined,
                            }));
                          } else {
                            const numValue = Number(value);
                            if (!isNaN(numValue)) {
                              setFormData((prev) => ({
                                ...prev,
                                discountPercent: numValue,
                                discountAmount: undefined,
                              }));
                            }
                          }
                        }}
                        placeholder={t(
                          "promoCode.editDialog.placeholders.discountPercent"
                        )}
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        {t("promoCode.editDialog.help.discountPercent")}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="edit-discountAmount">
                        {t("promoCode.editDialog.fields.discountAmount")}
                      </Label>
                      <Input
                        id="edit-discountAmount"
                        type="number"
                        value={formData.discountAmount ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setFormData((prev) => ({
                              ...prev,
                              discountAmount: undefined,
                            }));
                          } else {
                            const numValue = Number(value);
                            if (!isNaN(numValue)) {
                              setFormData((prev) => ({
                                ...prev,
                                discountAmount: numValue,
                                discountPercent: undefined,
                              }));
                            }
                          }
                        }}
                        placeholder={t(
                          "promoCode.editDialog.placeholders.discountAmount"
                        )}
                        min="0"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        {t("promoCode.editDialog.help.discountAmount")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-maxUses">
                        {t("promoCode.editDialog.fields.maxUses")}
                      </Label>
                      <Input
                        id="edit-maxUses"
                        type="number"
                        value={formData.maxUses || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxUses: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder={t(
                          "promoCode.editDialog.placeholders.optional"
                        )}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-maxUsesPerUser">
                        {t("promoCode.editDialog.fields.maxUsesPerUser")}
                      </Label>
                      <Input
                        id="edit-maxUsesPerUser"
                        type="number"
                        value={formData.maxUsesPerUser || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxUsesPerUser: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder={t(
                          "promoCode.editDialog.placeholders.optional"
                        )}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-validFrom">
                        {t("promoCode.editDialog.fields.validFrom")}
                      </Label>
                      <Input
                        id="edit-validFrom"
                        type="datetime-local"
                        value={
                          formData.validFrom
                            ? new Date(formData.validFrom)
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            validFrom: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : undefined,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-validTo">
                        {t("promoCode.editDialog.fields.validTo")}
                      </Label>
                      <Input
                        id="edit-validTo"
                        type="datetime-local"
                        value={
                          formData.validTo
                            ? new Date(formData.validTo)
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            validTo: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : undefined,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-minimumPurchase">
                      {t("promoCode.editDialog.fields.minimumPurchase")}
                    </Label>
                    <Input
                      id="edit-minimumPurchase"
                      type="number"
                      value={formData.minimumPurchase || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minimumPurchase: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder={t(
                        "promoCode.editDialog.placeholders.optional"
                      )}
                      min="0"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                    disabled={submitting}
                  >
                    {t("promoCode.editDialog.buttons.cancel")}
                  </Button>
                  <Button
                    className="bg-teal-500 hover:bg-teal-600"
                    onClick={handleEditCode}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("promoCode.editDialog.buttons.updating")}
                      </>
                    ) : (
                      t("promoCode.editDialog.buttons.update")
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Stats Dialog */}
            <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("promoCode.statsDialog.title")}</DialogTitle>
                </DialogHeader>
                {selectedCode && (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <code className="text-2xl font-mono">
                        {selectedCode.code}
                      </code>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-neutral-600">
                            {t("promoCode.statsDialog.totalUses")}
                          </div>
                          <div className="text-2xl text-neutral-900">
                            {selectedCode.currentUses}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-neutral-600">
                            {t("promoCode.statsDialog.remaining")}
                          </div>
                          <div className="text-2xl text-neutral-900">
                            {selectedCode.maxUses
                              ? selectedCode.maxUses - selectedCode.currentUses
                              : "∞"}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="text-sm text-neutral-600">
                      {t("promoCode.statsDialog.moreStats")}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button onClick={() => setShowStatsDialog(false)}>
                    {t("promoCode.statsDialog.close")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
              open={!!codeToDelete}
              onOpenChange={() => setCodeToDelete(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("promoCode.deleteDialog.title")}</DialogTitle>
                  <DialogDescription>
                    {t("promoCode.deleteDialog.description")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCodeToDelete(null)}
                  >
                    {t("promoCode.deleteDialog.cancel")}
                  </Button>
                  <Button
                    className="bg-red-500 hover:bg-red-600"
                    onClick={handleDeleteCode}
                  >
                    {t("promoCode.deleteDialog.confirm")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
