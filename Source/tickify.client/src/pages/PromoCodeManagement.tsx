import { useState, useEffect } from "react";
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
  // const { t } = useTranslation();
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

  // Load promo codes on component mount
  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      console.log("Loading promo codes...");
      const codes = await promoCodeService.getAll();
      console.log("Promo codes loaded:", codes);
      setPromoCodes(codes || []);
    } catch (error) {
      console.error("Failed to load promo codes:", error);
      if (
        (error as { response?: { status?: number } }).response?.status === 403
      ) {
        toast.error("You don't have permission to view promo codes");
      } else if (
        (error as { response?: { status?: number } }).response?.status === 401
      ) {
        toast.error("Please log in to view promo codes");
      } else {
        toast.error("Failed to load promo codes");
      }
      setPromoCodes([]); // Ensure promoCodes is always an array
    } finally {
      setLoading(false);
    }
  };

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
      <Badge className="bg-green-100 text-green-700">Active</Badge>
    ) : (
      <Badge className="bg-neutral-200 text-neutral-700">Inactive</Badge>
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
    toast.success("Promo code copied to clipboard");
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
      setSubmitting(true);
      const created = await promoCodeService.create(formData);
      console.log("Created promo code:", created);
      toast.success("Promo code created successfully");
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
        "Failed to create promo code";
      toast.error(String(message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCode = async () => {
    if (!selectedCode) return;

    try {
      setSubmitting(true);
      const updateData: UpdatePromoCodeDto = {
        ...formData,
        isActive: selectedCode.isActive,
      };
      const updated = await promoCodeService.update(
        selectedCode.promoCodeId,
        updateData
      );
      console.log("Updated promo code:", updated);
      toast.success("Promo code updated successfully");
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
        "Failed to update promo code";
      toast.error(String(message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCode = async () => {
    if (!codeToDelete) return;

    try {
      await promoCodeService.delete(codeToDelete);
      toast.success("Promo code deleted successfully");
      setCodeToDelete(null);
      loadPromoCodes();
    } catch (error) {
      console.error("Failed to delete promo code:", error);
      toast.error("Failed to delete promo code");
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
              <h3 className="text-neutral-900 mb-2">Access Restricted</h3>
              <p className="text-neutral-600 mb-6">
                You need Admin or Organizer privileges to manage promo codes.
              </p>
              <p className="text-sm text-neutral-500">
                Current role: {currentUser?.role || "Guest"}
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <h1>Promo Code Management</h1>
              <div className="flex gap-3">
                <Button variant="outline">
                  <Upload size={18} className="mr-2" />
                  Bulk Import
                </Button>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-teal-500 hover:bg-teal-600"
                >
                  <Plus size={18} className="mr-2" />
                  Create New Code
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-sm text-neutral-600">Total Codes</div>
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Tag className="text-teal-600" size={20} />
                    </div>
                  </div>
                  <div className="text-2xl text-neutral-900 mb-1">
                    {totalCodes}
                  </div>
                  <div className="text-xs text-neutral-600">
                    All promo codes
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-sm text-neutral-600">Active Codes</div>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="text-green-600" size={20} />
                    </div>
                  </div>
                  <div className="text-2xl text-green-500 mb-1">
                    {activeCodes}
                  </div>
                  <div className="text-xs text-neutral-600">
                    Currently available
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-sm text-neutral-600">
                      Total Redemptions
                    </div>
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-teal-600" size={20} />
                    </div>
                  </div>
                  <div className="text-2xl text-neutral-900 mb-1">
                    {totalRedemptions}
                  </div>
                  <div className="text-xs text-neutral-600">Times used</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-sm text-neutral-600">
                      Total Redemptions
                    </div>
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-teal-600" size={20} />
                    </div>
                  </div>
                  <div className="text-2xl text-neutral-900 mb-1">
                    {totalRedemptions}
                  </div>
                  <div className="text-xs text-neutral-600">Codes redeemed</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters & Search */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    placeholder="Search code or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
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
                  Loading promo codes...
                </span>
              </div>
            ) : filteredCodes.length === 0 ? (
              <Card className="p-16">
                <div className="text-center">
                  <Tag className="mx-auto text-neutral-400 mb-4" size={64} />
                  <h3 className="text-neutral-900 mb-2">No promo codes yet</h3>
                  <p className="text-neutral-600 mb-6">
                    Create your first promo code to get started
                  </p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-teal-500 hover:bg-teal-600"
                  >
                    <Plus size={18} className="mr-2" />
                    Create Promo Code
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
                    <div className="absolute top-4 right-4">
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
                              Valid period:
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
                                Min purchase:
                              </span>
                              <span className="text-neutral-900">
                                {code.minimumPurchase.toLocaleString()}₫
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-neutral-600">Usage</span>
                            <span className="text-neutral-900">
                              {code.currentUses}/{code.maxUses || "∞"} used
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
                            Edit
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
                            Stats
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
                  <DialogTitle>Create Promo Code</DialogTitle>
                  <DialogDescription>
                    Set up a new promotional discount code
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="code">
                      Promo Code <span className="text-red-500">*</span>
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
                        placeholder="SUMMER2025"
                        className="font-mono"
                        maxLength={20}
                      />
                      <Button variant="outline" onClick={generateRandomCode}>
                        Generate
                      </Button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Alphanumeric, 4-20 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Brief description of this promo code"
                      maxLength={200}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discountPercent">
                        Discount Percentage (%)
                      </Label>
                      <Input
                        id="discountPercent"
                        type="number"
                        value={formData.discountPercent || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountPercent: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                            discountAmount: undefined, // Clear the other discount field
                          })
                        }
                        placeholder="20"
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Leave empty if using fixed amount
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="discountAmount">
                        Discount Amount (VND)
                      </Label>
                      <Input
                        id="discountAmount"
                        type="number"
                        value={formData.discountAmount || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountAmount: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                            discountPercent: undefined, // Clear the other discount field
                          })
                        }
                        placeholder="50000"
                        min="0"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Leave empty if using percentage
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxUses">Max Total Uses</Label>
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
                        placeholder="Optional"
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxUsesPerUser">Max Uses Per User</Label>
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
                        placeholder="Optional"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="validFrom">Valid From</Label>
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
                      <Label htmlFor="validTo">Valid To</Label>
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
                      Minimum Purchase Amount (VND)
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
                      placeholder="Optional"
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
                    Cancel
                  </Button>
                  <Button
                    className="bg-teal-500 hover:bg-teal-600"
                    onClick={handleCreateCode}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create & Activate"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Promo Code Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Promo Code</DialogTitle>
                  <DialogDescription>
                    Update the promo code details
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="edit-code">
                      Promo Code <span className="text-red-500">*</span>
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
                      placeholder="SUMMER2025"
                      className="font-mono"
                      maxLength={20}
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Alphanumeric, 4-20 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Brief description of this promo code"
                      maxLength={200}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-discountPercent">
                        Discount Percentage (%)
                      </Label>
                      <Input
                        id="edit-discountPercent"
                        type="number"
                        value={formData.discountPercent || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountPercent: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                            discountAmount: undefined, // Clear the other discount field
                          })
                        }
                        placeholder="20"
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Leave empty if using fixed amount
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="edit-discountAmount">
                        Discount Amount (VND)
                      </Label>
                      <Input
                        id="edit-discountAmount"
                        type="number"
                        value={formData.discountAmount || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountAmount: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                            discountPercent: undefined, // Clear the other discount field
                          })
                        }
                        placeholder="50000"
                        min="0"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Leave empty if using percentage
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-maxUses">Max Total Uses</Label>
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
                        placeholder="Optional"
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-maxUsesPerUser">
                        Max Uses Per User
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
                        placeholder="Optional"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-validFrom">Valid From</Label>
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
                      <Label htmlFor="edit-validTo">Valid To</Label>
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
                      Minimum Purchase Amount (VND)
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
                      placeholder="Optional"
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
                    Cancel
                  </Button>
                  <Button
                    className="bg-teal-500 hover:bg-teal-600"
                    onClick={handleEditCode}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Code"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Stats Dialog */}
            <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Promo Code Statistics</DialogTitle>
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
                            Total Uses
                          </div>
                          <div className="text-2xl text-neutral-900">
                            {selectedCode.currentUses}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-neutral-600">
                            Remaining
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
                      More detailed statistics would appear here...
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button onClick={() => setShowStatsDialog(false)}>
                    Close
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
                  <DialogTitle>Delete Promo Code?</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this promo code? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCodeToDelete(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-red-500 hover:bg-red-600"
                    onClick={handleDeleteCode}
                  >
                    Delete
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
