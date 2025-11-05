import { Ticket, User, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { InlineSearchBar } from "./InlineSearchBar";
import { Category } from "../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface HeaderProps {
  onNavigate: (page: string, eventId?: string) => void;
  currentPage: string;
  isAuthenticated?: boolean;
  onSearchOpenChange?: (isOpen: boolean) => void;
}

export function Header({
  onNavigate,
  currentPage,
  isAuthenticated = false,
  onSearchOpenChange,
}: HeaderProps) {
  const handleEventClick = (eventId: string) => {
    onNavigate("event-detail", eventId);
  };

  const handleCategoryClick = (_category: Category) => {
    onNavigate("listing");
  };

  const handleCityClick = (_city: string) => {
    onNavigate("listing");
  };

  return (
    <header className="sticky top-0 z-50 bg-teal-500 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between gap-4 h-20">
          {/* Logo */}
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0"
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
            {/* Create Event Button */}
            {isAuthenticated && (
              <Button
                onClick={() => onNavigate("organizer-wizard")}
                variant="secondary"
                size="sm"
                className="bg-white text-teal-600 hover:bg-neutral-100 gap-2 hidden lg:flex"
              >
                <Plus size={18} />
                Create Event
              </Button>
            )}

            {/* My Tickets */}
            <Button
              onClick={() => onNavigate("my-tickets")}
              variant="ghost"
              size="sm"
              className={`gap-2 text-white hover:bg-teal-600 ${
                currentPage === "my-tickets" ? "bg-teal-600" : ""
              }`}
            >
              <Ticket size={18} />
              <span className="hidden sm:inline">My Tickets</span>
            </Button>

            {/* Account Dropdown */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-white hover:bg-teal-600"
                  >
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-white text-teal-600 text-sm">
                        U
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onNavigate("user-profile")}>
                    <User size={16} className="mr-2" />
                    Hồ sơ cá nhân
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("my-tickets")}>
                    <Ticket size={16} className="mr-2" />
                    Vé của tôi
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onNavigate("organizer-dashboard")}
                  >
                    <Plus size={16} className="mr-2" />
                    Organizer Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate("login")}>
                    Đăng xuất
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
                Sign In
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
