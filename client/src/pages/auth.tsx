import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useActivityTracker } from "@/hooks/use-activity-tracker";
import { login, register } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(1, "Name is required"),
});

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const { toast } = useToast();
  const { logLogin } = useActivityTracker();

  const isSignup = mode === "signup";
  const schema = isSignup ? registerSchema : loginSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const authMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isSignup) {
        return await register(data);
      } else {
        return await login(data);
      }
    },
    onSuccess: (user) => {
      toast({
        title: "Success!",
        description: isSignup ? "Account created successfully!" : "Welcome back!",
      });
      
      // Log login activity (only for login, not signup)
      if (!isSignup) {
        logLogin();
      }
      
      // Set the user data immediately in the cache to prevent null state
      queryClient.setQueryData(["/api/me"], user);
      
      // Then invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      
      // Small delay to ensure state is stable before redirect
      setTimeout(() => {
        onAuthSuccess();
      }, 50);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    authMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-slate-800">
            {isSignup ? "Create Account" : "Sign In"}
          </CardTitle>
          <p className="text-slate-500">
            {isSignup ? "Join the CM Training Platform" : "Welcome back to CM Training"}
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="your.email@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="••••••••" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isSignup && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={authMutation.isPending}
              >
                {authMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Please wait...</span>
                  </div>
                ) : (
                  isSignup ? "Create Account" : "Sign In"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => setMode(isSignup ? "signin" : "signup")}
              className="text-primary hover:text-primary-700"
            >
              {isSignup
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
