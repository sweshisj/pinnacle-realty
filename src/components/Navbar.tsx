import React from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Menu, X, Heart } from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";

type Page =
  | "home"
  | "residential"
  | "serviced-apartments"
  | "project-detail"
  | "seller"
  | "about"
  | "testimonials"
  | "favourites"
  | "admin-login"
  | "admin-dashboard"
  | "admin-clients"
  | "admin-projects"
  | "admin-serviced-apartments"
  | "admin-reminders";

interface NavbarProps {
  currentPage: string;
  navigateTo: (page: Page) => void;
  isAdmin: boolean;
  onLogout: () => void;
}

export function Navbar({
  currentPage,
  navigateTo,
  isAdmin,
  onLogout,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] =
    React.useState(false);
  const [pendingRemindersCount, setPendingRemindersCount] =
    React.useState(0);

  React.useEffect(() => {
    if (isAdmin) {
      fetchPendingRemindersCount();
      // Refresh count every 30 seconds
      const interval = setInterval(
        fetchPendingRemindersCount,
        30000,
      );
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const fetchPendingRemindersCount = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/reminders`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      );
      if (response.ok) {
        const reminders = await response.json();
        const pending = reminders.filter(
          (r: any) => !r.completed,
        ).length;
        setPendingRemindersCount(pending);
      } else {
        // Silently fail - server might not be ready yet
        setPendingRemindersCount(0);
      }
    } catch (error) {
      // Silently fail - server might not be ready yet
      setPendingRemindersCount(0);
    }
  };

  const clientPages = [
    { id: "home", label: "Home", icon: null },
    { id: "residential", label: "Residential", icon: null },
    { id: "serviced-apartments", label: "Serviced Apartments", icon: null },
    { id: "seller", label: "Sell Property", icon: null },
    { id: "testimonials", label: "Testimonials", icon: null },
    { id: "favourites", label: null, icon: Heart },
    { id: "about", label: "About Us", icon: null },
  ];

  const adminPages = [
    { id: "admin-dashboard", label: "Dashboard" },
    { id: "admin-clients", label: "Clients" },
    { id: "admin-projects", label: "Projects" },
    {
      id: "admin-serviced-apartments",
      label: "Serviced Apartments",
    },
    { id: "admin-reminders", label: "Reminders" },
  ];

  const pages = isAdmin ? adminPages : clientPages;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() =>
              navigateTo(isAdmin ? "admin-dashboard" : "home")
            }
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">PR</span>
              </div>
              <span className="font-bold text-lg text-gray-900">Pinnacle Realty</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {pages.map((page) => (
              <div key={page.id} className="relative">
                <Button
                  variant={
                    currentPage === page.id
                      ? "default"
                      : "ghost"
                  }
                  onClick={() => navigateTo(page.id as Page)}
                  className={
                    currentPage === page.id
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }
                >
                  {page.icon && page.label && (
                    <page.icon className="mr-2 h-4 w-4" />
                  )}
                  {page.icon && !page.label && (
                    <page.icon className="h-4 w-4" />
                  )}
                  {page.label}
                </Button>
                {isAdmin &&
                  page.id === "admin-reminders" &&
                  pendingRemindersCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-500 text-white min-w-[20px] h-5 flex items-center justify-center px-1.5">
                      {pendingRemindersCount > 99
                        ? "99+"
                        : pendingRemindersCount}
                    </Badge>
                  )}
              </div>
            ))}

            {!isAdmin && (
              <Button
                variant="outline"
                onClick={() => navigateTo("admin-login")}
                className="ml-4"
              >
                Admin Login
              </Button>
            )}

            {isAdmin && (
              <Button
                variant="outline"
                onClick={onLogout}
                className="ml-4"
              >
                Logout
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {pages.map((page) => (
              <div key={page.id} className="relative">
                <Button
                  variant={
                    currentPage === page.id
                      ? "default"
                      : "ghost"
                  }
                  onClick={() => {
                    navigateTo(page.id as Page);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full justify-start ${
                    currentPage === page.id
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }`}
                >
                  {page.icon && page.label && (
                    <page.icon className="mr-2 h-4 w-4" />
                  )}
                  {page.icon && !page.label && (
                    <page.icon className="h-4 w-4" />
                  )}
                  {page.label}
                  {isAdmin &&
                    page.id === "admin-reminders" &&
                    pendingRemindersCount > 0 && (
                      <Badge className="ml-auto bg-red-500 hover:bg-red-500 text-white">
                        {pendingRemindersCount > 99
                          ? "99+"
                          : pendingRemindersCount}
                      </Badge>
                    )}
                </Button>
              </div>
            ))}

            {!isAdmin && (
              <Button
                variant="outline"
                onClick={() => {
                  navigateTo("admin-login");
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                Admin Login 
              </Button>
            )}

            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                Logout
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}