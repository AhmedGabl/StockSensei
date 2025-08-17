import { useState } from "react";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { BotpressChat } from "@/components/botpress-chat";
import { AIAssistantHub } from "@/components/ai-assistant-hub";
import { VoiceWidget } from "@/components/voice-widget";

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentPage?: string;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}

export function Layout({ children, user, currentPage = "home", onNavigate, onLogout }: LayoutProps) {
  const [aiHubOpen, setAiHubOpen] = useState(false);

  const handleStartPracticeCall = async () => {
    try {
      const response = await apiRequest("POST", "/api/practice-calls/start");
      const data = await response.json();
      console.log("Practice call started:", data);
    } catch (error) {
      console.error("Failed to start practice call:", error);
    }
  };
  
  const navItems = [
    { id: "home", label: "Home Page", icon: "fas fa-home" },
    { id: "materials", label: "Materials", icon: "fas fa-book" },
    { id: "problem-reports", label: "Report Issue", icon: "fas fa-exclamation-triangle" },
    { id: "profile", label: "Profile", icon: "fas fa-user" },
    ...(user.role === "ADMIN" ? [{ id: "admin", label: "Admin", icon: "fas fa-shield-alt" }] : []),
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
      <nav className="bg-white border-b border-slate-200 px-4 py-3 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold brand-orange">CM Training</h1>
            <div className="hidden md:flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    currentPage === item.id
                      ? "text-white bg-brand-blue"
                      : "text-slate-600 hover:brand-orange"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* AI Assistant Hub Button */}
            <Button
              onClick={() => setAiHubOpen(true)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
            >
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <i className="fas fa-robot text-white text-xs"></i>
              </div>
              <span className="text-sm font-medium">AI Training Hub</span>
            </Button>
            
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

      {/* Main Content Area */}
      <div className="pt-20">
        {children}
      </div>



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
          <button 
            onClick={() => setAiHubOpen(true)}
            className="flex flex-col items-center py-2 px-1 transition-colors text-slate-600"
          >
            <i className="fas fa-robot text-lg mb-1"></i>
            <span className="text-xs">AI Hub</span>
          </button>
        </div>
      </div>

      {/* AI Assistant Hub */}
      <AIAssistantHub
        user={user}
        isOpen={aiHubOpen}
        onClose={() => setAiHubOpen(false)}
      />

      {/* Floating Voice Widget */}
      <VoiceWidget
        onStartCall={() => handleStartPracticeCall()}
      />
    </div>
  );
}
