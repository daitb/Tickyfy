import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Upload,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Grid3x3,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { ProgressSteps } from "../components/ProgressSteps";
import { cities } from "../mockData";
import { eventService, type CreateEventDto } from "../services/eventService";
import { categoryService, type CategoryDto } from "../services/categoryService";
import { authService } from "../services/authService";
import { imageService } from "../services/imageService";
import { toast } from "sonner";
import type { Category, Event, TicketTier } from "../types";

interface OrganizerWizardProps {
  onNavigate: (page: string, eventId?: string) => void;
  eventId?: string; // For editing existing events
}

// Category translation mapping
const getCategoryTranslation = (
  categoryName: string,
  currentLang: string
): string => {
  const translations: Record<string, Record<string, string>> = {
    // English category names from database
    "Music & Concerts": { en: "Music & Concerts", vi: "Âm nhạc & Hòa nhạc" },
    "Sports & Fitness": { en: "Sports & Fitness", vi: "Thể thao & Thể hình" },
    "Arts & Culture": { en: "Arts & Culture", vi: "Nghệ thuật & Văn hóa" },
    "Food & Drink": { en: "Food & Drink", vi: "Ẩm thực" },
    "Business & Professional": {
      en: "Business & Professional",
      vi: "Kinh doanh & Chuyên nghiệp",
    },
    "Technology & Innovation": {
      en: "Technology & Innovation",
      vi: "Công nghệ & Đổi mới",
    },
    "Education & Learning": {
      en: "Education & Learning",
      vi: "Giáo dục & Học tập",
    },
    Entertainment: { en: "Entertainment", vi: "Giải trí" },
    "Health & Wellness": { en: "Health & Wellness", vi: "Sức khỏe & Chăm sóc" },
    Conference: { en: "Conference", vi: "Hội nghị" },
    Other: { en: "Other", vi: "Khác" },
    // Fallback for simple names
    Music: { en: "Music", vi: "Âm nhạc" },
    Sports: { en: "Sports", vi: "Thể thao" },
    Business: { en: "Business", vi: "Kinh doanh" },
    Technology: { en: "Technology", vi: "Công nghệ" },
    Education: { en: "Education", vi: "Giáo dục" },
    // Vietnamese category names (if already translated in database)
    "Nghệ thuật & Văn hóa": {
      en: "Arts & Culture",
      vi: "Nghệ thuật & Văn hóa",
    },
    "Giải trí": { en: "Entertainment", vi: "Giải trí" },
    "Ẩm thực": { en: "Food & Drink", vi: "Ẩm thực" },
  };

  return translations[categoryName]?.[currentLang] || categoryName;
};

export function OrganizerWizard({ onNavigate, eventId }: OrganizerWizardProps) {
  const { t, i18n } = useTranslation();
  // Restore step from sessionStorage when returning from seat map builder
  const [currentStep, setCurrentStep] = useState(() => {
    if (eventId) {
      const savedStep = sessionStorage.getItem(`wizard-step-${eventId}`);
      if (savedStep) {
        sessionStorage.removeItem(`wizard-step-${eventId}`);
        return parseInt(savedStep, 10);
      }
    }
    return 1;
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [eventData, setEventData] = useState<Partial<Event>>({
    category: "Music",
    ticketTiers: [],
    policies: {
      refundable: true,
      transferable: true,
    },
  });
  const isEditMode = Boolean(eventId);

  const [ticketTiers, setTicketTiers] = useState<Partial<TicketTier>[]>([
    { name: "", price: 0, total: 100, description: "" },
  ]);

  // Image upload states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Organizer context
  const organizerId = authService.getCurrentOrganizerId();

  // Get today's date in YYYY-MM-DD format for date input min attribute
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Get tomorrow's date (minimum allowed event date)
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  // Load categories and seat map templates on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await categoryService.getCategories();
        setCategories(cats);
        // Set first category as default if available
        if (cats.length > 0 && !eventData.category) {
          setEventData((prev) => ({
            ...prev,
            category: cats[0].categoryName as any,
          }));
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };

    loadCategories();
  }, []);

  // Load event data when in edit mode
  useEffect(() => {
    const loadEventData = async () => {
      if (!eventId) return;

      setIsLoadingEvent(true);
      try {
        const event = await eventService.getEventById(Number(eventId));

        // Parse date and time from event.date (ISO string)
        const eventDate = new Date(event.date);
        const dateStr = eventDate.toISOString().split("T")[0]; // YYYY-MM-DD
        const timeStr = eventDate.toTimeString().slice(0, 5); // HH:MM

        // Populate form with existing event data
        setEventData((prev) => ({
          ...prev,
          title: event.title,
          category: event.category,
          venue: event.venue,
          date: dateStr,
          time: timeStr,
          description: event.fullDescription || event.description,
          image: event.image,
          organizerId: event.organizerId,
          policies: event.policies || {
            refundable: true,
            transferable: true,
          },
        }));

        // Populate ticket tiers
        if (event.ticketTiers && event.ticketTiers.length > 0) {
          setTicketTiers(
            event.ticketTiers.map((tier) => ({
              id: tier.id,
              name: tier.name,
              price: tier.price,
              total: tier.total,
              available: tier.available,
              description: tier.description,
            }))
          );
        }

        // Set image preview if exists
        if (event.image) {
          setImagePreview(event.image);
          setUploadedImageUrl(event.image);
        }

        toast.success(
          t("wizard.organizer.loadEventSuccess") || "Event loaded successfully"
        );
      } catch (error) {
        console.error("Error loading event:", error);
        toast.error(
          t("wizard.organizer.loadEventError") || "Failed to load event data"
        );
        onNavigate("event-management"); // Go back if can't load
      } finally {
        setIsLoadingEvent(false);
      }
    };

    loadEventData();
  }, [eventId]);

  const steps = [
    { number: 1, label: t("wizard.organizer.stepLabel1") },
    { number: 2, label: t("wizard.organizer.stepLabel2") },
    { number: 3, label: t("wizard.organizer.stepLabel3") },
    { number: 4, label: t("wizard.organizer.stepLabel4") },
    { number: 5, label: t("wizard.organizer.stepLabel5") },
  ];

  const handleInputChange = (field: string, value: any) => {
    setEventData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTier = () => {
    setTicketTiers([
      ...ticketTiers,
      { name: "", price: 0, total: 100, description: "" },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    setTicketTiers(ticketTiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: string, value: any) => {
    const newTiers = [...ticketTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTicketTiers(newTiers);
  };

  // Handle image file selection and auto-upload
  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate file
    const validationError = imageService.validateImageFile(file);
    if (validationError) {
      const errorMessage = String(
        t(validationError.key, validationError.params)
      );
      setUploadError(errorMessage);
      toast.error(t("wizard.organizer.imageUploadError") as string, {
        description: errorMessage,
        duration: 3000,
        closeButton: false,
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-upload immediately after selection
    await handleImageUpload(file);
  };

  // Upload image to Azure Storage
  const handleImageUpload = async (fileToUpload?: File) => {
    const imageToUpload = fileToUpload || selectedImage;

    if (!imageToUpload) {
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadError(null);

      const response = await imageService.uploadImage(imageToUpload);

      setUploadedImageUrl(response.imageUrl);
      handleInputChange("image", response.imageUrl);

      // Silent success - no toast notification
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to upload image";
      console.error("[OrganizerWizard] Upload error:", errorMsg);
      setUploadError(errorMsg);

      // Reset on error
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.error(`Tải ảnh thất bại: ${errorMsg}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    setUploadError(null);
    handleInputChange("image", undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);

      // Validate required fields
      if (
        !eventData.title ||
        !eventData.description ||
        !eventData.venue ||
        !eventData.date ||
        !eventData.time
      ) {
        toast.error(t("wizard.organizer.validation.missingFields"), {
          description: t("wizard.organizer.validation.missingFieldsDesc"),
          duration: 2000,
          closeButton: false,
        });
        return;
      }

      // Validate field lengths
      if (eventData.title.length < 5) {
        toast.error(t("wizard.organizer.validation.titleTooShort"), {
          description: t("wizard.organizer.validation.titleTooShortDesc"),
          duration: 2000,
          closeButton: false,
        });
        return;
      }
      if (eventData.description.length < 50) {
        toast.error(t("wizard.organizer.validation.descriptionTooShort"), {
          description: t("wizard.organizer.validation.descriptionTooShortDesc"),
          duration: 2000,
          closeButton: false,
        });
        return;
      }
      if (eventData.venue.length < 5) {
        toast.error(t("wizard.organizer.validation.venueTooShort"), {
          description: t("wizard.organizer.validation.venueTooShortDesc"),
          duration: 2000,
          closeButton: false,
        });
        return;
      }

      // ===== STRICT DATE/TIME VALIDATION =====
      const now = new Date();
      const selectedDate = new Date(eventData.date);
      const selectedDateTime = new Date(
        `${eventData.date}T${eventData.time}:00`
      );

      // Check if date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDateOnly = new Date(eventData.date);
      eventDateOnly.setHours(0, 0, 0, 0);

      if (eventDateOnly < today) {
        toast.error(t("wizard.organizer.validation.datePast"), {
          description: t("wizard.organizer.validation.datePastDesc"),
          duration: 3000,
          closeButton: false,
        });
        return;
      }

      // Check if event is at least 24 hours in the future
      const minDateTime = new Date();
      minDateTime.setHours(minDateTime.getHours() + 24);

      if (selectedDateTime < minDateTime) {
        toast.error(t("wizard.organizer.validation.eventTooSoon"), {
          description: t("wizard.organizer.validation.eventTooSoonDesc"),
          duration: 3000,
          closeButton: false,
        });
        return;
      }

      // Check if selected time has already passed today
      if (eventDateOnly.getTime() === today.getTime()) {
        const currentTime = getCurrentTime();
        if (eventData.time <= currentTime) {
          toast.error(t("wizard.organizer.validation.timePast"), {
            description: t("wizard.organizer.validation.timePastDesc"),
            duration: 3000,
            closeButton: false,
          });
          return;
        }
      }

      // Validate that event has at least one ticket tier
      if (ticketTiers.length === 0 || !ticketTiers[0].name) {
        toast.error(t("wizard.organizer.validation.missingTiers"), {
          description: t("wizard.organizer.validation.missingTiersDesc"),
          duration: 2000,
          closeButton: false,
        });
        return;
      }

      // Validate ticket tier prices and quantities
      const MAX_TIER_PRICE = 50_000_000;
      for (let i = 0; i < ticketTiers.length; i++) {
        const tier = ticketTiers[i];
        if (!tier.price || tier.price <= 0) {
          toast.error(t("wizard.organizer.validation.tierPriceInvalid"), {
            description: t("wizard.organizer.validation.tierPriceInvalidDesc"),
            duration: 2000,
            closeButton: false,
          });
          return;
        }
        if (tier.price > MAX_TIER_PRICE) {
          toast.error("Giá vé vượt quá giới hạn", {
            description: `Giá vé "${
              tier.name
            }" không được vượt quá ${MAX_TIER_PRICE.toLocaleString()} VND (Giới hạn cổng thanh toán MoMo: 50 triệu VND/giao dịch)`,
            duration: 3000,
            closeButton: false,
          });
          return;
        }
        if (!tier.total || tier.total <= 0) {
          toast.error(t("wizard.organizer.validation.tierQuantityInvalid"), {
            description: t(
              "wizard.organizer.validation.tierQuantityInvalidDesc"
            ),
            duration: 2000,
            closeButton: false,
          });
          return;
        }
      }

      // Combine date and time
      const eventDate = eventData.date || "";
      const eventTime = eventData.time || "00:00";
      const startDateTime = `${eventDate}T${eventTime}:00`;
      const endDateTime = `${eventDate}T23:59:00`; // Default end time

      // Map category name to categoryId
      const selectedCategory = categories.find(
        (c) => c.categoryName === eventData.category
      );
      const categoryId = selectedCategory?.categoryId || 1; // Fallback to 1 if not found

      if (isEditMode && eventId) {
        // UPDATE existing event
        const updateEventDto = {
          categoryId: categoryId,
          title: eventData.title,
          description: eventData.description,
          venue: eventData.venue,
          imageUrl: eventData.image,
          startDate: startDateTime,
          endDate: endDateTime,
          totalSeats: ticketTiers.reduce(
            (sum, tier) => sum + (tier.total || 0),
            0
          ),
          isFeatured: false,
          allowTransfer: eventData.policies?.transferable ?? false,
          allowRefund: eventData.policies?.refundable ?? false,
        };

        const updatedEvent = await eventService.updateEvent(
          Number(eventId),
          updateEventDto
        );

        toast.success(
          t("wizard.organizer.eventUpdated") ||
            `Event "${updatedEvent.title}" updated successfully!`,
          {
            description:
              t("wizard.organizer.eventUpdatedDesc") ||
              "Your changes have been saved.",
            duration: 2000,
            closeButton: false,
          }
        );
        onNavigate("event-management");
      } else {
        // CREATE new event
        const createEventDto: CreateEventDto = {
          organizerId: organizerId!,
          categoryId: categoryId,
          title: eventData.title,
          description: eventData.description,
          venue: eventData.venue,
          imageUrl: eventData.image,
          startDate: startDateTime,
          endDate: endDateTime,
          totalSeats: ticketTiers.reduce(
            (sum, tier) => sum + (tier.total || 0),
            0
          ),
          isFeatured: false,
          allowTransfer: eventData.policies?.transferable ?? false,
          allowRefund: eventData.policies?.refundable ?? false,
          ticketTypes: ticketTiers.map((tier) => ({
            typeName: tier.name || "General",
            price: tier.price || 0,
            quantity: tier.total || 0,
            description: tier.description,
          })),
        };

        const createdEvent = await eventService.createEvent(createEventDto);

        toast.success(
          t("wizard.organizer.eventCreated") ||
            `Event "${createdEvent.title}" created successfully!`,
          {
            description:
              t("wizard.organizer.eventCreatedDesc") ||
              "Now you can set up seat map for this event.",
            duration: 3000,
            closeButton: false,
          }
        );

        // Navigate to seat map setup after creating event
        // createdEvent.id is a string (mapped from eventId)
        if (createdEvent.id) {
          onNavigate("edit-seat-map", createdEvent.id);
        } else {
          onNavigate("event-management");
        }
      }
    } catch (error: any) {
      // Extract detailed error messages from backend validation
      let errorMessage = "Please check your inputs.";
      let errorTitle = "Failed to create event";

      if (error.response?.data) {
        const data = error.response.data;
        // If backend returns validation errors array
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.join("\n");
          errorTitle = "Validation errors";
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorTitle, {
        description: errorMessage,
        duration: 4000,
        closeButton: false,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (!organizerId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white rounded-2xl p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold mb-3">
            {t("organizer.accessRequiredTitle", "Organizer access required")}
          </h1>
          <p className="text-neutral-600 mb-6">
            {t(
              "organizer.accessRequiredDescription",
              "You need an approved organizer profile before creating events."
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => onNavigate("home")}
              className="flex-1"
            >
              {t("common.back")}
            </Button>
            <Button
              onClick={() => onNavigate("become-organizer")}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {t("organizer.becomeOrganizer")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state when loading event data
  if (isLoadingEvent) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center py-20">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-purple-600" />
          <p className="text-lg text-neutral-600">
            {t("wizard.organizer.loadingEvent") || "Loading event data..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => onNavigate("home")}
            className="mb-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            {t("wizard.organizer.previous")}
          </Button>
          <h1>
            {isEditMode
              ? t("wizard.organizer.editTitle") || "Edit Event"
              : t("wizard.organizer.title")}
          </h1>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <div className="bg-white rounded-2xl p-8 mt-8">
          {/* Step 1: Basics */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="mb-6">{t("wizard.organizer.eventBasics")}</h3>

              <div>
                <Label htmlFor="title">
                  {t("wizard.organizer.eventTitle")}
                </Label>
                <Input
                  id="title"
                  placeholder={t("wizard.organizer.eventTitlePlaceholder")}
                  value={eventData.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="slug">{t("wizard.organizer.urlSlug")}</Label>
                <Input
                  id="slug"
                  placeholder={t("wizard.organizer.urlSlugPlaceholder")}
                  value={eventData.slug || ""}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {t("wizard.organizer.urlSlugHint")}
                  {eventData.slug || "your-event"}
                </p>
              </div>

              <div>
                <Label htmlFor="category">
                  {t("wizard.organizer.category")}
                </Label>
                <Select
                  value={eventData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value as Category)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.categoryId} value={cat.categoryName}>
                        {getCategoryTranslation(
                          cat.categoryName,
                          i18n.language
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">
                  {t("wizard.organizer.description")}
                </Label>
                <Textarea
                  id="description"
                  placeholder={t("wizard.organizer.descriptionPlaceholder")}
                  value={eventData.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="mt-1 min-h-[120px]"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {eventData.description?.length || 0} / 50{" "}
                  {t("wizard.organizer.descriptionHint")}
                </p>
              </div>

              <div>
                <Label>{t("wizard.organizer.eventImage")}</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />

                {!imagePreview ? (
                  <label
                    htmlFor="image-upload"
                    className="mt-1 border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-orange-500 transition-colors cursor-pointer flex flex-col items-center block"
                  >
                    <Upload
                      className="mx-auto text-neutral-400 mb-2"
                      size={32}
                    />
                    <p className="text-sm text-neutral-600">
                      {t("wizard.organizer.clickToUpload")}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {t("wizard.organizer.imageFormats")}
                    </p>
                  </label>
                ) : (
                  <div className="mt-1 border-2 border-neutral-300 rounded-xl p-4">
                    {/* Loading Overlay */}
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center z-10">
                        <div className="text-center">
                          <Loader2
                            className="animate-spin mx-auto text-orange-500"
                            size={40}
                          />
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      {!isUploadingImage && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-all shadow-lg hover:scale-110 z-10 border-2 border-white"
                          title={t("wizard.organizer.removeImage")}
                        >
                          <X size={25} />
                        </button>
                      )}
                    </div>

                    {uploadError && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle
                          className="text-red-500 flex-shrink-0 mt-0.5"
                          size={16}
                        />
                        <div className="flex-1">
                          <p className="text-sm text-red-700 font-medium">
                            {t("wizard.organizer.uploadFailed")}
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            {uploadError}
                          </p>
                        </div>
                      </div>
                    )}

                    {uploadedImageUrl && !isUploadingImage && (
                      <div className="mt-4">
                        <label
                          htmlFor="image-upload"
                          className="w-full px-4 py-2 border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 cursor-pointer flex items-center justify-center transition-colors font-medium"
                        >
                          <Upload size={16} className="mr-2" />
                          {t("wizard.organizer.changeImage")}
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Schedule & Venue */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="mb-6">{t("wizard.organizer.scheduleVenue")}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">
                    {t("wizard.organizer.eventDate")}
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    min={getTomorrowDate()}
                    value={eventData.date || ""}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    {t("wizard.organizer.eventDateHint")}
                  </p>
                </div>

                <div>
                  <Label htmlFor="time">
                    {t("wizard.organizer.startTime")}
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="time"
                      type="time"
                      value={eventData.time || ""}
                      onChange={(e) =>
                        handleInputChange("time", e.target.value)
                      }
                      className="pr-10"
                    />
                    <Clock
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                      size={16}
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {t("wizard.organizer.startTimeHint")}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="venue">{t("wizard.organizer.venueName")}</Label>
                <Input
                  id="venue"
                  placeholder={t("wizard.organizer.venueNamePlaceholder")}
                  value={eventData.venue || ""}
                  onChange={(e) => handleInputChange("venue", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Step 3: Ticketing */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3>Ticket Tiers</h3>
                <Button onClick={handleAddTier} variant="outline" size="sm">
                  <Plus size={16} className="mr-2" />
                  {t("wizard.organizer.addTier")}
                </Button>
              </div>

              <div className="space-y-4">
                {ticketTiers.map((tier, index) => (
                  <div
                    key={index}
                    className="border border-neutral-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4>
                        {t("wizard.organizer.tierNumber")} {index + 1}
                      </h4>
                      {ticketTiers.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTier(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>{t("wizard.organizer.tierName")}</Label>
                        <Input
                          placeholder={t(
                            "wizard.organizer.tierNamePlaceholder"
                          )}
                          value={tier.name || ""}
                          onChange={(e) =>
                            handleTierChange(index, "name", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>{t("wizard.organizer.tierPrice")}</Label>
                        <Input
                          type="number"
                          placeholder={t(
                            "wizard.organizer.tierPricePlaceholder"
                          )}
                          value={tier.price || ""}
                          onChange={(e) =>
                            handleTierChange(
                              index,
                              "price",
                              parseInt(e.target.value)
                            )
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>{t("wizard.organizer.totalTickets")}</Label>
                        <Input
                          type="number"
                          placeholder={t(
                            "wizard.organizer.totalTicketsPlaceholder"
                          )}
                          value={tier.total || ""}
                          onChange={(e) =>
                            handleTierChange(
                              index,
                              "total",
                              parseInt(e.target.value)
                            )
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>{t("wizard.organizer.tierDescription")}</Label>
                        <Input
                          placeholder={t(
                            "wizard.organizer.tierDescriptionPlaceholder"
                          )}
                          value={tier.description || ""}
                          onChange={(e) =>
                            handleTierChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Seat Map Setup Button */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-neutral-900 font-medium mb-1">
                      {t("wizard.organizer.seatMapSetupTitle")}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {isEditMode
                        ? t("wizard.organizer.seatMapSetupDescEdit")
                        : t("wizard.organizer.seatMapSetupDescCreate")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={async () => {
                      if (isEditMode && eventId) {
                        // Save current step before navigating to seat map
                        sessionStorage.setItem(
                          `wizard-step-${eventId}`,
                          currentStep.toString()
                        );
                        // Edit mode: navigate directly to seat map
                        onNavigate("edit-seat-map", eventId);
                      } else {
                        // Create mode: save event first, then navigate
                        await handlePublish();
                      }
                    }}
                    disabled={isPublishing}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        {t("wizard.organizer.saving", "Đang lưu...")}
                      </>
                    ) : (
                      <>
                        <Grid3x3 size={18} className="mr-2" />
                        {t("wizard.organizer.setupSeatsButton")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Policies */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="mb-6">{t("wizard.organizer.ticketPolicies")}</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl">
                  <div>
                    <div className="text-neutral-900">
                      {t("wizard.organizer.refundableTickets")}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {t("wizard.organizer.refundableTicketsDesc")}
                    </div>
                  </div>
                  <Switch
                    checked={eventData.policies?.refundable || false}
                    onCheckedChange={(checked) =>
                      setEventData((prev) => ({
                        ...prev,
                        policies: {
                          refundable: checked,
                          transferable: prev.policies?.transferable || false,
                          refundDeadline: prev.policies?.refundDeadline,
                        },
                      }))
                    }
                  />
                </div>

                {eventData.policies?.refundable && (
                  <div className="ml-4">
                    <Label>{t("wizard.organizer.refundDeadline")}</Label>
                    <Input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      max={
                        eventData.date
                          ? new Date(
                              new Date(eventData.date).getTime() -
                                5 * 24 * 60 * 60 * 1000
                            )
                              .toISOString()
                              .split("T")[0]
                          : undefined
                      }
                      value={eventData.policies?.refundDeadline || ""}
                      onChange={(e) =>
                        setEventData((prev) => ({
                          ...prev,
                          policies: {
                            refundable: prev.policies?.refundable || false,
                            transferable: prev.policies?.transferable || false,
                            refundDeadline: e.target.value,
                          },
                        }))
                      }
                      className="mt-1"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      {t("wizard.organizer.refundDeadlineHint")}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl">
                  <div>
                    <div className="text-neutral-900">
                      {t("wizard.organizer.transferableTickets")}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {t("wizard.organizer.transferableTicketsDesc")}
                    </div>
                  </div>
                  <Switch
                    checked={eventData.policies?.transferable || false}
                    onCheckedChange={(checked) =>
                      setEventData((prev) => ({
                        ...prev,
                        policies: {
                          refundable: prev.policies?.refundable || false,
                          transferable: checked,
                          refundDeadline: prev.policies?.refundDeadline,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="mb-6">{t("wizard.organizer.reviewPublish")}</h3>

              <div className="space-y-4">
                <div className="bg-neutral-50 rounded-xl p-4">
                  <h4 className="mb-3">{t("wizard.organizer.eventDetails")}</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">
                        {t("wizard.organizer.titleLabel")}
                      </dt>
                      <dd className="text-neutral-900">{eventData.title}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">
                        {t("wizard.organizer.categoryLabel")}
                      </dt>
                      <dd className="text-neutral-900">
                        {eventData.category
                          ? getCategoryTranslation(
                              eventData.category,
                              i18n.language
                            )
                          : ""}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">
                        {t("wizard.organizer.dateLabel")}
                      </dt>
                      <dd className="text-neutral-900">
                        {eventData.date} {t("wizard.organizer.at")}{" "}
                        {eventData.time}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">
                        {t("wizard.organizer.venueLabel")}
                      </dt>
                      <dd className="text-neutral-900">{eventData.venue}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-neutral-50 rounded-xl p-4">
                  <h4 className="mb-3">
                    {t("wizard.organizer.ticketTiersCount")} (
                    {ticketTiers.length})
                  </h4>
                  <div className="space-y-2">
                    {ticketTiers.map((tier, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span className="text-neutral-900">{tier.name}</span>
                        <span className="text-neutral-600">
                          {(tier.price || 0).toLocaleString()} VND ×{" "}
                          {tier.total}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-xl p-4">
                  <h4 className="mb-3">{t("wizard.organizer.policies")}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          eventData.policies?.refundable
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span className="text-neutral-900">
                        {eventData.policies?.refundable
                          ? t("wizard.organizer.refundable")
                          : t("wizard.organizer.nonRefundable")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          eventData.policies?.transferable
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span className="text-neutral-900">
                        {eventData.policies?.transferable
                          ? t("wizard.organizer.transferable")
                          : t("wizard.organizer.nonTransferable")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                {t("wizard.organizer.previous")}
              </Button>
            )}
            {currentStep < 5 ? (
              <Button
                onClick={handleNext}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {t("wizard.organizer.next")}
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    {isEditMode
                      ? t("wizard.organizer.updatingEvent") || "Updating..."
                      : t("wizard.organizer.publishingEvent")}
                  </>
                ) : isEditMode ? (
                  t("wizard.organizer.updateEvent") || "Update Event"
                ) : (
                  t("wizard.organizer.publish")
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
