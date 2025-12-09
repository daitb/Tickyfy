import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import {
  Clock,
  Calendar,
  MapPin,
  PartyPopper,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { Separator } from "../components/ui/separator";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { waitlistService, type WaitlistDto } from "../services/waitlistService";
import { toast } from "sonner";

interface WaitlistProps {
  onNavigate: (page: string, eventId?: string) => void;
}

export default function Waitlist({ onNavigate }: WaitlistProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("all");
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState<number | null>(null);

  // Load waitlist entries
  useEffect(() => {
    loadWaitlist();
  }, []);

  const loadWaitlist = async () => {
    setIsLoading(true);
    try {
      const entries = await waitlistService.getMyWaitlist();
      setWaitlistEntries(entries);
    } catch (error: any) {
      console.error("Error loading waitlist:", error);
      toast.error("Không thể tải danh sách chờ", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter entries based on status
  const activeEntries = waitlistEntries.filter(
    (entry) => entry.status === "active"
  );
  const notifiedEntries = waitlistEntries.filter(
    (entry) => entry.status === "notified"
  );
  const expiredEntries = waitlistEntries.filter(
    (entry) => entry.status === "expired" || entry.hasPurchased
  );

  const getFilteredEntries = () => {
    switch (activeTab) {
      case "active":
        return activeEntries;
      case "notified":
        return notifiedEntries;
      case "expired":
        return expiredEntries;
      default:
        return waitlistEntries;
    }
  };

  const displayEntries = getFilteredEntries();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          dotColor: "bg-blue-500",
          text: t(
            "pages.waitlist.statusActive",
            "Active - Waiting for tickets"
          ),
          textColor: "text-blue-700",
        };
      case "notified":
        return {
          dotColor: "bg-green-500",
          text: t(
            "pages.waitlist.statusNotified",
            "Notified - Tickets available!"
          ),
          textColor: "text-green-700",
        };
      case "expired":
      case "purchased":
        return {
          dotColor: "bg-neutral-400",
          text: t("pages.waitlist.statusExpired", "Expired - Waitlist closed"),
          textColor: "text-neutral-600",
        };
      default:
        return {
          dotColor: "bg-neutral-400",
          text: status,
          textColor: "text-neutral-600",
        };
    }
  };

  const handleLeaveWaitlist = async (waitlistId: number) => {
    if (
      !confirm(
        t(
          "pages.waitlist.confirmLeave",
          "Bạn có chắc muốn rời khỏi danh sách chờ?"
        )
      )
    ) {
      return;
    }

    setIsRemoving(waitlistId);
    try {
      await waitlistService.leaveWaitlist(waitlistId);
      toast.success(
        t("pages.waitlist.leftSuccess", "Đã rời khỏi danh sách chờ")
      );
      // Reload waitlist
      await loadWaitlist();
    } catch (error: any) {
      console.error("Error leaving waitlist:", error);
      toast.error(
        t("pages.waitlist.leftError", "Không thể rời danh sách chờ"),
        {
          description: error.response?.data?.message || error.message,
        }
      );
    } finally {
      setIsRemoving(null);
    }
  };

  const handleReserveNow = (eventId: number) => {
    onNavigate("event-detail", eventId.toString());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-neutral-600">
            {t("common.loading", "Đang tải...")}
          </p>
        </div>
      </div>
    );
  }

  if (displayEntries.length === 0 && activeTab === "all") {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="mb-2">{t("pages.waitlist.title")}</h1>
            <p className="text-neutral-600">{t("pages.waitlist.subtitle")}</p>
          </div>

          {/* Empty State */}
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-neutral-100 mb-6">
              <Clock size={48} className="text-neutral-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-neutral-900 mb-2">
              {t("pages.waitlist.empty")}
            </h2>
            <p className="text-neutral-600 mb-6">
              {t("pages.waitlist.emptyMessage")}
            </p>
            <Button onClick={() => onNavigate("listing")}>
              {t("pages.waitlist.browseSoldOut")}
            </Button>
          </div>

          {/* Info Sidebar */}
          <Card className="max-w-2xl mx-auto mt-12 bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-blue-900 mb-4">
                {t("pages.waitlist.howItWorks")}
              </h3>
              <div className="space-y-3 text-blue-800">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <p>{t("pages.waitlist.step1")}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <p>{t("pages.waitlist.step2")}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <p>{t("pages.waitlist.step3")}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <p>{t("pages.waitlist.step4")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasNotifiedEntries = notifiedEntries.length > 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2">{t("pages.waitlist.title")}</h1>
          <p className="text-neutral-600">{t("pages.waitlist.subtitle")}</p>
        </div>

        {/* Notification Banner */}
        {hasNotifiedEntries && (
          <Alert className="mb-8 bg-green-50 border-green-200">
            <PartyPopper className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 ml-2">
              <strong>{t("pages.waitlist.goodNews")}</strong>{" "}
              {t("pages.waitlist.ticketsAvailable")} {notifiedEntries.length}{" "}
              {notifiedEntries.length === 1
                ? t("pages.waitlist.event")
                : t("pages.waitlist.events")}
              <Button
                variant="link"
                className="ml-2 text-green-700 p-0 h-auto"
                onClick={() => setActiveTab("notified")}
              >
                {t("pages.waitlist.viewOpportunities")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Status Filter */}
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">{t("pages.waitlist.all")}</TabsTrigger>
              <TabsTrigger value="active">
                {t("pages.waitlist.active")} ({activeEntries.length})
              </TabsTrigger>
              <TabsTrigger value="notified">
                {t("pages.waitlist.notified")} ({notifiedEntries.length})
              </TabsTrigger>
              <TabsTrigger value="expired">
                {t("pages.waitlist.expired")} ({expiredEntries.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Waitlist Entries */}
        <div className="space-y-4">
          {displayEntries.map((entry) => {
            const statusConfig = getStatusConfig(entry.status);

            return (
              <Card
                key={entry.waitlistId}
                className="overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row gap-6 p-6">
                    {/* Event Thumbnail */}
                    <div className="lg:w-64 flex-shrink-0">
                      <div
                        className="aspect-[16/10] rounded-lg overflow-hidden bg-neutral-100 cursor-pointer relative"
                        onClick={() => handleReserveNow(entry.eventId)}
                      >
                        <ImageWithFallback
                          src={entry.eventBanner || ""}
                          alt={entry.eventTitle}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        {entry.ticketTypeName && (
                          <div className="absolute top-3 left-3">
                            <Badge
                              variant="secondary"
                              className="bg-white/90 backdrop-blur-sm"
                            >
                              {entry.ticketTypeName}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3
                          className="mb-2 cursor-pointer hover:text-teal-600 transition-colors"
                          onClick={() => handleReserveNow(entry.eventId)}
                        >
                          {entry.eventTitle}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-neutral-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span className="text-sm">
                              {formatDateTime(entry.eventDate)}
                            </span>
                          </div>
                          {entry.eventLocation && (
                            <div className="flex items-center gap-2">
                              <MapPin size={16} />
                              <span className="text-sm">
                                {entry.eventLocation}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Status Row */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}
                        />
                        <span
                          className={`font-medium ${statusConfig.textColor}`}
                        >
                          {statusConfig.text}
                        </span>
                      </div>

                      {/* Position and Dates */}
                      <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                        {entry.status === "active" && entry.position > 0 && (
                          <div>
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-700"
                            >
                              {entry.position === 1
                                ? t(
                                    "pages.waitlist.nextInLine",
                                    "Next in line!"
                                  )
                                : `#${entry.position} ${t(
                                    "pages.waitlist.inWaitlist",
                                    "in waitlist"
                                  )}`}
                            </Badge>
                          </div>
                        )}
                        <div>
                          {t("pages.waitlist.joined", "Joined")}{" "}
                          {formatDate(entry.joinedAt)}
                        </div>
                        {entry.requestedQuantity > 1 && (
                          <div>
                            {entry.requestedQuantity}{" "}
                            {t("pages.waitlist.tickets", "tickets")}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Section */}
                    <div className="lg:w-48 flex-shrink-0 flex flex-col justify-center gap-3">
                      {entry.status === "notified" && (
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => handleReserveNow(entry.eventId)}
                        >
                          {t("pages.waitlist.reserveNow", "Reserve Now")}
                        </Button>
                      )}
                      {entry.status === "active" && (
                        <Button
                          variant="outline"
                          className="w-full text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleLeaveWaitlist(entry.waitlistId)}
                          disabled={isRemoving === entry.waitlistId}
                        >
                          {isRemoving === entry.waitlistId ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {t("common.loading", "Đang xử lý...")}
                            </>
                          ) : (
                            t("pages.waitlist.leaveWaitlist", "Leave Waitlist")
                          )}
                        </Button>
                      )}
                      {(entry.status === "expired" || entry.hasPurchased) && (
                        <Button variant="ghost" className="w-full" disabled>
                          {entry.hasPurchased
                            ? t("pages.waitlist.purchased", "Purchased")
                            : t("pages.waitlist.expired", "Expired")}
                        </Button>
                      )}

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full"
                            >
                              <Info size={16} className="mr-2" />
                              {t(
                                "pages.waitlist.whatNext",
                                "What happens next?"
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">
                              {entry.status === "active" &&
                                t(
                                  "pages.waitlist.activeInfo",
                                  "We'll notify you via email when tickets become available. You'll have 24 hours to complete your purchase."
                                )}
                              {entry.status === "notified" &&
                                t(
                                  "pages.waitlist.notifiedInfo",
                                  "Tickets are available now! Reserve your spot before they're gone. You have 24 hours from notification."
                                )}
                              {(entry.status === "expired" ||
                                entry.hasPurchased) &&
                                t(
                                  "pages.waitlist.expiredInfo",
                                  "This waitlist has closed. Check out other upcoming events you might enjoy."
                                )}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Sidebar for Desktop */}
        <Card className="mt-12 bg-blue-50 border-blue-200 hidden lg:block">
          <CardContent className="p-8">
            <h3 className="text-blue-900 mb-6">How Waitlist Works</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center font-medium">
                    1
                  </div>
                  <div>
                    <div className="font-medium text-blue-900 mb-1">
                      Join the waitlist
                    </div>
                    <p className="text-sm text-blue-700">
                      For sold-out events you want to attend
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center font-medium">
                    2
                  </div>
                  <div>
                    <div className="font-medium text-blue-900 mb-1">
                      Get notified
                    </div>
                    <p className="text-sm text-blue-700">
                      When tickets become available via email
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center font-medium">
                    3
                  </div>
                  <div>
                    <div className="font-medium text-blue-900 mb-1">
                      Reserve your spot
                    </div>
                    <p className="text-sm text-blue-700">
                      Within 24 hours of notification
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center font-medium">
                    4
                  </div>
                  <div>
                    <div className="font-medium text-blue-900 mb-1">
                      First come, first served
                    </div>
                    <p className="text-sm text-blue-700">
                      Act fast to secure your tickets
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
