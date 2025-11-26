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
import type { Category, Event, TicketTier } from "../types";

interface OrganizerWizardProps {
  onNavigate: (page: string) => void;
}

export function OrganizerWizard({ onNavigate }: OrganizerWizardProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [eventData, setEventData] = useState<Partial<Event>>({
    category: "Music",
    city: cities[0],
    ticketTiers: [],
    promoCodes: [],
    policies: {
      refundable: true,
      transferable: true,
    },
  });

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

  // Load categories on mount
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

  const steps = [
    { number: 1, label: "Basics" },
    { number: 2, label: "Schedule & Venue" },
    { number: 3, label: "Ticketing" },
    { number: 4, label: "Promo Codes" },
    { number: 5, label: "Policies" },
    { number: 6, label: "Review" },
  ];

  const handleInputChange = (field: string, value: any) => {
    setEventData({ ...eventData, [field]: value });
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

    console.log("[OrganizerWizard] Image selected:", file.name);
    setUploadError(null);

    // Validate file
    const validationError = imageService.validateImageFile(file);
    if (validationError) {
      console.error("[OrganizerWizard] Validation failed:", validationError);
      setUploadError(validationError);
      alert(validationError);
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
      console.log("[OrganizerWizard] Preview created");
    };
    reader.readAsDataURL(file);

    // Auto-upload immediately after selection
    await handleImageUpload(file);
  };

  // Upload image to Azure Storage
  const handleImageUpload = async (fileToUpload?: File) => {
    const imageToUpload = fileToUpload || selectedImage;

    if (!imageToUpload) {
      console.warn("[OrganizerWizard] No image to upload");
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadError(null);
      console.log("[OrganizerWizard] Auto-uploading to Azure Storage...");

      const response = await imageService.uploadImage(imageToUpload);

      setUploadedImageUrl(response.imageUrl);
      handleInputChange("image", response.imageUrl);

      console.log("[OrganizerWizard] Upload successful!", {
        imageUrl: response.imageUrl,
        blobName: response.blobName,
      });

      // Success notification (subtle, không dùng alert để không làm gián đoạn UX)
      console.log("Image uploaded successfully to Azure Storage!");
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

      alert(`Upload failed: ${errorMsg}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    console.log("[OrganizerWizard] Removing image");
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
    if (currentStep < 6) {
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
        alert("Please fill in all required fields");
        return;
      }

      // Validate field lengths
      if (eventData.title.length < 5) {
        alert("Event title must be at least 5 characters long");
        return;
      }
      if (eventData.description.length < 50) {
        alert("Event description must be at least 50 characters long");
        return;
      }
      if (eventData.venue.length < 5) {
        alert("Venue must be at least 5 characters long");
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
        alert("Event date cannot be in the past. Please select a future date.");
        return;
      }

      // Check if event is at least 24 hours in the future
      const minDateTime = new Date();
      minDateTime.setHours(minDateTime.getHours() + 24);

      if (selectedDateTime < minDateTime) {
        alert(
          "Event must be scheduled at least 24 hours in advance.\n\nPlease select a date and time that is at least 1 day from now."
        );
        return;
      }

      // Check if selected time has already passed today
      if (eventDateOnly.getTime() === today.getTime()) {
        const currentTime = getCurrentTime();
        if (eventData.time <= currentTime) {
          alert(
            `Event time cannot be in the past.\n\nCurrent time: ${currentTime}\nSelected time: ${eventData.time}\n\nPlease select a future time or a future date.`
          );
          return;
        }
      }

      // Validate that event has at least one ticket tier
      if (ticketTiers.length === 0 || !ticketTiers[0].name) {
        alert("Please add at least one ticket tier before publishing.");
        return;
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

      // Prepare event data
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
        ticketTypes: ticketTiers.map((tier) => ({
          typeName: tier.name || "General",
          price: tier.price || 0,
          quantity: tier.total || 0,
          description: tier.description,
        })),
      };

      console.log("Creating event with data:", createEventDto);

      // POST /api/events - Create event
      const createdEvent = await eventService.createEvent(createEventDto);

      alert(
        `Event "${createdEvent.title}" created successfully! It will be reviewed by admin.`
      );
      onNavigate("organizer-dashboard");
    } catch (error: any) {
      console.error("Error creating event:", error);
      console.error("Error response data:", error.response?.data);

      // Extract detailed error messages from backend validation
      let errorMessage = "Failed to create event. Please check your inputs.";

      if (error.response?.data) {
        const data = error.response.data;
        // If backend returns validation errors array
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = "Validation errors:\n" + data.errors.join("\n");
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
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
            Back
          </Button>
          <h1>Create New Event</h1>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <div className="bg-white rounded-2xl p-8 mt-8">
          {/* Step 1: Basics */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="mb-6">Event Basics</h3>

              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Summer Music Festival 2025"
                  value={eventData.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  placeholder="summer-music-festival-2025"
                  value={eventData.slug || ""}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  tickify.vn/events/{eventData.slug || "your-event"}
                </p>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
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
                        {cat.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">
                  Description * (minimum 50 characters)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event in detail... (minimum 50 characters required)"
                  value={eventData.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="mt-1 min-h-[120px]"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {eventData.description?.length || 0} / 50 characters minimum
                </p>
              </div>

              <div>
                <Label>Event Image</Label>
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
                      Click to upload image
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      PNG, JPG, GIF, WebP up to 5MB
                    </p>
                  </label>
                ) : (
                  <div className="mt-1 border-2 border-neutral-300 rounded-xl p-4">
                    {/* Loading Overlay */}
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center z-10">
                        <div className="text-center">
                          <Loader2
                            className="animate-spin mx-auto text-orange-500 mb-2"
                            size={40}
                          />
                          <p className="text-sm text-neutral-700 font-medium">
                            Uploading to Azure Storage...
                          </p>
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
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                          title="Remove image"
                        >
                          <X size={16} />
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
                            Upload Failed
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            {uploadError}
                          </p>
                        </div>
                      </div>
                    )}

                    {uploadedImageUrl && !isUploadingImage && (
                      <div className="mt-4 space-y-3">
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700 flex items-center gap-2">
                            <CheckCircle size={16} className="flex-shrink-0" />
                            <span className="font-medium">
                              Uploaded to Azure Storage
                            </span>
                          </p>
                          <p className="text-xs text-green-600 mt-1 break-all">
                            {uploadedImageUrl}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <label
                            htmlFor="image-upload"
                            className="flex-1 px-4 py-2 border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 cursor-pointer flex items-center justify-center transition-colors font-medium"
                          >
                            <Upload size={16} className="mr-2" />
                            Change Image
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                          >
                            <X size={16} className="inline mr-1" />
                            Remove
                          </button>
                        </div>
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
              <h3 className="mb-6">Schedule & Venue</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Event Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    min={getTomorrowDate()}
                    value={eventData.date || ""}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Event must be at least 24 hours in the future
                  </p>
                </div>

                <div>
                  <Label htmlFor="time">Start Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={eventData.time || ""}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Time must be in the future if event is today
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="venue">Venue Name *</Label>
                <Input
                  id="venue"
                  placeholder="e.g., Phu Tho Stadium"
                  value={eventData.venue || ""}
                  onChange={(e) => handleInputChange("venue", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="city">City *</Label>
                <Select
                  value={eventData.city}
                  onValueChange={(value) => handleInputChange("city", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  Add Tier
                </Button>
              </div>

              <div className="space-y-4">
                {ticketTiers.map((tier, index) => (
                  <div
                    key={index}
                    className="border border-neutral-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4>Tier {index + 1}</h4>
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
                        <Label>Tier Name *</Label>
                        <Input
                          placeholder="e.g., General Admission"
                          value={tier.name || ""}
                          onChange={(e) =>
                            handleTierChange(index, "name", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Price (VND) *</Label>
                        <Input
                          type="number"
                          placeholder="500000"
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
                        <Label>Total Tickets *</Label>
                        <Input
                          type="number"
                          placeholder="100"
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
                        <Label>Description</Label>
                        <Input
                          placeholder="Brief description"
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
            </div>
          )}

          {/* Step 4: Promo Codes */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="mb-6">Promo Codes</h3>

              <div className="space-y-4">
                <p className="text-sm text-neutral-600">
                  Select promo codes that can be applied to this event.
                  Customers will be able to use these codes during checkout.
                </p>

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
                            ? "border-orange-500 bg-orange-50"
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
                                <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">
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
                            className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded"
                          >
                            {code.code}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePromoCodeToggle(id);
                              }}
                              className="ml-1 hover:text-orange-900"
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Policies */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="mb-6">Ticket Policies</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl">
                  <div>
                    <div className="text-neutral-900">Refundable Tickets</div>
                    <div className="text-sm text-neutral-500">
                      Allow customers to request refunds
                    </div>
                  </div>
                  <Switch
                    checked={eventData.policies?.refundable || false}
                    onCheckedChange={(checked) =>
                      handleInputChange("policies", {
                        ...eventData.policies,
                        refundable: checked,
                      })
                    }
                  />
                </div>

                {eventData.policies?.refundable && (
                  <div className="ml-4">
                    <Label>Refund Deadline</Label>
                    <Input
                      type="date"
                      value={eventData.policies?.refundDeadline || ""}
                      onChange={(e) =>
                        handleInputChange("policies", {
                          ...eventData.policies,
                          refundDeadline: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl">
                  <div>
                    <div className="text-neutral-900">Transferable Tickets</div>
                    <div className="text-sm text-neutral-500">
                      Allow customers to transfer tickets to others
                    </div>
                  </div>
                  <Switch
                    checked={eventData.policies?.transferable || false}
                    onCheckedChange={(checked) =>
                      handleInputChange("policies", {
                        ...eventData.policies,
                        transferable: checked,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h3 className="mb-6">Review & Publish</h3>

              <div className="space-y-4">
                <div className="bg-neutral-50 rounded-xl p-4">
                  <h4 className="mb-3">Event Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Title:</dt>
                      <dd className="text-neutral-900">{eventData.title}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Category:</dt>
                      <dd className="text-neutral-900">{eventData.category}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Date:</dt>
                      <dd className="text-neutral-900">
                        {eventData.date} at {eventData.time}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Venue:</dt>
                      <dd className="text-neutral-900">
                        {eventData.venue}, {eventData.city}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-neutral-50 rounded-xl p-4">
                  <h4 className="mb-3">Ticket Tiers ({ticketTiers.length})</h4>
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
                  <h4 className="mb-3">
                    Promo Codes ({selectedPromoCodes.length})
                  </h4>
                  {selectedPromoCodes.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      No promo codes selected
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedPromoCodes.map((id) => {
                        const code = availablePromoCodes.find(
                          (c) => c.promoCodeId === id
                        );
                        return code ? (
                          <div
                            key={id}
                            className="text-sm flex justify-between items-center"
                          >
                            <span className="text-neutral-900">
                              {code.code}
                            </span>
                            <span className="text-neutral-600">
                              {code.discountPercent
                                ? `${code.discountPercent}% off`
                                : `${code.discountAmount?.toLocaleString()} VND off`}
                            </span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-neutral-50 rounded-xl p-4">
                  <h4 className="mb-3">Policies</h4>
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
                          ? "Refundable"
                          : "Non-refundable"}
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
                          ? "Transferable"
                          : "Non-transferable"}
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
                Back
              </Button>
            )}
            {currentStep < 6 ? (
              <Button
                onClick={handleNext}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Continue
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
                    Publishing...
                  </>
                ) : (
                  "Publish Event"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
