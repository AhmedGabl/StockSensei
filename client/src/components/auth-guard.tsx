import { useQuery } from "@tanstack/react-query";
import { getCurrentUser, AuthUser } from "@/lib/auth";

interface AuthGuardProps {
  children: (user: AuthUser) => React.ReactNode;
  fallback: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/me"],
    queryFn: getCurrentUser,
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 1000, // Keep data for 1 second to prevent flicker
    gcTime: 5000, // Keep in cache for 5 seconds
    refetchOnMount: 'always', // Always check on mount
  });

  console.log("AuthGuard state: isLoading:", isLoading, "user:", user, "error:", error);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <>{fallback}</>;
  }

  return <>{children(user)}</>;
}
