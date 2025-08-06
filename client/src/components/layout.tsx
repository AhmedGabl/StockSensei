import { useState } from "react";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentPage?: string;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}

export function Layout({ children, user, currentPage = "dashboard", onNavigate, onLogout }: LayoutProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "fas fa-home" },
    { id: "materials", label: "Materials", icon: "fas fa-book" },
    { id: "profile", label: "Profile", icon: "fas fa-user" },
  ];

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      onLogout?.();
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      onLogout?.();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-slate-800">CM Training</h1>
            <div className="hidden md:flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    currentPage === item.id
                      ? "text-white bg-primary"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-600">
              <span>{user.name || user.email}</span>
              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium capitalize">
                {user.role.toLowerCase()}
              </span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-8 h-8 p-0 rounded-full">
                  <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-medium">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center space-x-2 p-2">
                  <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-medium text-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate?.("profile")}>
                  <i className="fas fa-user w-4 h-4 mr-2"></i>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate?.("dashboard")}>
                  <i className="fas fa-home w-4 h-4 mr-2"></i>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <i className="fas fa-sign-out-alt w-4 h-4 mr-2"></i>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {children}

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={`flex flex-col items-center py-2 px-1 transition-colors ${
                currentPage === item.id ? "text-primary" : "text-slate-600"
              }`}
            >
              <i className={`${item.icon} text-lg mb-1`}></i>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
          <button className="flex flex-col items-center py-2 px-1 text-slate-600">
            <i className="fas fa-phone-alt text-lg mb-1"></i>
            <span className="text-xs">Practice</span>
          </button>
        </div>
      </div>
    </div>
  );
}
