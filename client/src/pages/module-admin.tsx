import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { User } from "@/lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TrainingModule } from "@shared/schema";

interface ModuleAdminProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// TrainingModule type now imported from shared/schema

export default function ModuleAdmin({ user, onNavigate, onLogout }: ModuleAdminProps) {
  const { toast } = useToast();
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load modules from API
  const { data: modulesData, isLoading } = useQuery({
    queryKey: ['/api/modules'],
  });
  
  const modules = (modulesData as any)?.modules || [];

  // Mutations for module operations
  const createModuleMutation = useMutation({
    mutationFn: (moduleData: any) => apiRequest('POST', '/api/modules', moduleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      setEditingModule(null);
      setShowCreateForm(false);
      toast({
        title: "Module Created",
        description: "Training module has been created successfully."
      });
    }
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, ...updates }: any) => apiRequest('PATCH', `/api/modules/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      setEditingModule(null);
      setShowCreateForm(false);
      toast({
        title: "Module Updated",
        description: "Training module has been updated successfully."
      });
    }
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/modules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      toast({
        title: "Module Deleted",
        description: "Training module has been removed."
      });
    }
  });

  const reorderModuleMutation = useMutation({
    mutationFn: (moduleOrders: any) => apiRequest('POST', '/api/modules/reorder', { moduleOrders }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
    }
  });

  const handleCreateModule = () => {
    const newModule = {
      id: '',
      title: "",
      description: "",
      isEnabled: true,
      orderIndex: modules.length,
      scenarios: [],
      estimatedDuration: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setEditingModule(newModule as TrainingModule);
    setShowCreateForm(true);
  };

  const handleSaveModule = (module: TrainingModule) => {
    if (showCreateForm) {
      createModuleMutation.mutate(module);
    } else {
      updateModuleMutation.mutate(module);
    }
  };

  const handleDeleteModule = (moduleId: string) => {
    deleteModuleMutation.mutate(moduleId);
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

  const handleReorderModule = (moduleId: string, direction: 'up' | 'down') => {
    const moduleIndex = modules.findIndex((m: any) => m.id === moduleId);
    if (moduleIndex === -1) return;

    const newModules = [...modules];
    const targetIndex = direction === 'up' ? moduleIndex - 1 : moduleIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    // Swap modules
    [newModules[moduleIndex], newModules[targetIndex]] = [newModules[targetIndex], newModules[moduleIndex]];
    
    // Update order indices and prepare for API call
    const moduleOrders = newModules.map((module: any, index: number) => ({
      id: module.id,
      orderIndex: index
    }));
    
    reorderModuleMutation.mutate(moduleOrders);
  };

  if (isLoading) {
    return (
      <Layout user={user} currentPage="module-admin" onNavigate={onNavigate} onLogout={onLogout}>
        <div className="max-w-6xl mx-auto p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading modules...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} currentPage="module-admin" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Training Module Management</h1>
            <p className="text-slate-600 mt-1">Configure and manage training modules for all students</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onNavigate('dashboard')} variant="outline">
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Dashboard
            </Button>
            <Button onClick={handleCreateModule}>
              <i className="fas fa-plus mr-2"></i>
              Add New Module
            </Button>
          </div>
        </div>

        {/* Module List */}
        <div className="space-y-4">
          {modules
            .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
            .map((module: any, index: number) => (
            <Card key={module.id} className={`transition-all ${!module.isEnabled ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">{module.title}</h3>
                      <Badge variant={module.isEnabled ? "default" : "secondary"}>
                        {module.isEnabled ? "Active" : "Disabled"}
                      </Badge>
                      {module.id.startsWith('custom_') && (
                        <Badge variant="outline" className="text-purple-600 border-purple-300">
                          Custom
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-600 mb-3">{module.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>
                        <i className="fas fa-clock mr-1"></i>
                        {module.estimatedDuration} minutes
                      </span>
                      <span>
                        <i className="fas fa-list mr-1"></i>
                        {module.scenarios?.length || 0} scenarios
                      </span>
                      <span>
                        <i className="fas fa-sort mr-1"></i>
                        Order: {index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReorderModule(module.id, 'up')}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <i className="fas fa-chevron-up text-xs"></i>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReorderModule(module.id, 'down')}
                        disabled={index === modules.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <i className="fas fa-chevron-down text-xs"></i>
                      </Button>
                    </div>
                    
                    {/* Toggle switch */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-slate-500">Enabled</span>
                      <Switch
                        checked={module.isEnabled}
                        onCheckedChange={() => handleToggleModule(module.id)}
                      />
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingModule(module)}
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      {module.id.startsWith('custom_') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteModule(module.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {modules.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <i className="fas fa-graduation-cap text-4xl text-slate-400 mb-4"></i>
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No Training Modules</h3>
              <p className="text-slate-500 mb-4">Create your first training module to get started.</p>
              <Button onClick={handleCreateModule}>
                <i className="fas fa-plus mr-2"></i>
                Add First Module
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit/Create Module Modal */}
        {editingModule && (
          <ModuleEditModal
            module={editingModule}
            isCreating={showCreateForm}
            onSave={handleSaveModule}
            onCancel={() => {
              setEditingModule(null);
              setShowCreateForm(false);
            }}
          />
        )}
      </div>
    </Layout>
  );
}

interface ModuleEditModalProps {
  module: TrainingModule;
  isCreating: boolean;
  onSave: (module: TrainingModule) => void;
  onCancel: () => void;
}

function ModuleEditModal({ module, isCreating, onSave, onCancel }: ModuleEditModalProps) {
  const [formData, setFormData] = useState(module);
  const [scenariosText, setScenariosText] = useState(module.scenarios?.join('\n') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    const scenarios = scenariosText.split('\n').filter(s => s.trim()).map(s => s.trim());
    
    onSave({
      ...formData,
      scenarios
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>
            {isCreating ? 'Create New Training Module' : 'Edit Training Module'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Module Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter module title..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter module description..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Estimated Duration (minutes)
              </label>
              <Input
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 30 })}
                min="1"
                max="180"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Practice Scenarios (one per line)
              </label>
              <Textarea
                value={scenariosText}
                onChange={(e) => setScenariosText(e.target.value)}
                placeholder="Enter practice scenarios, one per line..."
                rows={5}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
              />
              <label className="text-sm font-medium text-slate-700">
                Enable this module for students
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                <i className="fas fa-save mr-2"></i>
                {isCreating ? 'Create Module' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}