import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Save,
  Eye,
  Calendar,
  MapPin,
  Ticket,
  Image as ImageIcon,
  Plus,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
  Tag,
  Layout,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Checkbox } from "../components/ui/checkbox";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import { eventService, type UpdateEventDto } from "../services/eventService";
import { authService } from "../services/authService";
import { promoCodeService, type PromoCode } from "../services/promoCodeService";

interface EditEventProps {
  eventId?: string;
  onNavigate: (page: string, eventId?: string) => void;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description: string;
}

export function EditEvent({ eventId, onNavigate }: EditEventProps) {
  const { t } = useTranslation();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [event, setEvent] = useState<any>(null);

  // Load event data
  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const loadEventData = async () => {
    try {
      setIsLoading(true);
      const eventData = await eventService.getEventById(Number(eventId));
      setEvent(eventData);

      // Populate form data
      setFormData({
        name: eventData.title,
        description: eventData.description || "",
        category: eventData.category,
        eventType: "public",
        tags: [],
        date: eventData.date.split("T")[0],
        startTime: eventData.time || "00:00",
        endTime: "23:00",
        timezone: "Asia/Ho_Chi_Minh",
        venueType: "physical",
        venueName: eventData.venue,
        address: eventData.venue,
        city: eventData.city,
        district: "",
        mapsLink: "",
        onlineLink: "",
        refundPolicy: "full",
        ageRestriction: "all",
        accessibility: [],
        terms: "",
        publishImmediately: true,
      });
    } catch (error) {
      console.error("Error loading event:", error);
      alert("Failed to load event data");
    } finally {
      setIsLoading(false);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Music",
    eventType: "public",
    tags: [] as string[],
    date: "",
    startTime: "",
    endTime: "23:00",
    timezone: "Asia/Ho_Chi_Minh",
    venueType: "physical",
    venueName: "",
    address: "",
    city: "",
    district: "",
    mapsLink: "",
    onlineLink: "",
    refundPolicy: "full",
    ageRestriction: "all",
    accessibility: [] as string[],
    terms: "",
    publishImmediately: true,
  });

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);

  const [availablePromoCodes, setAvailablePromoCodes] = useState<PromoCode[]>(
    []
  );
  const [selectedPromoCodes, setSelectedPromoCodes] = useState<number[]>([]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async (asDraft: boolean = false) => {
    try {
      setIsSaving(true);

      if (!eventId) {
        alert("No event ID provided");
        return;
      }

      // Combine date and time
      const startDateTime = `${formData.date}T${formData.startTime}:00`;
      const endDateTime = `${formData.date}T${formData.endTime}:00`;

      // Map category to categoryId (default to 1)
      const categoryId = 1;

      // Prepare update DTO
      const updateDto: UpdateEventDto = {
        categoryId: categoryId,
        title: formData.name,
        description: formData.description,
        venue: formData.venueName || formData.address,
        imageUrl: event?.image,
        startDate: startDateTime,
        endDate: endDateTime,
        totalSeats:
          ticketTypes.reduce((sum, tt) => sum + tt.quantity, 0) || 100,
        isFeatured: false,
      };

      // PUT /api/events/{id} - Update event
      const updatedEvent = await eventService.updateEvent(
        Number(eventId),
        updateDto
      );

      // If publish immediately, call publish endpoint
      if (formData.publishImmediately && !asDraft) {
        await eventService.publishEvent(Number(eventId));
        alert("Event updated and published successfully!");
      } else {
        alert("Event updated successfully!");
      }

      setHasUnsavedChanges(false);
      onNavigate("organizer-dashboard");
    } catch (error: any) {
      console.error("Error updating event:", error);
      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to update event"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    } else {
      onNavigate("organizer-dashboard");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-neutral-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Event not found</p>
          <Button onClick={() => onNavigate("organizer-dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const addTicketType = () => {
    const newTicket: TicketType = {
      id: Date.now().toString(),
      name: "",
      price: 0,
      quantity: 0,
      description: "",
    };
    setTicketTypes([...ticketTypes, newTicket]);
    setHasUnsavedChanges(true);
  };

  const removeTicketType = (id: string) => {
    setTicketTypes(ticketTypes.filter((t) => t.id !== id));
    setHasUnsavedChanges(true);
  };

  const updateTicketType = (id: string, field: string, value: any) => {
    setTicketTypes(
      ticketTypes.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
    setHasUnsavedChanges(true);
  };

  // Load available promo codes
  useEffect(() => {
    const loadPromoCodes = async () => {
      try {
        const codes = await promoCodeService.getAll();
        setAvailablePromoCodes(codes.filter((code) => code.isActive));
      } catch (error) {
        console.error("Failed to load promo codes:", error);
      }
    };
    loadPromoCodes();
  }, []);

  const handlePromoCodeToggle = (promoCodeId: number) => {
    setSelectedPromoCodes((prev) =>
      prev.includes(promoCodeId)
        ? prev.filter((id) => id !== promoCodeId)
        : [...prev, promoCodeId]
    );
    setHasUnsavedChanges(true);
  };

  const totalCapacity = ticketTypes.reduce((sum, t) => sum + t.quantity, 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-4">
          <button
            onClick={() => onNavigate("event-management")}
            className="hover:text-teal-600"
          >
            {t("editEvent.myEvents")}
          </button>
          <ChevronRight size={16} />
          <button
            onClick={() => onNavigate("event-detail", event.id)}
            className="hover:text-teal-600"
          >
            {event.title}
          </button>
          <ChevronRight size={16} />
          <span className="text-neutral-900">{t("editEvent.edit")}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1>{t("editEvent.editEvent")}</h1>
              <Badge className="bg-green-100 text-green-700">
                {t("editEvent.published")}
              </Badge>
            </div>
            <p className="text-sm text-neutral-600">
              {t("editEvent.lastSaved")}: 2 {t("editEvent.minutesAgo")}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigate("event-detail", event.id)}
          >
            <Eye size={16} className="mr-2" />
            {t("editEvent.previewEvent")}
          </Button>
        </div>

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertCircle className="text-amber-600" size={16} />
            <AlertDescription className="text-amber-800">
              {t("editEvent.unsavedChanges")}
            </AlertDescription>
          </Alert>
        )}

        {/* Form Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="basic">{t("editEvent.tabBasic")}</TabsTrigger>
            <TabsTrigger value="datetime">
              {t("editEvent.tabDateTime")}
            </TabsTrigger>
            <TabsTrigger value="location">
              {t("editEvent.tabLocation")}
            </TabsTrigger>
            <TabsTrigger value="tickets">
              {t("editEvent.tabTickets")}
            </TabsTrigger>
            <TabsTrigger value="media">{t("editEvent.tabMedia")}</TabsTrigger>
            <TabsTrigger value="settings">
              {t("editEvent.tabSettings")}
            </TabsTrigger>
          </TabsList>

          {/* Basic Information */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>{t("editEvent.basicInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="name">
                    {t("editEvent.eventName")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder={t("editEvent.eventNamePlaceholder")}
                  />
                </div>

                <div>
                  <Label htmlFor="description">
                    {t("editEvent.description")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder={t("editEvent.descriptionPlaceholder")}
                    rows={6}
                    maxLength={1000}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    {formData.description.length}/1000{" "}
                    {t("editEvent.charactersCount")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">{t("editEvent.category")}</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => handleInputChange("category", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Music">
                          {t("editEvent.categoryMusic")}
                        </SelectItem>
                        <SelectItem value="Sports">
                          {t("editEvent.categorySports")}
                        </SelectItem>
                        <SelectItem value="Arts">
                          {t("editEvent.categoryArts")}
                        </SelectItem>
                        <SelectItem value="Food">
                          {t("editEvent.categoryFood")}
                        </SelectItem>
                        <SelectItem value="Business">
                          {t("editEvent.categoryBusiness")}
                        </SelectItem>
                        <SelectItem value="Technology">
                          {t("editEvent.categoryTechnology")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t("editEvent.eventType")}</Label>
                    <Select
                      value={formData.eventType}
                      onValueChange={(v) => handleInputChange("eventType", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          {t("editEvent.typePublic")}
                        </SelectItem>
                        <SelectItem value="private">
                          {t("editEvent.typePrivate")}
                        </SelectItem>
                        <SelectItem value="invite">
                          {t("editEvent.typeInvite")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>{t("editEvent.tags")}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} className="bg-teal-100 text-teal-700">
                        {tag}
                      </Badge>
                    ))}
                    <Button variant="outline" size="sm">
                      <Plus size={14} className="mr-1" />
                      {t("editEvent.addTag")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Date & Time */}
          <TabsContent value="datetime">
            <Card>
              <CardHeader>
                <CardTitle>{t("editEvent.dateTimeInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="date">
                    {t("editEvent.eventDate")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">
                      {t("editEvent.startTime")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        handleInputChange("startTime", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="endTime">{t("editEvent.endTime")}</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        handleInputChange("endTime", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="timezone">{t("editEvent.timezone")}</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(v) => handleInputChange("timezone", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Ho_Chi_Minh">
                        {t("editEvent.timezoneHCM")}
                      </SelectItem>
                      <SelectItem value="Asia/Bangkok">
                        {t("editEvent.timezoneBangkok")}
                      </SelectItem>
                      <SelectItem value="Asia/Singapore">
                        {t("editEvent.timezoneSingapore")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="multiple-dates" />
                  <Label htmlFor="multiple-dates" className="text-sm">
                    {t("editEvent.multipleDates")}
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location */}
          <TabsContent value="location">
            <Card>
              <CardHeader>
                <CardTitle>{t("editEvent.locationInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>{t("editEvent.venueType")}</Label>
                  <Select
                    value={formData.venueType}
                    onValueChange={(v) => handleInputChange("venueType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">
                        {t("editEvent.venuePhysical")}
                      </SelectItem>
                      <SelectItem value="online">
                        {t("editEvent.venueOnline")}
                      </SelectItem>
                      <SelectItem value="hybrid">
                        {t("editEvent.venueHybrid")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.venueType === "physical" ||
                  formData.venueType === "hybrid") && (
                  <>
                    <div>
                      <Label htmlFor="venueName">
                        {t("editEvent.venueName")}
                      </Label>
                      <Input
                        id="venueName"
                        value={formData.venueName}
                        onChange={(e) =>
                          handleInputChange("venueName", e.target.value)
                        }
                        placeholder={t("editEvent.venueNamePlaceholder")}
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">{t("editEvent.address")}</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        placeholder={t("editEvent.addressPlaceholder")}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">{t("editEvent.city")}</Label>
                        <Select
                          value={formData.city}
                          onValueChange={(v) => handleInputChange("city", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ho Chi Minh City">
                              {t("editEvent.cityHCM")}
                            </SelectItem>
                            <SelectItem value="Hanoi">
                              {t("editEvent.cityHanoi")}
                            </SelectItem>
                            <SelectItem value="Da Nang">
                              {t("editEvent.cityDaNang")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="district">
                          {t("editEvent.district")}
                        </Label>
                        <Input
                          id="district"
                          value={formData.district}
                          onChange={(e) =>
                            handleInputChange("district", e.target.value)
                          }
                          placeholder={t("editEvent.districtPlaceholder")}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="mapsLink">
                        {t("editEvent.mapsLink")}
                      </Label>
                      <Input
                        id="mapsLink"
                        value={formData.mapsLink}
                        onChange={(e) =>
                          handleInputChange("mapsLink", e.target.value)
                        }
                        placeholder={t("editEvent.mapsLinkPlaceholder")}
                      />
                    </div>
                  </>
                )}

                {(formData.venueType === "online" ||
                  formData.venueType === "hybrid") && (
                  <div>
                    <Label htmlFor="onlineLink">
                      {t("editEvent.onlineLink")}
                    </Label>
                    <Input
                      id="onlineLink"
                      value={formData.onlineLink}
                      onChange={(e) =>
                        handleInputChange("onlineLink", e.target.value)
                      }
                      placeholder={t("editEvent.onlineLinkPlaceholder")}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t("editEvent.ticketConfig")}</CardTitle>
                  <div className="text-sm text-neutral-600">
                    {t("editEvent.totalCapacity")}:{" "}
                    <span className="text-teal-600">{totalCapacity}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticketTypes.map((ticket) => (
                  <Card key={ticket.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-3">
                          <Label>{t("editEvent.ticketName")}</Label>
                          <Input
                            value={ticket.name}
                            onChange={(e) =>
                              updateTicketType(
                                ticket.id,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder={t("editEvent.ticketNamePlaceholder")}
                          />
                        </div>
                        <div className="col-span-3">
                          <Label>{t("editEvent.ticketPrice")}</Label>
                          <Input
                            type="number"
                            value={ticket.price}
                            onChange={(e) =>
                              updateTicketType(
                                ticket.id,
                                "price",
                                Number(e.target.value)
                              )
                            }
                            placeholder={t("editEvent.ticketPricePlaceholder")}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>{t("editEvent.ticketQuantity")}</Label>
                          <Input
                            type="number"
                            value={ticket.quantity}
                            onChange={(e) =>
                              updateTicketType(
                                ticket.id,
                                "quantity",
                                Number(e.target.value)
                              )
                            }
                            placeholder={t(
                              "editEvent.ticketQuantityPlaceholder"
                            )}
                          />
                        </div>
                        <div className="col-span-3">
                          <Label>{t("editEvent.ticketDescription")}</Label>
                          <Input
                            value={ticket.description}
                            onChange={(e) =>
                              updateTicketType(
                                ticket.id,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder={t(
                              "editEvent.ticketDescriptionPlaceholder"
                            )}
                          />
                        </div>
                        <div className="col-span-1 flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTicketType(ticket.id)}
                            className="text-red-600 border-red-600"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  onClick={addTicketType}
                  variant="outline"
                  className="w-full border-dashed"
                >
                  <Plus size={16} className="mr-2" />
                  {t("editEvent.addTicketType")}
                </Button>

                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-2">
                    <Checkbox id="seat-selection" />
                    <Label htmlFor="seat-selection" className="text-sm">
                      {t("editEvent.enableSeatSelection")}
                    </Label>
                  </div>
                  {eventId && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => onNavigate("seat-map-builder", eventId)}
                    >
                      <Layout size={16} className="mr-2" />
                      {t("editEvent.manageSeatMap") || "Manage Seat Map"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Promo Codes */}
          <TabsContent value="promo">
            <Card>
              <CardHeader>
                <CardTitle>Promo Codes</CardTitle>
                <p className="text-sm text-neutral-600">
                  Select promo codes that can be applied to this event.
                  Customers will be able to use these codes during checkout.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {availablePromoCodes.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <Tag className="mx-auto mb-2" size={32} />
                    <p>No active promo codes available</p>
                    <p className="text-sm">
                      Create promo codes in the Promo Code Management section
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availablePromoCodes.map((code) => (
                      <div
                        key={code.promoCodeId}
                        className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                          selectedPromoCodes.includes(code.promoCodeId)
                            ? "border-teal-500 bg-teal-50"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                        onClick={() => handlePromoCodeToggle(code.promoCodeId)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-neutral-900">
                                {code.code}
                              </span>
                              {selectedPromoCodes.includes(
                                code.promoCodeId
                              ) && (
                                <span className="text-xs bg-teal-500 text-white px-2 py-1 rounded">
                                  Selected
                                </span>
                              )}
                            </div>
                            {code.description && (
                              <p className="text-sm text-neutral-600 mb-2">
                                {code.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-neutral-500">
                              {code.discountPercent && (
                                <span>{code.discountPercent}% off</span>
                              )}
                              {code.discountAmount && (
                                <span>
                                  {code.discountAmount.toLocaleString()} VND off
                                </span>
                              )}
                              {code.minimumPurchase && (
                                <span>
                                  Min: {code.minimumPurchase.toLocaleString()}{" "}
                                  VND
                                </span>
                              )}
                              <span>
                                Used: {code.currentUses}/{code.maxUses || "∞"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedPromoCodes.length > 0 && (
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-neutral-900 mb-2">
                      Selected Promo Codes ({selectedPromoCodes.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPromoCodes.map((id) => {
                        const code = availablePromoCodes.find(
                          (c) => c.promoCodeId === id
                        );
                        return code ? (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded"
                          >
                            {code.code}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePromoCodeToggle(id);
                              }}
                              className="ml-1 hover:text-teal-900"
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media */}
          <TabsContent value="media">
            <Card>
              <CardHeader>
                <CardTitle>{t("editEvent.imagesMedia")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>{t("editEvent.eventBanner")}</Label>
                  <div className="mt-2 border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors cursor-pointer">
                    <Upload
                      className="mx-auto text-neutral-400 mb-2"
                      size={40}
                    />
                    <p className="text-sm text-neutral-600">
                      {t("editEvent.uploadBanner")}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {t("editEvent.uploadBannerNote")}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>{t("editEvent.eventGallery")}</Label>
                  <div className="mt-2 grid grid-cols-4 gap-4">
                    {/* Preview existing images */}
                    <div className="aspect-square bg-neutral-200 rounded-lg overflow-hidden">
                      <img
                        src={event.image}
                        alt="Gallery"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Upload placeholder */}
                    <div className="aspect-square border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-teal-500">
                      <Plus className="text-neutral-400" size={24} />
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    {t("editEvent.maxImages")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>{t("editEvent.additionalSettings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="refundPolicy">
                    {t("editEvent.refundPolicy")}
                  </Label>
                  <Select
                    value={formData.refundPolicy}
                    onValueChange={(v) => handleInputChange("refundPolicy", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">
                        {t("editEvent.refundFull")}
                      </SelectItem>
                      <SelectItem value="partial">
                        {t("editEvent.refundPartial")}
                      </SelectItem>
                      <SelectItem value="none">
                        {t("editEvent.refundNone")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ageRestriction">
                    {t("editEvent.ageRestriction")}
                  </Label>
                  <Select
                    value={formData.ageRestriction}
                    onValueChange={(v) =>
                      handleInputChange("ageRestriction", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("editEvent.ageAll")}
                      </SelectItem>
                      <SelectItem value="18+">
                        {t("editEvent.age18")}
                      </SelectItem>
                      <SelectItem value="21+">
                        {t("editEvent.age21")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t("editEvent.accessibilityOptions")}</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Checkbox id="wheelchair" />
                      <Label htmlFor="wheelchair" className="text-sm">
                        {t("editEvent.wheelchair")}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="parking" />
                      <Label htmlFor="parking" className="text-sm">
                        {t("editEvent.parking")}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="transit" />
                      <Label htmlFor="transit" className="text-sm">
                        {t("editEvent.transit")}
                      </Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="terms">
                    {t("editEvent.termsConditions")}
                  </Label>
                  <Textarea
                    id="terms"
                    value={formData.terms}
                    onChange={(e) => handleInputChange("terms", e.target.value)}
                    placeholder={t("editEvent.termsPlaceholder")}
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="publish">
                      {t("editEvent.publishImmediately")}
                    </Label>
                    <p className="text-xs text-neutral-500">
                      {t("editEvent.publishNote")}
                    </p>
                  </div>
                  <Switch
                    id="publish"
                    checked={formData.publishImmediately}
                    onCheckedChange={(v) =>
                      handleInputChange("publishImmediately", v)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons (Sticky) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg py-4 z-10">
          <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <ChevronLeft size={16} className="mr-2" />
              {t("editEvent.cancel")}
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleSave(true)}
                disabled={isSaving}
              >
                {t("editEvent.saveAsDraft")}
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("event-detail", event.id)}
                disabled={isSaving}
              >
                <Eye size={16} className="mr-2" />
                {t("editEvent.preview")}
              </Button>
              <Button
                className="bg-teal-500 hover:bg-teal-600"
                onClick={() => handleSave(false)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {t("editEvent.saving")}
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {t("editEvent.savePublish")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Add spacing for sticky footer */}
        <div className="h-24" />
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editEvent.unsavedChangesTitle")}</DialogTitle>
            <DialogDescription>
              {t("editEvent.unsavedChangesMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              {t("editEvent.continueEditing")}
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={() => onNavigate("event-management")}
            >
              {t("editEvent.discardChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
