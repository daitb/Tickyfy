import {
  Ticket,
  User,
  Plus,
  Heart,
  Clock,
  Shield,
  LayoutDashboard,
  Calendar,
  LogOut,
  QrCode,
  History,
  UserCog,
  MessageCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { InlineSearchBar } from "./InlineSearchBar";
import type { Category } from "../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { authService } from "../services/authService";
import { organizerService } from "../services/organizerService";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { NotificationDropdown } from "./NotificationDropdown";
import { useWishlistToggle } from "../hooks/useWishlistToggle";
import { useEffect, useState } from "react";

interface HeaderProps {
  onNavigate: (page: string, eventId?: string) => void;
  currentPage: string;
  isAuthenticated?: boolean;
  userRole?: "guest" | "user" | "organizer" | "staff" | "admin";
  onSearchOpenChange?: (isOpen: boolean) => void;
}

export function Header({
  onNavigate,
  currentPage,
  isAuthenticated = false,
  userRole = "user",
  onSearchOpenChange,
}: HeaderProps) {
  const { t } = useTranslation();
  const { wishlistCount } = useWishlistToggle();
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  
  // Check if user has pending organizer request
  useEffect(() => {
    const checkPendingRequest = async () => {
      if (isAuthenticated && userRole === "user") {
        try {
          const request = await organizerService.getMyOrganizerRequest();
          setHasPendingRequest(!!request);
        } catch (error) {
          console.error("Error checking pending request:", error);
          setHasPendingRequest(false);
        }
      } else {
        setHasPendingRequest(false);
      }
    };

    checkPendingRequest();
  }, [isAuthenticated, userRole]);
  
  const handleEventClick = (eventId: string) => {
    onNavigate("event-detail", eventId);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCategoryClick = (_category: Category) => {
    onNavigate("listing");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCityClick = (_city: string) => {
    onNavigate("listing");
  };

  return (
    <header className="sticky top-0 z-50 bg-teal-500 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between gap-4 h-20">
          {/* Logo */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("home");
            }}
            className="cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Ticket className="text-teal-500" size={24} />
            </div>
            <span className="text-xl text-white hidden sm:inline">Tickify</span>
          </button>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <InlineSearchBar
              onEventClick={handleEventClick}
              onCategoryClick={handleCategoryClick}
              onCityClick={handleCityClick}
              onOpenChange={onSearchOpenChange}
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Language Switcher */}
            <div className="hover:bg-teal-600 rounded-lg">
              <LanguageSwitcher />
            </div>

            {/* Notifications - Only for authenticated users */}
            {isAuthenticated && (
              <NotificationDropdown onNavigate={onNavigate} />
            )}

            {/* Chat Button - Only for authenticated users */}
            {isAuthenticated && (
              <Button
                onClick={() => onNavigate("chat")}
                variant="ghost"
                size="sm"
                className={`cursor-pointer gap-2 text-white hover:bg-teal-600 ${
                  currentPage === "chat" ? "bg-teal-600" : ""
                }`}
                title={t("header.chat")}
              >
                <MessageCircle size={18} />
                <span className="hidden sm:inline">{t("header.chat")}</span>
              </Button>
            )}
            
            {/* Create Event Button - Only for Organizers */}
            {isAuthenticated && userRole === "organizer" && (
              <Button
                onClick={() => onNavigate("create-event")}
                variant="secondary"
                size="sm"
                className="bg-white text-teal-600 hover:bg-neutral-100 gap-2 hidden lg:flex"
              >
                <Plus size={18} />
                {t("header.createEvent")}
              </Button>
            )}

            {/* My Tickets */}
            {/* <Button
              onClick={() => onNavigate("my-tickets")}
              variant="ghost"
              size="sm"
              className={`cursor-pointer gap-2 text-white hover:bg-teal-600 ${
                currentPage === "my-tickets" ? "bg-teal-600" : ""
              }`}
            >
              <Ticket size={18} />
              <span className="hidden sm:inline">{t('header.myTickets')}</span>
            </Button> */}

            {/* Account Dropdown */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer gap-2 text-white hover:bg-teal-600"
                  >
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-white text-teal-600 text-sm font-semibold">
                        {authService
                          .getCurrentUser()
                          ?.fullName?.charAt(0)
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">
                      {authService.getCurrentUser()?.fullName || t("header.account")}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onNavigate("my-tickets")}>
                    <Ticket size={16} className="mr-2" />
                    {t("header.myTickets")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("wishlist")}>
                    <Heart size={16} className="mr-2" />
                    {t("header.wishlist")}
                    {wishlistCount > 0 && (
                      <Badge variant="secondary" className="ml-auto h-5 min-w-[20px] flex items-center justify-center px-1.5">
                        {wishlistCount}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("waitlist")}>
                    <Clock size={16} className="mr-2" />
                    {t("header.waitlist")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {(userRole === "organizer" || userRole === "admin") && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onNavigate("organizer-dashboard")}
                      >
                        <LayoutDashboard size={16} className="mr-2" />
                        {t("header.organizerDashboard")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onNavigate("event-management")}
                      >
                        <Calendar size={16} className="mr-2" />
                        {t("header.manageEvents")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onNavigate("create-event")}
                      >
                        <Plus size={16} className="mr-2" />
                        {t("header.createEvent")}
                      </DropdownMenuItem>
                    </>
                  )}
                  {(userRole === "staff" ||
                    userRole === "organizer" ||
                    userRole === "admin") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onNavigate("qr-scanner")}
                      >
                        <QrCode size={16} className="mr-2" />
                        {t("header.qrScanner")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onNavigate("scan-history")}
                      >
                        <History size={16} className="mr-2" />
                        {t("header.scanHistory")}
                      </DropdownMenuItem>
                    </>
                  )}
                  {userRole === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onNavigate("admin-dashboard")}
                      >
                        <Shield size={16} className="mr-2" />
                        {t("header.adminPanel")}
                      </DropdownMenuItem>
                    </>
                  )}
                  {userRole === "user" && !hasPendingRequest && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onNavigate("become-organizer")}
                      >
                        <Plus size={16} className="mr-2" />
                        {t("header.becomeOrganizer")}
                      </DropdownMenuItem>
                    </>
                  )}
                  {userRole === "user" && hasPendingRequest && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled className="text-neutral-500">
                        <Plus size={16} className="mr-2" />
                        {t("header.becomeOrganizer")} - {t("header.pendingApproval")}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate("user-profile")}>
                    <User size={16} className="mr-2" />
                    {t("header.profile")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await authService.logout();
                      // Logout will redirect to /login automatically
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut size={16} className="mr-2" />
                    {t("header.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => onNavigate("login")}
                variant="secondary"
                size="sm"
                className="bg-white text-teal-600 hover:bg-neutral-100"
              >
                {t("header.login")}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-4 md:hidden">
          <InlineSearchBar
            onEventClick={handleEventClick}
            onCategoryClick={handleCategoryClick}
            onCityClick={handleCityClick}
            onOpenChange={onSearchOpenChange}
          />
        </div>
      </div>
    </header>
  );
}
