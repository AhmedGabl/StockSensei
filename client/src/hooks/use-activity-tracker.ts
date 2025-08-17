import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface LogActivityParams {
  type: "MATERIAL_VIEW" | "TEST_TAKEN" | "MODULE_ACCESSED" | "PRACTICE_CALL" | "LOGIN" | "LOGOUT";
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
}

export function useActivityTracker() {
  const logActivityMutation = useMutation({
    mutationFn: async (params: LogActivityParams) => {
      const response = await apiRequest("POST", "/api/activity/log", {
        ...params,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined
      });
      return response.json();
    },
    onError: (error) => {
      console.warn("Failed to log activity:", error);
      // Don't throw error - activity logging shouldn't break the user experience
    }
  });

  const logActivity = (params: LogActivityParams) => {
    logActivityMutation.mutate(params);
  };

  // Specific helper functions
  const logMaterialView = (materialId: string, duration?: number, progress?: number) => {
    logActivity({
      type: "MATERIAL_VIEW",
      entityId: materialId,
      entityType: "material",
      metadata: { duration, progress }
    });
  };

  const logTestTaken = (testId: string, score?: number, completed?: boolean) => {
    logActivity({
      type: "TEST_TAKEN",
      entityId: testId,
      entityType: "test",
      metadata: { score, completed }
    });
  };

  const logModuleAccessed = (moduleId: string) => {
    logActivity({
      type: "MODULE_ACCESSED",
      entityId: moduleId,
      entityType: "module"
    });
  };

  const logPracticeCall = (callId: string, outcome?: string, duration?: number) => {
    logActivity({
      type: "PRACTICE_CALL",
      entityId: callId,
      entityType: "practice_call",
      metadata: { outcome, duration }
    });
  };

  const logLogin = (sessionId?: string) => {
    logActivity({
      type: "LOGIN",
      sessionId,
      metadata: { timestamp: new Date().toISOString() }
    });
  };

  const logLogout = (sessionId?: string) => {
    logActivity({
      type: "LOGOUT",
      sessionId,
      metadata: { timestamp: new Date().toISOString() }
    });
  };

  return {
    logActivity,
    logMaterialView,
    logTestTaken,
    logModuleAccessed,
    logPracticeCall,
    logLogin,
    logLogout,
    isLogging: logActivityMutation.isPending
  };
}