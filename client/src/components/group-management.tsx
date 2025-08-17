import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Plus, Edit, Trash2, UserPlus, UserMinus } from "lucide-react";

interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  memberCount: number;
}

interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: "MEMBER" | "LEADER";
  joinedAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

interface GroupWithMembers extends Omit<Group, 'memberCount'> {
  members: GroupMember[];
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export function GroupManagement() {
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
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

  // Fetch group details
  const { data: groupDetails } = useQuery({
    queryKey: ["/api/groups", selectedGroup?.id],
    enabled: !!selectedGroup && groupDetailsOpen,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/groups/${selectedGroup!.id}`);
      return response.json();
    }
  });

  const groups: Group[] = groupsData?.groups || [];
  const users: User[] = usersData?.users || [];
  const students = users.filter(user => user.role === "STUDENT");

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/groups", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setCreateDialogOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
      toast({ title: "Group created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create group", variant: "destructive" });
    }
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await apiRequest("DELETE", `/api/groups/${groupId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Group deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete group", variant: "destructive" });
    }
  });

  // Add members mutation
  const addMembersMutation = useMutation({
    mutationFn: async ({ groupId, userIds }: { groupId: string; userIds: string[] }) => {
      const response = await apiRequest("POST", `/api/groups/${groupId}/members`, { userIds });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", selectedGroup?.id] });
      setAddMemberDialogOpen(false);
      setSelectedStudents([]);
      toast({ title: "Members added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add members", variant: "destructive" });
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

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      createGroupMutation.mutate({
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined
      });
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  const handleViewGroup = (group: Group) => {
    setSelectedGroup({ ...group, members: [] });
    setGroupDetailsOpen(true);
  };

  const handleAddMembers = () => {
    if (selectedGroup && selectedStudents.length > 0) {
      addMembersMutation.mutate({
        groupId: selectedGroup.id,
        userIds: selectedStudents
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

  const availableStudents = students.filter(student => 
    !groupDetails?.group?.members?.some((member: GroupMember) => member.userId === student.id)
  );

  if (groupsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Student Groups</h2>
            <p className="text-slate-600">Manage student groups and memberships</p>
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
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim() || createGroupMutation.isPending}
                >
                  {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Card key={group.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                </Badge>
              </div>
              {group.description && (
                <p className="text-sm text-slate-600 mt-2">{group.description}</p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </span>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewGroup(group)}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No groups yet</h3>
            <p className="text-slate-500 mb-4">Create your first student group to get started</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Group Details Dialog */}
      <Dialog open={groupDetailsOpen} onOpenChange={setGroupDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-primary" />
              <div>
                <span>{selectedGroup?.name}</span>
                <p className="text-sm font-normal text-slate-500">
                  {groupDetails?.group?.members?.length || 0} members
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedGroup && (
            <Tabs defaultValue="members" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="add">Add Members</TabsTrigger>
              </TabsList>
              
              <TabsContent value="members" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Group Members</h3>
                    <Badge variant="secondary">
                      {groupDetails?.group?.members?.length || 0} members
                    </Badge>
                  </div>
                  
                  <ScrollArea className="h-[400px]">
                    {groupDetails?.group?.members?.length > 0 ? (
                      <div className="space-y-2">
                        {groupDetails.group.members.map((member: GroupMember) => (
                          <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-primary font-medium text-sm">
                                  {(member.user.name || member.user.email)[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{member.user.name || "No name"}</p>
                                <p className="text-sm text-slate-500">{member.user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={member.role === "LEADER" ? "default" : "secondary"}>
                                {member.role}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveMember(member.userId)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <UserMinus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-500">No members in this group yet</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>
              
              <TabsContent value="add" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Add Students to Group</h3>
                    <Badge variant="secondary">
                      {availableStudents.length} available
                    </Badge>
                  </div>
                  
                  <ScrollArea className="h-[400px]">
                    {availableStudents.length > 0 ? (
                      <div className="space-y-2">
                        {availableStudents.map((student) => (
                          <div key={student.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents([...selectedStudents, student.id]);
                                } else {
                                  setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                }
                              }}
                              className="w-4 h-4 text-primary"
                            />
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-primary font-medium text-sm">
                                {(student.name || student.email)[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{student.name || "No name"}</p>
                              <p className="text-sm text-slate-500">{student.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <UserPlus className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-500">All students are already in this group</p>
                      </div>
                    )}
                  </ScrollArea>
                  
                  {selectedStudents.length > 0 && (
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAddMembers}
                        disabled={addMembersMutation.isPending}
                      >
                        {addMembersMutation.isPending ? "Adding..." : `Add ${selectedStudents.length} Student${selectedStudents.length > 1 ? 's' : ''}`}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}