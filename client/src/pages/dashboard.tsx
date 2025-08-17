import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { ModuleCard } from "@/components/module-card";

import { PracticeCall } from "@/components/practice-call";
import { VoiceWidget } from "@/components/voice-widget";
import { AIChatbotContainer } from "@/components/ai-chatbot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Progress } from "@/lib/types";
import type { TrainingModule } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HomePageProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function HomePage({ user, onNavigate, onLogout }: HomePageProps) {
  const [practiceCallOpen, setPracticeCallOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState("");
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

  const { data: notesData } = useQuery({
    queryKey: [`/api/users/${user.id}/notes`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user.id}/notes`);
      return await response.json();
    },
  });

  // Load modules from API (admin-created modules) with real-time updates
  const { data: modulesData } = useQuery({
    queryKey: ['/api/modules'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/modules");
      return await response.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    refetchOnWindowFocus: true
  });

  const progress = progressData?.progress || [];
  const recentCalls = recentActivity?.calls?.slice(0, 3) || [];
  const notes = notesData?.notes?.filter((note: any) => note.isVisibleToStudent) || [];
  const modules = modulesData?.modules || [];

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

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
      blue: { bg: "bg-blue-100", text: "text-blue-600" },
      purple: { bg: "bg-purple-100", text: "text-purple-600" },
      amber: { bg: "bg-amber-100", text: "text-amber-600" },
      red: { bg: "bg-red-100", text: "text-red-600" },
      indigo: { bg: "bg-indigo-100", text: "text-indigo-600" },
    };
    return colorMap[color] || { bg: "bg-slate-100", text: "text-slate-600" };
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
      action: () => onNavigate("tests"),
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
    ...(user.role === "ADMIN" ? [
      {
        icon: "fas fa-shield-alt",
        title: "Admin Panel",
        description: "User management",
        color: "red",
        action: () => onNavigate("admin"),
      },
      {
        icon: "fas fa-users-cog",
        title: "Student Management",
        description: "Notes & task tracking",
        color: "indigo",
        action: () => onNavigate("enhanced-admin"),
      }
    ] : [])
  ];

  return (
    <Layout user={user} currentPage="home" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto p-4">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-brand-orange to-brand-red rounded-xl p-6 text-white shadow-lg border border-brand-orange/20">
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {user.name || user.email.split('@')[0]}!
            </h2>
            <p className="text-white/90 mb-4">
              Ready to continue your Class Mentor training? You're making great progress!
            </p>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => handlePracticeCall("General Practice")}
                className="bg-white text-brand-orange font-medium hover:bg-brand-orange/10 shadow-md border border-white/20"
              >
                <i className="fas fa-phone mr-2"></i>
                Start Practice Call
              </Button>
              <div className="text-white/90">
                <span className="text-2xl font-bold">{getOverallProgress()}%</span>
                <span className="text-sm ml-1">Complete</span>
              </div>
            </div>
          </div>

          {/* Notes from Admin */}
          {notes.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fas fa-sticky-note text-amber-600"></i>
                Messages from Admin
              </h3>
              <div className="space-y-3">
                {notes.slice(0, 3).map((note: any) => (
                  <Card key={note.id} className="border-l-4 border-amber-400 bg-amber-50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-user-shield text-sm"></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-amber-700 bg-amber-200 px-2 py-1 rounded-full">
                              Admin Message
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{note.body}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {notes.length > 3 && (
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onNavigate('profile')}
                      className="text-amber-600 border-amber-200 hover:bg-amber-50"
                    >
                      View All Messages ({notes.length})
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Training Modules Grid */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Training Modules {modules.length > 0 && `(${modules.length})`}
              </h3>
              {user.role === "ADMIN" && (
                <Button onClick={() => onNavigate('module-admin')} variant="outline" size="sm" className="border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white">
                  <i className="fas fa-cog mr-2"></i>
                  Manage Modules
                </Button>
              )}
            </div>
            {modules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules
                  .filter((module: TrainingModule) => module.isEnabled) // Only show enabled modules to students
                  .sort((a: TrainingModule, b: TrainingModule) => a.orderIndex - b.orderIndex)
                  .map((module: TrainingModule) => (
                  <ModuleCard
                    key={module.id}
                    module={{
                      id: module.id,
                      title: module.title,
                      description: module.description || "",
                      icon: "fas fa-graduation-cap",
                      color: "blue"
                    }}
                    progress={getProgressForModule(module.id)}
                    onAction={handleModuleAction}
                    onPracticeCall={() => handlePracticeCall("General Practice")}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <i className="fas fa-graduation-cap text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">No Training Modules Available</h3>
                  <p className="text-slate-500">
                    {user.role === "ADMIN" 
                      ? "Create your first training module to get started." 
                      : "Training modules will appear here when your admin creates them."}
                  </p>
                  {user.role === "ADMIN" && (
                    <div className="mt-4">
                      <Button onClick={() => onNavigate('module-admin')} variant="outline">
                        <i className="fas fa-plus mr-2"></i>
                        Create First Module
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
                    <div className={`w-10 h-10 ${getColorClasses(action.color).bg} ${getColorClasses(action.color).text} rounded-lg flex items-center justify-center`}>
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
                            <span className={`${call.outcome === 'PASSED' ? 'text-emerald-600' : 'text-amber-600'} font-medium text-sm`}>
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
      </div>

      {/* Practice Call Modal */}
      <PracticeCall
        isOpen={practiceCallOpen}
        onClose={() => setPracticeCallOpen(false)}
        scenario={selectedScenario}
      />
      
      {/* Floating Ringg AI Widget */}
      <VoiceWidget 
        onStartCall={() => handlePracticeCall("General Practice")}
      />

      {/* AI Chatbot Assistant */}
      <AIChatbotContainer />
    </Layout>
  );
}
