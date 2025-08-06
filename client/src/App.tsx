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

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [authKey, setAuthKey] = useState(0);

  const handleAuthSuccess = () => {
    setAuthKey(prev => prev + 1);
    setCurrentPage("dashboard");
  };

  const renderPage = (user: any) => {
    switch (currentPage) {
      case "materials":
        return <Materials user={user} onNavigate={setCurrentPage} />;
      case "profile":
        return <Profile user={user} onNavigate={setCurrentPage} />;
      default:
        return <Dashboard user={user} onNavigate={setCurrentPage} />;
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
