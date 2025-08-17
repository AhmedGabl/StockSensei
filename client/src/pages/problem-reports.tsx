import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, ExternalLink, AlertCircle, Clock, CheckCircle2, Edit, Check, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ProblemReport } from "@shared/schema";

interface ProblemReportsProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const CATEGORIES = [
  "Technical Issue",
  "Content Problem", 
  "Account Access",
  "System Bug",
  "Feature Request",
  "Training Material",
  "Practice Calls",
  "Chat Support",
  "Other"
];

const PRIORITY_COLORS = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800", 
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800"
};

const STATUS_COLORS = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  RESOLVED: "bg-green-100 text-green-800"
};

// Admin Notes Dialog Component
const AdminNotesDialog = ({ report, onUpdate, isPending }: { 
  report: ProblemReport & { user?: { name: string; email: string } }, 
  onUpdate: (notes: string) => void, 
  isPending: boolean 
}) => {
  const [notes, setNotes] = useState(report.adminNotes || "");
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    onUpdate(notes);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {report.adminNotes ? "Edit Notes" : "Add Notes"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Notes</DialogTitle>
          <DialogDescription>
            Add or update admin notes for this problem report.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about the resolution, investigation, or next steps..."
            rows={4}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Notes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function ProblemReports({ user, onNavigate, onLogout }: ProblemReportsProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "MEDIUM"
  });

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["/api/problem-reports"],
  });

  const createReportMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/problem-reports", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problem-reports"] });
      setIsDialogOpen(false);
      setFormData({ title: "", description: "", category: "", priority: "MEDIUM" });
      toast({
        title: "Report submitted successfully",
        description: "Your problem report has been sent to the admin team.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit report",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      apiRequest("PATCH", `/api/problem-reports/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problem-reports"] });
      toast({
        title: "Report updated successfully",
        description: "The report status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update report",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    createReportMutation.mutate(formData);
  };

  const handleStatusUpdate = (reportId: string, status: string, adminNotes?: string) => {
    const updates: any = { 
      status,
      updatedAt: new Date().toISOString()
    };
    
    if (status === "RESOLVED") {
      updates.resolvedBy = user.id;
      updates.resolvedAt = new Date().toISOString();
    }
    
    if (adminNotes !== undefined) {
      updates.adminNotes = adminNotes;
    }
    
    updateReportMutation.mutate({ id: reportId, updates });
  };

  const reports = (reportsData as any)?.reports || [];

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4" />;
      case "RESOLVED":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Problem Reports</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => onNavigate("dashboard")} variant="ghost">Back to Home Page</Button>
              <Button onClick={onLogout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Problem Reports</h2>
            <p className="text-gray-600 dark:text-gray-400">Submit and track issues or feature requests</p>
          </div>
          <div className="flex items-center space-x-4">
            {user.role === "ADMIN" && (
              <Button 
                onClick={() => window.open("https://qcn9ppuir8al.feishu.cn/wiki/Uleuw0QX5ivBexkROJncc47YnWb", "_blank")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Admin Problem Doc
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Report Problem
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Report a Problem</DialogTitle>
                  <DialogDescription>
                    Describe the issue you're experiencing and we'll help resolve it.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief description of the problem"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Category *</label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description *</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of the problem, steps to reproduce, etc."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createReportMutation.isPending}>
                      {createReportMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Submit Report
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No reports yet</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                You haven't submitted any problem reports. Click "Report Problem" to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report: ProblemReport & { user?: { name: string; email: string } }) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {report.category} • Submitted {format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        {user.role === "ADMIN" && report.user && (
                          <span> • By {report.user.name} ({report.user.email})</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={PRIORITY_COLORS[report.priority as keyof typeof PRIORITY_COLORS]}>
                        {report.priority}
                      </Badge>
                      <Badge className={STATUS_COLORS[report.status as keyof typeof STATUS_COLORS]}>
                        <StatusIcon status={report.status} />
                        <span className="ml-1">{report.status.replace("_", " ")}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{report.description}</p>
                  
                  {report.adminNotes && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Admin Notes:</h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">{report.adminNotes}</p>
                    </div>
                  )}

                  {report.resolvedAt && (
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      Resolved on {format(new Date(report.resolvedAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  )}

                  {/* Admin Controls */}
                  {user.role === "ADMIN" && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-wrap gap-2">
                        {report.status !== "IN_PROGRESS" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(report.id, "IN_PROGRESS")}
                            disabled={updateReportMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            <Clock className="w-3 h-3" />
                            Mark In Progress
                          </Button>
                        )}
                        {report.status !== "RESOLVED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(report.id, "RESOLVED")}
                            disabled={updateReportMutation.isPending}
                            className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Check className="w-3 h-3" />
                            Mark as Fixed
                          </Button>
                        )}
                        <AdminNotesDialog 
                          report={report}
                          onUpdate={(notes) => handleStatusUpdate(report.id, report.status, notes)}
                          isPending={updateReportMutation.isPending}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}