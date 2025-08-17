
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Settings, MessageSquare, ClipboardCheck, TrendingUp, Trash2, Edit, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout";
import { User } from "@/lib/types";

interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  memberCount?: number;
}

interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: User;
}

interface GroupWithMembers extends Group {
  members: GroupMember[];
}

interface GroupNote {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  body: string;
  isAnnouncement: boolean;
  createdAt: string;
  author: User;
  responses: GroupNoteResponse[];
}

interface GroupNoteResponse {
  id: string;
  groupNoteId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author: User;
}

interface GroupManagementProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function GroupManagement({ user, onNavigate, onLogout }: GroupManagementProps) {
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("MEMBER");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [assignTestDialogOpen, setAssignTestDialogOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [testDueDate, setTestDueDate] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all groups
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/groups"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/groups");
      return response.json();
    }
  });

  // Fetch all users (for adding to groups)
  const { data: usersData } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      return response.json();
    }
  });

  // Fetch all tests (for assignment)
  const { data: testsData } = useQuery({
    queryKey: ["/api/tests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tests");
      return response.json();
    }
  });

  // Fetch group details when selected
  const { data: groupDetails } = useQuery({
    queryKey: ["/api/groups", selectedGroup?.id],
    queryFn: async () => {
      if (!selectedGroup?.id) return null;
      const response = await apiRequest("GET", `/api/groups/${selectedGroup.id}`);
      return response.json();
    },
    enabled: !!selectedGroup?.id
  });

  // Fetch group notes
  const { data: groupNotesData } = useQuery({
    queryKey: ["/api/groups", selectedGroup?.id, "notes"],
    queryFn: async () => {
      if (!selectedGroup?.id) return null;
      const response = await apiRequest("GET", `/api/groups/${selectedGroup.id}/notes`);
      return response.json();
    },
    enabled: !!selectedGroup?.id
  });

  // Fetch group performance
  const { data: groupPerformanceData } = useQuery({
    queryKey: ["/api/groups", selectedGroup?.id, "performance"],
    queryFn: async () => {
      if (!selectedGroup?.id) return null;
      const response = await apiRequest("GET", `/api/groups/${selectedGroup.id}/performance`);
      return response.json();
    },
    enabled: !!selectedGroup?.id
  });

  const groups = groupsData?.groups || [];
  const users = usersData?.users || [];
  const students = users.filter((u: User) => u.role === "STUDENT");
  const tests = testsData?.tests || testsData?.publicTests || [];
  const notes = groupNotesData?.notes || [];
  const performance = groupPerformanceData?.performance || [];

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { name: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/groups", groupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Group created successfully" });
      setCreateDialogOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
    },
    onError: () => {
      toast({ title: "Failed to create group", variant: "destructive" });
    }
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Group> }) => {
      const response = await apiRequest("PUT", `/api/groups/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Group updated successfully" });
      setEditDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update group", variant: "destructive" });
    }
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await apiRequest("DELETE", `/api/groups/${groupId}`);
      return response.json();
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Group deleted successfully" });
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
    },
    onError: () => {
      toast({ title: "Failed to delete group", variant: "destructive" });
    }
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId, role }: { groupId: string; userId: string; role: string }) => {
      const response = await apiRequest("POST", `/api/groups/${groupId}/members`, { userId, role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", selectedGroup?.id] });
      toast({ title: "Member added successfully" });
      setAddMemberDialogOpen(false);
      setSelectedUserId("");
    },
    onError: () => {
      toast({ title: "Failed to add member", variant: "destructive" });
    }
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const response = await apiRequest("DELETE", `/api/groups/${groupId}/members/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", selectedGroup?.id] });
      toast({ title: "Member removed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to remove member", variant: "destructive" });
    }
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async ({ groupId, title, body, isAnnouncement }: { 
      groupId: string; 
      title: string; 
      body: string; 
      isAnnouncement: boolean; 
    }) => {
      const response = await apiRequest("POST", `/api/groups/${groupId}/notes`, { 
        title, 
        body, 
        isAnnouncement 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", selectedGroup?.id, "notes"] });
      toast({ title: "Note created successfully" });
      setNoteDialogOpen(false);
      setNoteTitle("");
      setNoteBody("");
    },
    onError: () => {
      toast({ title: "Failed to create note", variant: "destructive" });
    }
  });

  // Assign test mutation
  const assignTestMutation = useMutation({
    mutationFn: async ({ groupId, testId, dueDate }: { 
      groupId: string; 
      testId: string; 
      dueDate?: string; 
    }) => {
      const response = await apiRequest("POST", `/api/groups/${groupId}/assign-test`, { 
        testId, 
        dueDate 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Test assigned to group successfully" });
      setAssignTestDialogOpen(false);
      setSelectedTestId("");
      setTestDueDate("");
    },
    onError: () => {
      toast({ title: "Failed to assign test", variant: "destructive" });
    }
  });

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      createGroupMutation.mutate({
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined
      });
    }
  };

  const handleUpdateGroup = () => {
    if (selectedGroup && newGroupName.trim()) {
      updateGroupMutation.mutate({
        id: selectedGroup.id,
        updates: {
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || undefined
        }
      });
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  const handleAddMember = () => {
    if (selectedGroup && selectedUserId) {
      addMemberMutation.mutate({
        groupId: selectedGroup.id,
        userId: selectedUserId,
        role: selectedRole
      });
    }
  };

  const handleRemoveMember = (userId: string) => {
    if (selectedGroup) {
      removeMemberMutation.mutate({
        groupId: selectedGroup.id,
        userId
      });
    }
  };

  const handleCreateNote = () => {
    if (selectedGroup && noteTitle.trim() && noteBody.trim()) {
      createNoteMutation.mutate({
        groupId: selectedGroup.id,
        title: noteTitle.trim(),
        body: noteBody.trim(),
        isAnnouncement: false
      });
    }
  };

  const handleAssignTest = () => {
    if (selectedGroup && selectedTestId) {
      assignTestMutation.mutate({
        groupId: selectedGroup.id,
        testId: selectedTestId,
        dueDate: testDueDate || undefined
      });
    }
  };

  const availableStudents = students.filter((student: User) => 
    !groupDetails?.group?.members?.some((member: GroupMember) => member.userId === student.id)
  );

  if (groupsLoading) {
    return (
      <Layout user={user} currentPage="group-management" onNavigate={onNavigate} onLogout={onLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} currentPage="group-management" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Group Management</h2>
              <p className="text-slate-600">Manage student groups and track performance</p>
            </div>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <Label htmlFor="group-description">Description (Optional)</Label>
                  <Textarea
                    id="group-description"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Enter group description"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
                    Create Group
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Groups List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Student Groups ({groups.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {groups.map((group: Group) => (
                  <div
                    key={group.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedGroup?.id === group.id 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedGroup(group as GroupWithMembers)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-slate-500">
                          {group.memberCount || 0} members
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGroup(group as GroupWithMembers);
                            setNewGroupName(group.name);
                            setNewGroupDescription(group.description || "");
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {groups.length === 0 && (
                  <p className="text-center text-slate-500 py-8">
                    No groups created yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Group Details */}
          <div className="lg:col-span-2">
            {selectedGroup ? (
              <Tabs defaultValue="members" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="notes">Communication</TabsTrigger>
                  <TabsTrigger value="tests">Tests</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Group Members</CardTitle>
                        <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <UserPlus className="w-4 h-4 mr-2" />
                              Add Member
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Member to {selectedGroup.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Select Student</Label>
                                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose a student..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableStudents.map((student: User) => (
                                      <SelectItem key={student.id} value={student.id}>
                                        {student.name || student.email}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Role</Label>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MEMBER">Member</SelectItem>
                                    <SelectItem value="LEADER">Leader</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleAddMember} disabled={!selectedUserId}>
                                  Add Member
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {groupDetails?.group?.members?.map((member: GroupMember) => (
                          <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{member.user.name || member.user.email}</p>
                                <p className="text-sm text-slate-500">{member.user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={member.role === "LEADER" ? "default" : "secondary"}>
                                {member.role}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveMember(member.userId)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {(!groupDetails?.group?.members || groupDetails.group.members.length === 0) && (
                          <p className="text-center text-slate-500 py-8">
                            No members in this group yet
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Group Communication</CardTitle>
                        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Post Note
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Post Note to {selectedGroup.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Title</Label>
                                <Input
                                  value={noteTitle}
                                  onChange={(e) => setNoteTitle(e.target.value)}
                                  placeholder="Enter note title"
                                />
                              </div>
                              <div>
                                <Label>Message</Label>
                                <Textarea
                                  value={noteBody}
                                  onChange={(e) => setNoteBody(e.target.value)}
                                  placeholder="Enter your message"
                                  rows={4}
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleCreateNote} disabled={!noteTitle.trim() || !noteBody.trim()}>
                                  Post Note
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {notes.map((note: GroupNote) => (
                          <div key={note.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{note.title}</h4>
                              <div className="flex items-center space-x-2">
                                {note.isAnnouncement && (
                                  <Badge variant="default">Announcement</Badge>
                                )}
                                <span className="text-sm text-slate-500">
                                  {new Date(note.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-slate-700 mb-2">{note.body}</p>
                            <p className="text-sm text-slate-500">
                              By {note.author.name || note.author.email}
                            </p>
                            {note.responses && note.responses.length > 0 && (
                              <div className="mt-3 pl-4 border-l-2 border-slate-200 space-y-2">
                                {note.responses.map((response: GroupNoteResponse) => (
                                  <div key={response.id} className="text-sm">
                                    <p className="text-slate-700">{response.body}</p>
                                    <p className="text-slate-500">
                                      By {response.author.name || response.author.email} • {new Date(response.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {notes.length === 0 && (
                          <p className="text-center text-slate-500 py-8">
                            No notes posted yet
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tests" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Test Assignments</CardTitle>
                        <Dialog open={assignTestDialogOpen} onOpenChange={setAssignTestDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <ClipboardCheck className="w-4 h-4 mr-2" />
                              Assign Test
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assign Test to {selectedGroup.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Select Test</Label>
                                <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose a test..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {tests.map((test: any) => (
                                      <SelectItem key={test.id} value={test.id}>
                                        {test.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Due Date (Optional)</Label>
                                <Input
                                  type="datetime-local"
                                  value={testDueDate}
                                  onChange={(e) => setTestDueDate(e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setAssignTestDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleAssignTest} disabled={!selectedTestId}>
                                  Assign Test
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-center text-slate-500 py-8">
                        Test assignment tracking coming soon
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Group Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {performance.map((memberData: any) => (
                          <div key={memberData.member.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">
                                {memberData.member.name || memberData.member.email}
                              </h4>
                              <Badge variant="outline">
                                {memberData.testResults.length} tests completed
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-slate-500">Progress Modules</p>
                                <p className="font-medium">{memberData.progress.length}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Tests Completed</p>
                                <p className="font-medium">{memberData.testResults.length}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Average Score</p>
                                <p className="font-medium">
                                  {memberData.testResults.length > 0 
                                    ? Math.round(
                                        memberData.testResults.reduce((sum: number, result: any) => 
                                          sum + (result.attempt.scorePercent || 0), 0
                                        ) / memberData.testResults.length
                                      ) + "%"
                                    : "N/A"
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {performance.length === 0 && (
                          <p className="text-center text-slate-500 py-8">
                            No performance data available
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="text-center py-16">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a Group</h3>
                  <p className="text-muted-foreground">
                    Choose a group from the list to view details, manage members, and track performance
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Group Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-group-name">Group Name</Label>
                <Input
                  id="edit-group-name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <Label htmlFor="edit-group-description">Description (Optional)</Label>
                <Textarea
                  id="edit-group-description"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Enter group description"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateGroup} disabled={!newGroupName.trim()}>
                  Update Group
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
