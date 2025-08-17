import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "@/lib/types";
import { Layout } from "@/components/layout";
import { GroupManagement } from "@/components/group-management";

interface AdminUser extends User {
  createdAt: string;
}

interface UserProgress {
  id: string;
  module: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  score?: number;
  attempts: number;
  lastTouched: string;
}

interface PracticeCall {
  id: string;
  scenario: string;
  startedAt: string;
  endedAt?: string;
  outcome?: "PASSED" | "IMPROVE" | "N/A";
  notes?: string;
}

interface AdminPageProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function AdminPage({ user, onNavigate, onLogout }: AdminPageProps) {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    }
  });

  const { data: userProgress, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/admin/users", selectedUser?.id, "progress"],
    enabled: !!selectedUser,
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${selectedUser!.id}/progress`);
      if (!response.ok) throw new Error("Failed to fetch progress");
      return response.json();
    }
  });

  const { data: userPracticeCalls, isLoading: callsLoading } = useQuery({
    queryKey: ["/api/admin/users", selectedUser?.id, "practice-calls"],
    enabled: !!selectedUser,
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${selectedUser!.id}/practice-calls`);
      if (!response.ok) throw new Error("Failed to fetch practice calls");
      return response.json();
    }
  });

  const users: AdminUser[] = usersData?.users || [];
  const progress: UserProgress[] = userProgress?.progress || [];
  const practiceCalls: PracticeCall[] = userPracticeCalls?.calls || [];

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setUserDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800";
      case "NOT_STARTED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-100 text-red-800";
      case "TRAINER": return "bg-blue-100 text-blue-800";
      case "STUDENT": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case "PASSED": return "bg-green-100 text-green-800";
      case "IMPROVE": return "bg-yellow-100 text-yellow-800";
      case "N/A": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (usersLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} currentPage="admin" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-600">Manage users and monitor training progress</p>
        </div>
        <Badge variant="secondary" className="bg-red-100 text-red-700">
          <i className="fas fa-shield-alt mr-1"></i>
          Admin Access
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.role === "STUDENT").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Trainers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === "TRAINER").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => u.role === "ADMIN").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="groups">Student Groups</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">User</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Created</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-slate-800">{user.name || "No name"}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        onClick={() => handleViewUser(user)}
                        variant="outline"
                        size="sm"
                      >
                        <i className="fas fa-eye mr-2"></i>
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-blue-600"></i>
              </div>
              <div>
                <span>{selectedUser?.name || "No name"}</span>
                <p className="text-sm font-normal text-slate-500">{selectedUser?.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <Tabs defaultValue="progress" className="h-full">
              <TabsList>
                <TabsTrigger value="progress">Training Progress</TabsTrigger>
                <TabsTrigger value="calls">Practice Calls</TabsTrigger>
              </TabsList>

              <TabsContent value="progress" className="mt-4">
                <ScrollArea className="h-96">
                  {progressLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {progress.map((prog) => (
                        <div key={prog.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-slate-800">{prog.module.replace(/_/g, " ")}</h4>
                            <Badge className={getStatusColor(prog.status)}>
                              {prog.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
                            <div>
                              <span className="font-medium">Score:</span> {prog.score || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">Attempts:</span> {prog.attempts}
                            </div>
                            <div>
                              <span className="font-medium">Last Activity:</span>{" "}
                              {new Date(prog.lastTouched).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      {progress.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          No progress data available
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="calls" className="mt-4">
                <ScrollArea className="h-96">
                  {callsLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {practiceCalls.map((call) => (
                        <div key={call.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-slate-800">{call.scenario}</h4>
                            {call.outcome && (
                              <Badge className={getOutcomeColor(call.outcome)}>
                                {call.outcome}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-2">
                            <div>
                              <span className="font-medium">Started:</span>{" "}
                              {new Date(call.startedAt).toLocaleString()}
                            </div>
                            {call.endedAt && (
                              <div>
                                <span className="font-medium">Ended:</span>{" "}
                                {new Date(call.endedAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                          {call.notes && (
                            <div className="text-sm">
                              <span className="font-medium text-slate-600">Notes:</span>
                              <p className="text-slate-600 mt-1">{call.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                      {practiceCalls.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          No practice calls recorded
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setUserDetailsOpen(false)} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </TabsContent>
        
        <TabsContent value="groups" className="mt-6">
          <GroupManagement />
        </TabsContent>
      </Tabs>
      </div>
    </Layout>
  );
}