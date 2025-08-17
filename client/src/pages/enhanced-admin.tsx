import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  StickyNote, 
  CheckSquare, 
  PlusCircle, 
  MessageSquare, 
  Calendar,
  Clock,
  User,
  Mail,
  BookOpen,
  Award,
  TrendingUp,
  FileText,
  Eye,
  EyeOff,
  Trash2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type User as DbUser, type Note, type Task } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const noteSchema = z.object({
  body: z.string().min(1, "Note content is required"),
  isVisibleToStudent: z.boolean().default(false)
});

const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  details: z.string().optional(),
  dueAt: z.string().optional()
});

type NoteFormData = z.infer<typeof noteSchema>;
type TaskFormData = z.infer<typeof taskSchema>;

interface ExtendedUser extends DbUser {
  totalAttempts?: number;
  averageScore?: number;
  lastActivity?: string;
  notes?: Note[];
  tasks?: Task[];
}

interface EnhancedAdminProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function EnhancedAdminPage({ user, onNavigate, onLogout }: EnhancedAdminProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  const noteForm = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      body: "",
      isVisibleToStudent: false
    }
  });

  const taskForm = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      details: "",
      dueAt: ""
    }
  });

  // Fetch all users for admin management
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Fetch user notes when a user is selected
  const { data: notesData, refetch: refetchNotes } = useQuery({
    queryKey: ["/api/users", selectedUser?.id, "notes"],
    enabled: !!selectedUser?.id
  });

  // Fetch user tasks when a user is selected
  const { data: tasksData, refetch: refetchTasks } = useQuery({
    queryKey: ["/api/users", selectedUser?.id, "tasks"],
    enabled: !!selectedUser?.id
  });

  // Fetch all test attempts for analytics
  const { data: attemptsData } = useQuery({
    queryKey: ["/api/attempts"],
  });

  const createNoteMutation = useMutation({
    mutationFn: (data: NoteFormData) => apiRequest("POST", `/api/users/${selectedUser?.id}/notes`, data),
    onSuccess: () => {
      refetchNotes();
      setIsNoteDialogOpen(false);
      noteForm.reset();
      toast({
        title: "Note Added",
        description: "Student note has been created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive"
      });
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: TaskFormData) => apiRequest("POST", `/api/users/${selectedUser?.id}/tasks`, data),
    onSuccess: () => {
      refetchTasks();
      setIsTaskDialogOpen(false);
      taskForm.reset();
      toast({
        title: "Task Assigned",
        description: "Task has been assigned to student successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: any }) => 
      apiRequest(`/api/tasks/${taskId}`, "PATCH", updates),
    onSuccess: () => {
      refetchTasks();
      toast({
        title: "Task Updated",
        description: "Task status has been updated"
      });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => apiRequest("DELETE", `/api/notes/${noteId}`),
    onSuccess: () => {
      refetchNotes();
      toast({
        title: "Note Deleted",
        description: "Note has been successfully deleted."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmitNote = (data: NoteFormData) => {
    createNoteMutation.mutate(data);
  };

  const onSubmitTask = (data: TaskFormData) => {
    const taskData = {
      ...data,
      dueAt: data.dueAt ? new Date(data.dueAt).toISOString() : undefined
    };
    createTaskMutation.mutate(taskData);
  };

  const toggleTaskStatus = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "OPEN" ? "DONE" : "OPEN";
    updateTaskMutation.mutate({ 
      taskId, 
      updates: { 
        status: newStatus,
        completedAt: newStatus === "DONE" ? new Date().toISOString() : null
      }
    });
  };

  if (usersLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <div className="text-center">Loading admin dashboard...</div>
      </div>
    );
  }

  const users = (usersData as any)?.users || [];
  const attempts = (attemptsData as any)?.attempts || [];
  const notes = (notesData as any)?.notes || [];
  const tasks = (tasksData as any)?.tasks || [];

  // Calculate user statistics
  const enhancedUsers = users.map((user: DbUser) => {
    const userAttempts = attempts.filter((attempt: any) => attempt.userId === user.id);
    const averageScore = userAttempts.length > 0 
      ? Math.round(userAttempts.reduce((sum: number, attempt: any) => sum + (attempt.scorePercent || 0), 0) / userAttempts.length)
      : 0;
    const lastActivity = userAttempts.length > 0 
      ? new Date(Math.max(...userAttempts.map((a: any) => new Date(a.startedAt).getTime()))).toLocaleDateString()
      : "Never";

    return {
      ...user,
      totalAttempts: userAttempts.length,
      averageScore,
      lastActivity
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => onNavigate("dashboard")}
            className="gap-2"
          >
            ← Back to Home Page
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Enhanced Admin Home Page</h1>
        <p className="text-muted-foreground">Comprehensive student management with notes, tasks, and analytics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students ({users.length})
              </CardTitle>
              <CardDescription>
                Click on a student to view details and manage notes/tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {enhancedUsers.map((user: ExtendedUser) => (
                    <Card 
                      key={user.id} 
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedUser?.id === user.id ? 'bg-primary/10 border-primary' : ''
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{user.name}</span>
                            </div>
                            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                              {user.role}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              <span>{user.totalAttempts} tests</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              <span>{user.averageScore}% avg</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Last: {user.lastActivity}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Student Details */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
                <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {selectedUser.name}
                    </CardTitle>
                    <CardDescription>{selectedUser.email}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <div className="text-2xl font-bold">{selectedUser.totalAttempts}</div>
                        <div className="text-sm text-muted-foreground">Total Tests</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <Award className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <div className="text-2xl font-bold">{selectedUser.averageScore}%</div>
                        <div className="text-sm text-muted-foreground">Average Score</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <StickyNote className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                        <div className="text-2xl font-bold">{notes.length}</div>
                        <div className="text-sm text-muted-foreground">Notes</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <CheckSquare className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                        <div className="text-2xl font-bold">{tasks.filter((t: any) => t.status === "OPEN").length}</div>
                        <div className="text-sm text-muted-foreground">Open Tasks</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Student Notes</h3>
                  <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Add Note
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Note for {selectedUser.name}</DialogTitle>
                        <DialogDescription>
                          Create a note to track student progress and observations
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...noteForm}>
                        <form onSubmit={noteForm.handleSubmit(onSubmitNote)} className="space-y-4">
                          <FormField
                            control={noteForm.control}
                            name="body"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Note Content</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter your observations about this student..."
                                    className="min-h-[100px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={noteForm.control}
                            name="isVisibleToStudent"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Visible to Student
                                  </FormLabel>
                                  <FormDescription>
                                    Allow the student to see this note
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsNoteDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createNoteMutation.isPending}>
                              {createNoteMutation.isPending ? "Adding..." : "Add Note"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4">
                  {notes.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <StickyNote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Notes Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Add notes to track this student's progress and observations
                        </p>
                        <Button onClick={() => setIsNoteDialogOpen(true)} className="gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Add First Note
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    notes.map((note: Note) => (
                      <Card key={note.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {new Date(note.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {note.isVisibleToStudent ? (
                                <Eye className="h-4 w-4 text-green-500" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                              <Badge variant={note.isVisibleToStudent ? "default" : "secondary"}>
                                {note.isVisibleToStudent ? "Visible" : "Private"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNoteMutation.mutate(note.id)}
                                disabled={deleteNoteMutation.isPending}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm">{note.body}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Student Tasks</h3>
                  <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Assign Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Task to {selectedUser.name}</DialogTitle>
                        <DialogDescription>
                          Create a task for the student to complete
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...taskForm}>
                        <form onSubmit={taskForm.handleSubmit(onSubmitTask)} className="space-y-4">
                          <FormField
                            control={taskForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Task Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter task title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={taskForm.control}
                            name="details"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Task Details (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter detailed instructions..."
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={taskForm.control}
                            name="dueAt"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Due Date (Optional)</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsTaskDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createTaskMutation.isPending}>
                              {createTaskMutation.isPending ? "Assigning..." : "Assign Task"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4">
                  {tasks.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Tasks Assigned</h3>
                        <p className="text-muted-foreground mb-4">
                          Assign tasks to help guide this student's learning
                        </p>
                        <Button onClick={() => setIsTaskDialogOpen(true)} className="gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Assign First Task
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    tasks.map((task: Task) => (
                      <Card key={task.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleTaskStatus(task.id, task.status)}
                                className="p-1"
                              >
                                <CheckSquare 
                                  className={`h-4 w-4 ${
                                    task.status === "DONE" ? "text-green-500" : "text-muted-foreground"
                                  }`} 
                                />
                              </Button>
                              <h4 className={`font-medium ${
                                task.status === "DONE" ? "line-through text-muted-foreground" : ""
                              }`}>
                                {task.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={task.status === "DONE" ? "default" : "secondary"}>
                                {task.status}
                              </Badge>
                              {task.dueAt && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(task.dueAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {task.details && (
                            <p className="text-sm text-muted-foreground mb-2">{task.details}</p>
                          )}
                          
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                            {task.completedAt && (
                              <span>Completed: {new Date(task.completedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Learning Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center text-muted-foreground">
                        Detailed progress analytics coming soon...
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-16">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select a Student</h3>
                <p className="text-muted-foreground">
                  Choose a student from the list to view their details, manage notes, and assign tasks
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}