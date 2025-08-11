import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthGuard } from "@/components/auth-guard";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Materials from "@/pages/materials";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import Tests from "@/pages/tests";
import TestTaking from "@/pages/test-taking";
import EnhancedAdmin from "@/pages/enhanced-admin";
import ModuleAdmin from "@/pages/module-admin";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [authKey, setAuthKey] = useState(0);

  const handleAuthSuccess = () => {
    setAuthKey(prev => prev + 1);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    // Clear query cache
    queryClient.clear();
    // Reset auth state by incrementing key
    setAuthKey(prev => prev + 1);
    setCurrentPage("dashboard");
  };

  const renderPage = (user: any) => {
    // Handle test-taking routes
    if (currentPage.startsWith("test-taking/")) {
      const testId = currentPage.split("/")[1];
      return <TestTaking testId={testId} user={user} onNavigate={setCurrentPage} onLogout={handleLogout} />;
    }

    switch (currentPage) {
      case "materials":
        return <Materials user={user} onNavigate={setCurrentPage} onLogout={handleLogout} />;
      case "profile":
        return <Profile user={user} onNavigate={setCurrentPage} onLogout={handleLogout} />;
      case "admin":
        return <Admin user={user} onNavigate={setCurrentPage} onLogout={handleLogout} />;
      case "tests":
        return <Tests user={user} onNavigate={setCurrentPage} onLogout={handleLogout} />;
      case "enhanced-admin":
        return <EnhancedAdmin user={user} onNavigate={setCurrentPage} onLogout={handleLogout} />;
      case "module-admin":
        return <ModuleAdmin user={user} onNavigate={setCurrentPage} onLogout={handleLogout} />;
      default:
        return <Dashboard user={user} onNavigate={setCurrentPage} onLogout={handleLogout} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthGuard
          key={authKey}
          fallback={<AuthPage onAuthSuccess={handleAuthSuccess} />}
        >
          {(user) => renderPage(user)}
        </AuthGuard>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
