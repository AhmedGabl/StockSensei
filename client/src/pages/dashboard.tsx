import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { ModuleCard } from "@/components/module-card";
import { BotpressChat } from "@/components/botpress-chat";
import { PracticeCall } from "@/components/practice-call";
import { VoiceWidget } from "@/components/voice-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Progress, MODULES } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function Dashboard({ user, onNavigate, onLogout }: DashboardProps) {
  const [practiceCallOpen, setPracticeCallOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState("");
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: progressData } = useQuery({
    queryKey: ["/api/progress"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/progress");
      return await response.json();
    },
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["/api/practice-calls"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/practice-calls");
      return await response.json();
    },
  });

  const progress = progressData?.progress || [];
  const recentCalls = recentActivity?.calls?.slice(0, 3) || [];

  const getProgressForModule = (moduleId: string): Progress | undefined => {
    return progress.find((p: Progress) => p.module === moduleId);
  };

  const getOverallProgress = (): number => {
    if (progress.length === 0) return 0;
    const completed = progress.filter((p: Progress) => p.status === "COMPLETED").length;
    return Math.round((completed / progress.length) * 100);
  };

  const handleModuleAction = (action: string, moduleId: string) => {
    toast({
      title: "Module Action",
      description: `${action} action for ${moduleId}`,
    });
  };

  const handlePracticeCall = (scenario: string) => {
    setSelectedScenario(scenario);
    setPracticeCallOpen(true);
  };

  const quickActions = [
    {
      icon: "fas fa-phone-alt",
      title: "Practice Call",
      description: "Start a roleplay session",
      color: "emerald",
      action: () => handlePracticeCall("General Practice"),
    },
    {
      icon: "fas fa-file-alt",
      title: "Take Quiz",
      description: "Test your knowledge",
      color: "blue",
      action: () => toast({ title: "Quiz", description: "Quiz feature coming soon!" }),
    },
    {
      icon: "fas fa-book",
      title: "Materials",
      description: "Access resources",
      color: "purple",
      action: () => onNavigate("materials"),
    },
    {
      icon: "fas fa-chart-line",
      title: "View Progress",
      description: "Check your stats",
      color: "amber",
      action: () => onNavigate("profile"),
    },
  ];

  return (
    <Layout user={user} currentPage="dashboard" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Dashboard Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary to-primary-600 rounded-xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {user.name || user.email.split('@')[0]}!
              </h2>
              <p className="text-primary-100 mb-4">
                Ready to continue your Class Mentor training? You're making great progress!
              </p>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => handlePracticeCall("General Practice")}
                  className="bg-white text-primary font-medium hover:bg-primary-50"
                >
                  <i className="fas fa-phone mr-2"></i>
                  Start Practice Call
                </Button>
                <div className="text-primary-100">
                  <span className="text-2xl font-bold">{getOverallProgress()}%</span>
                  <span className="text-sm ml-1">Complete</span>
                </div>
              </div>
            </div>

            {/* Training Modules Grid */}
            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Training Modules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MODULES.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    progress={getProgressForModule(module.id)}
                    onAction={handleModuleAction}
                    onPracticeCall={handlePracticeCall}
                  />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-lg transition-shadow"
                    onClick={action.action}
                  >
                    <div className={`w-10 h-10 bg-${action.color}-100 text-${action.color}-600 rounded-lg flex items-center justify-center`}>
                      <i className={action.icon}></i>
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-slate-800">{action.title}</h4>
                      <p className="text-sm text-slate-500">{action.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Recent Activity</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-200">
                    {recentCalls.length > 0 ? (
                      recentCalls.map((call: any, index: number) => (
                        <div key={call.id} className="p-4 flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <i className="fas fa-phone text-sm"></i>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">
                              Practice call: {call.scenario}
                            </p>
                            <p className="text-sm text-slate-500">
                              {new Date(call.startedAt).toLocaleDateString()}
                            </p>
                          </div>
                          {call.outcome && (
                            <span className={`text-${call.outcome === 'PASSED' ? 'emerald' : 'amber'}-600 font-medium text-sm`}>
                              {call.outcome === 'PASSED' ? '+10 pts' : 'Practice'}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-500">
                        <i className="fas fa-clock text-2xl mb-2"></i>
                        <p>No recent activity yet. Start your first practice call!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Chat Dock */}
          <div className="lg:col-span-1">
            <BotpressChat
              user={user}
              isCollapsed={chatCollapsed}
              onToggle={() => setChatCollapsed(!chatCollapsed)}
            />
          </div>
        </div>
      </div>

      {/* Practice Call Modal */}
      <PracticeCall
        isOpen={practiceCallOpen}
        onClose={() => setPracticeCallOpen(false)}
        scenario={selectedScenario}
      />
      
      {/* Floating Voice Widget */}
      <VoiceWidget onStartCall={handlePracticeCall} />
    </Layout>
  );
}
