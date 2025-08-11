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
import { PlusCircle, Play, FileText, Clock, CheckCircle, Users, UserPlus, X } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTestSchema, type Test, type Question, type Option } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const createTestFormSchema = createTestSchema;

type TestFormData = z.infer<typeof createTestFormSchema>;

interface TestWithQuestions extends Test {
  questions?: (Question & { options?: Option[] })[];
}

interface TestsProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function TestsPage({ user, onNavigate, onLogout }: TestsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestWithQuestions | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTestForAssignment, setSelectedTestForAssignment] = useState<Test | null>(null);

  const form = useForm<TestFormData>({
    resolver: zodResolver(createTestFormSchema),
    defaultValues: {
      title: "",
      description: "",
      questions: [
        {
          kind: "MCQ",
          text: "",
          explanation: "",
          options: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false }
          ]
        }
      ]
    }
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control: form.control,
    name: "questions"
  });

  const { data: testsData, isLoading } = useQuery({
    queryKey: ["/api/tests"],
  });

  const { data: attemptsData } = useQuery({
    queryKey: ["/api/attempts"],
  });

  const { data: usersData } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: user.role === "ADMIN"
  });

  const { data: assignedTestsData } = useQuery({
    queryKey: ["/api/assigned-tests"],
    enabled: user.role !== "ADMIN"
  });

  const createTestMutation = useMutation({
    mutationFn: (data: TestFormData) => apiRequest("POST", "/api/tests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Test Created",
        description: "Test has been created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create test",
        variant: "destructive"
      });
    }
  });

  const publishTestMutation = useMutation({
    mutationFn: (testId: string) => apiRequest("PATCH", `/api/tests/${testId}`, { isPublished: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({
        title: "Test Published",
        description: "Test is now available to students"
      });
    }
  });

  const assignTestMutation = useMutation({
    mutationFn: ({ testId, userIds, dueDate }: { testId: string; userIds: string[]; dueDate?: string }) => 
      apiRequest("POST", `/api/tests/${testId}/assign`, { userIds, dueDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      setIsAssignDialogOpen(false);
      toast({
        title: "Test Assigned",
        description: "Test has been assigned to selected students"
      });
    }
  });

  const viewTestMutation = useMutation({
    mutationFn: async (testId: string) => {
      const response = await fetch(`/api/tests/${testId}`);
      return response.json();
    },
    onSuccess: (response: any) => {
      setSelectedTest(response);
    }
  });

  const onSubmit = (data: TestFormData) => {
    createTestMutation.mutate(data);
  };

  const addOption = (questionIndex: number) => {
    const currentOptions = form.getValues(`questions.${questionIndex}.options`) || [];
    form.setValue(`questions.${questionIndex}.options`, [
      ...currentOptions,
      { text: "", isCorrect: false }
    ]);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const currentOptions = form.getValues(`questions.${questionIndex}.options`) || [];
    if (currentOptions.length > 2) {
      const newOptions = currentOptions.filter((_, i) => i !== optionIndex);
      form.setValue(`questions.${questionIndex}.options`, newOptions);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="text-center">Loading tests...</div>
      </div>
    );
  }

  const tests = (testsData as any)?.tests || [];
  const attempts = (attemptsData as any)?.attempts || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => onNavigate("dashboard")}
              className="gap-2"
            >
              ← Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Global Testing System</h1>
              <p className="text-muted-foreground">Create and manage MCQ and True/False tests for students</p>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create New Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Test</DialogTitle>
              <DialogDescription>
                Design a comprehensive test with MCQ and True/False questions
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter test title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Test description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Questions</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendQuestion({
                        kind: "MCQ",
                        text: "",
                        explanation: "",
                        options: [
                          { text: "", isCorrect: false },
                          { text: "", isCorrect: false }
                        ]
                      })}
                      className="gap-2"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Question
                    </Button>
                  </div>

                  {questionFields.map((field, questionIndex) => (
                    <Card key={field.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">Question {questionIndex + 1}</h4>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeQuestion(questionIndex)}
                            disabled={questionFields.length === 1}
                          >
                            Remove
                          </Button>
                        </div>

                        <FormField
                          control={form.control}
                          name={`questions.${questionIndex}.kind`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select question type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="MCQ">Multiple Choice</SelectItem>
                                  <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`questions.${questionIndex}.text`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question Text</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Enter your question" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`questions.${questionIndex}.explanation`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Explanation (Optional)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Explain the correct answer" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {form.watch(`questions.${questionIndex}.kind`) === "MCQ" && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <FormLabel>Answer Options</FormLabel>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(questionIndex)}
                              >
                                Add Option
                              </Button>
                            </div>
                            
                            {form.watch(`questions.${questionIndex}.options`)?.map((_, optionIndex) => (
                              <div key={optionIndex} className="flex gap-2 items-center">
                                <FormField
                                  control={form.control}
                                  name={`questions.${questionIndex}.options.${optionIndex}.text`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input placeholder={`Option ${optionIndex + 1}`} {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name={`questions.${questionIndex}.options.${optionIndex}.isCorrect`}
                                  render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm">Correct</FormLabel>
                                    </FormItem>
                                  )}
                                />
                                
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeOption(questionIndex, optionIndex)}
                                  disabled={(form.watch(`questions.${questionIndex}.options`) || []).length <= 2}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTestMutation.isPending}>
                    {createTestMutation.isPending ? "Creating..." : "Create Test"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {tests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tests Created</h3>
              <p className="text-muted-foreground mb-4">
                Create your first test to start assessing student knowledge
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Create Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tests.map((test: Test) => {
              const testAttempts = attempts.filter((attempt: any) => attempt.testId === test.id);
              const averageScore = testAttempts.length > 0 
                ? Math.round(testAttempts.reduce((sum: number, attempt: any) => sum + (attempt.scorePercent || 0), 0) / testAttempts.length)
                : 0;

              return (
                <Card key={test.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {test.title}
                          <Badge variant={test.isPublished ? "default" : "secondary"}>
                            {test.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </CardTitle>
                        {test.description && (
                          <CardDescription>{test.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewTestMutation.mutate(test.id)}
                          className="gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          View
                        </Button>
                        {user.role === "ADMIN" && (
                          <>
                            {!test.isPublished && (
                              <Button
                                size="sm"
                                onClick={() => publishTestMutation.mutate(test.id)}
                                disabled={publishTestMutation.isPending}
                                className="gap-2"
                              >
                                <Play className="h-4 w-4" />
                                Publish
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTestForAssignment(test);
                                setIsAssignDialogOpen(true);
                              }}
                              className="gap-2"
                            >
                              <UserPlus className="h-4 w-4" />
                              Assign
                            </Button>
                          </>
                        )}
                        {user.role !== "ADMIN" && (
                          <Button
                            size="sm"
                            onClick={() => onNavigate(`test-taking/${test.id}`)}
                            className="gap-2"
                          >
                            <Play className="h-4 w-4" />
                            Take Test
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{testAttempts.length} attempts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span>Avg: {averageScore}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(test.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Test Details Dialog */}
      {selectedTest && (
        <Dialog open={!!selectedTest} onOpenChange={() => setSelectedTest(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTest.title}
                <Badge variant={selectedTest.isPublished ? "default" : "secondary"}>
                  {selectedTest.isPublished ? "Published" : "Draft"}
                </Badge>
              </DialogTitle>
              {selectedTest.description && (
                <DialogDescription>{selectedTest.description}</DialogDescription>
              )}
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedTest.questions?.map((question, index) => (
                <Card key={question.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <Badge variant="outline">{question.kind}</Badge>
                    </div>
                    
                    <p className="text-sm">{question.text}</p>
                    
                    {question.kind === "MCQ" && question.options && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Options:</p>
                        {question.options.map((option, optionIndex) => (
                          <div key={option.id} className="flex items-center gap-2">
                            <span className="text-sm font-mono">{String.fromCharCode(65 + optionIndex)}.</span>
                            <span className={`text-sm ${user.role === "ADMIN" && option.isCorrect ? 'font-semibold text-green-600' : ''}`}>
                              {option.text}
                            </span>
                            {user.role === "ADMIN" && option.isCorrect && (
                              <Badge variant="default" className="text-xs">Correct</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {user.role === "ADMIN" && question.explanation && (
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Explanation:</p>
                        <p className="text-sm">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Test Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Test to Students</DialogTitle>
            <DialogDescription>
              Select students to assign "{selectedTestForAssignment?.title}" test
            </DialogDescription>
          </DialogHeader>
          
          <AssignTestForm
            test={selectedTestForAssignment}
            users={(usersData as any)?.users || []}
            onAssign={(userIds, dueDate) => {
              if (selectedTestForAssignment) {
                assignTestMutation.mutate({
                  testId: selectedTestForAssignment.id,
                  userIds,
                  dueDate
                });
              }
            }}
            isLoading={assignTestMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

interface AssignTestFormProps {
  test: Test | null;
  users: any[];
  onAssign: (userIds: string[], dueDate?: string) => void;
  isLoading: boolean;
}

function AssignTestForm({ test, users, onAssign, isLoading }: AssignTestFormProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");

  const students = users.filter(user => user.role === "STUDENT");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length > 0) {
      onAssign(selectedUsers, dueDate || undefined);
      setSelectedUsers([]);
      setDueDate("");
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === students.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(students.map(student => student.id));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium">Select Students:</label>
          {students.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs"
            >
              {selectedUsers.length === students.length ? "Deselect All" : "Select All"}
            </Button>
          )}
        </div>
        <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2">
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students available</p>
          ) : (
            students.map((user: any) => (
              <div key={user.id} className="flex items-center space-x-2">
                <Checkbox
                  id={user.id}
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedUsers([...selectedUsers, user.id]);
                    } else {
                      setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                    }
                  }}
                />
                <label htmlFor={user.id} className="text-sm font-medium cursor-pointer">
                  {user.name} ({user.email})
                </label>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="dueDate" className="text-sm font-medium">Due Date (Optional):</label>
        <Input
          id="dueDate"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setSelectedUsers([])}>
          Clear Selection
        </Button>
        <Button 
          type="submit" 
          disabled={selectedUsers.length === 0 || isLoading}
        >
          {isLoading ? "Assigning..." : `Assign to ${selectedUsers.length} Student${selectedUsers.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </form>
  );
}