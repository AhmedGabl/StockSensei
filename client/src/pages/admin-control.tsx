import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@/lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminControlProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface DashboardSection {
  id: string;
  name: string;
  isEnabled: boolean;
  orderIndex: number;
  description?: string;
}

export default function AdminControl({ user, onNavigate, onLogout }: AdminControlProps) {
  const { toast } = useToast();
  const [editingSection, setEditingSection] = useState<DashboardSection | null>(null);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Load dashboard sections
  const { data: sectionsData } = useQuery({
    queryKey: ['/api/admin/dashboard-sections'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/dashboard-sections");
      return await response.json();
    }
  });

  // Load modules for unified control
  const { data: modulesData } = useQuery({
    queryKey: ['/api/modules'],
  });

  // Load test assignments
  const { data: testAssignmentsData } = useQuery({
    queryKey: ['/api/admin/test-assignments'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/test-assignments");
      return await response.json();
    }
  });

  const sections = sectionsData?.sections || [
    // Default dashboard sections
    { id: 'modules', name: 'Training Modules', isEnabled: true, orderIndex: 1, description: 'Interactive training content' },
    { id: 'tests', name: 'Knowledge Tests', isEnabled: true, orderIndex: 2, description: 'Assessment and evaluation' },
    { id: 'materials', name: 'Learning Materials', isEnabled: true, orderIndex: 3, description: 'Documents and resources' },
    { id: 'ai_hub', name: 'AI Training Hub', isEnabled: true, orderIndex: 4, description: 'Roleplay practice calls' },
    { id: 'progress', name: 'Progress Tracking', isEnabled: true, orderIndex: 5, description: 'Performance analytics' }
  ];

  const modules = (modulesData as any)?.modules || [];
  const testAssignments = testAssignmentsData?.assignments || [];

  // Section management mutations
  const updateSectionMutation = useMutation({
    mutationFn: (updates: any) => apiRequest('PATCH', `/api/admin/dashboard-sections/${updates.id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-sections'] });
      toast({ title: "Section Updated", description: "Dashboard section has been updated." });
    }
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, ...updates }: any) => apiRequest('PATCH', `/api/modules/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      toast({ title: "Module Updated", description: "Training module has been updated." });
    }
  });

  const updateTestAssignmentMutation = useMutation({
    mutationFn: ({ id, ...updates }: any) => apiRequest('PATCH', `/api/test-assignments/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/test-assignments'] });
      toast({ title: "Assignment Updated", description: "Test assignment has been updated." });
    }
  });

  const handleToggleSection = (sectionId: string) => {
    const section = sections.find((s: any) => s.id === sectionId);
    if (section) {
      updateSectionMutation.mutate({
        id: sectionId,
        isEnabled: !section.isEnabled
      });
    }
  };

  const handleToggleModule = (moduleId: string) => {
    const module = modules.find((m: any) => m.id === moduleId);
    if (module) {
      updateModuleMutation.mutate({
        id: moduleId,
        isEnabled: !module.isEnabled
      });
    }
  };

  const handleUpdateMaxAttempts = (assignmentId: string, maxAttempts: number) => {
    updateTestAssignmentMutation.mutate({
      id: assignmentId,
      maxAttempts
    });
  };

  return (
    <Layout user={user} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Admin Control Center</h1>
              <p className="text-slate-600 mt-2">Unified control over all student-facing elements</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="dashboard">Dashboard Layout</TabsTrigger>
            <TabsTrigger value="modules">Training Modules</TabsTrigger>
            <TabsTrigger value="tests">Test Management</TabsTrigger>
            <TabsTrigger value="content">Content Control</TabsTrigger>
          </TabsList>

          {/* Dashboard Layout Control */}
          <TabsContent value="dashboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-layout-dashboard text-blue-600"></i>
                  Dashboard Sections Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {sections.sort((a: any, b: any) => a.orderIndex - b.orderIndex).map((section: any) => (
                    <div key={section.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center text-sm font-medium">
                            {section.orderIndex}
                          </div>
                          <div>
                            <h3 className="font-semibold">{section.name}</h3>
                            <p className="text-sm text-slate-500">{section.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={section.isEnabled ? "default" : "secondary"}>
                          {section.isEnabled ? "Visible" : "Hidden"}
                        </Badge>
                        <Switch
                          checked={section.isEnabled}
                          onCheckedChange={() => handleToggleSection(section.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Modules Control */}
          <TabsContent value="modules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-graduation-cap text-green-600"></i>
                  Training Modules Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {modules.sort((a: any, b: any) => a.orderIndex - b.orderIndex).map((module: any) => (
                    <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center text-sm font-medium">
                            {module.orderIndex}
                          </div>
                          <div>
                            <h3 className="font-semibold">{module.title}</h3>
                            <p className="text-sm text-slate-500">{module.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={module.isEnabled ? "default" : "secondary"}>
                          {module.isEnabled ? "Active" : "Disabled"}
                        </Badge>
                        <Switch
                          checked={module.isEnabled}
                          onCheckedChange={() => handleToggleModule(module.id)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNavigate('module-admin')}
                          title="Advanced module settings"
                        >
                          <i className="fas fa-cog mr-1"></i>
                          Settings
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Management Control */}
          <TabsContent value="tests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-clipboard-check text-purple-600"></i>
                  Test Assignment Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {testAssignments.map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold">{assignment.testTitle}</h3>
                            <p className="text-sm text-slate-500">
                              Assigned to: {assignment.userEmail} • Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No deadline'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Max Attempts:</Label>
                          <Select
                            value={String(assignment.maxAttempts || 3)}
                            onValueChange={(value) => handleUpdateMaxAttempts(assignment.id, parseInt(value))}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="999">Unlimited</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Badge variant={assignment.isCompleted ? "default" : "secondary"}>
                          {assignment.isCompleted ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Control */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-file-alt text-orange-600"></i>
                  Content Management Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Learning Materials</h3>
                    <p className="text-sm text-slate-500 mb-4">Manage documents, videos, and resources</p>
                    <Button
                      variant="outline"
                      onClick={() => onNavigate('materials')}
                      className="w-full"
                    >
                      <i className="fas fa-folder-open mr-2"></i>
                      Manage Materials
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Test Creation</h3>
                    <p className="text-sm text-slate-500 mb-4">Create and manage knowledge assessments</p>
                    <Button
                      variant="outline"
                      onClick={() => onNavigate('tests')}
                      className="w-full"
                    >
                      <i className="fas fa-clipboard-list mr-2"></i>
                      Manage Tests
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">User Management</h3>
                    <p className="text-sm text-slate-500 mb-4">Manage student accounts and progress</p>
                    <Button
                      variant="outline"
                      onClick={() => onNavigate('users')}
                      className="w-full"
                    >
                      <i className="fas fa-users mr-2"></i>
                      Manage Users
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Practice Calls</h3>
                    <p className="text-sm text-slate-500 mb-4">Monitor roleplay sessions and outcomes</p>
                    <Button
                      variant="outline"
                      onClick={() => onNavigate('practice-calls')}
                      className="w-full"
                    >
                      <i className="fas fa-phone mr-2"></i>
                      View Call Logs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}