import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Eye, Users, Settings } from "lucide-react";

const createTestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

const createQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  kind: z.enum(["MCQ", "TRUE_FALSE"]),
  options: z.array(z.object({
    text: z.string().min(1, "Option text is required"),
    isCorrect: z.boolean(),
  })).min(2, "At least 2 options required"),
});

interface Test {
  id: string;
  title: string;
  description?: string;
  isPublished: boolean;
  createdAt: string;
}

interface Question {
  id: string;
  text: string;
  kind: "MCQ" | "TRUE_FALSE";
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
}

export default function QuizManagement() {
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [createTestOpen, setCreateTestOpen] = useState(false);
  const [createQuestionOpen, setCreateQuestionOpen] = useState(false);
  const [testDetailsOpen, setTestDetailsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ["/api/tests"],
    queryFn: async () => {
      const response = await fetch("/api/tests");
      if (!response.ok) throw new Error("Failed to fetch tests");
      return response.json();
    }
  });

  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ["/api/tests", selectedTest?.id, "questions"],
    enabled: !!selectedTest,
    queryFn: async () => {
      const response = await fetch(`/api/tests/${selectedTest!.id}`);
      if (!response.ok) throw new Error("Failed to fetch questions");
      return response.json();
    }
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTestSchema>) => {
      const response = await fetch("/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create test");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      setCreateTestOpen(false);
      toast({ title: "Test created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create test", variant: "destructive" });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createQuestionSchema>) => {
      const response = await fetch(`/api/admin/tests/${selectedTest!.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create question");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", selectedTest?.id, "questions"] });
      setCreateQuestionOpen(false);
      toast({ title: "Question added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add question", variant: "destructive" });
    },
  });

  const deleteTestMutation = useMutation({
    mutationFn: async (testId: string) => {
      const response = await fetch(`/api/admin/tests/${testId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete test");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({ title: "Test deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete test", variant: "destructive" });
    },
  });

  const publishTestMutation = useMutation({
    mutationFn: async ({ testId, isPublished }: { testId: string; isPublished: boolean }) => {
      const response = await fetch(`/api/admin/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished }),
      });
      if (!response.ok) throw new Error("Failed to update test");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({ title: "Test updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update test", variant: "destructive" });
    },
  });

  const testForm = useForm<z.infer<typeof createTestSchema>>({
    resolver: zodResolver(createTestSchema),
    defaultValues: { title: "", description: "" },
  });

  const questionForm = useForm<z.infer<typeof createQuestionSchema>>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      text: "",
      kind: "MCQ",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  });

  const tests: Test[] = testsData?.tests || [];
  const questions: Question[] = questionsData?.test?.questions || [];

  const handleCreateTest = (data: z.infer<typeof createTestSchema>) => {
    createTestMutation.mutate(data);
  };

  const handleCreateQuestion = (data: z.infer<typeof createQuestionSchema>) => {
    createQuestionMutation.mutate(data);
  };

  const handleViewTest = (test: Test) => {
    setSelectedTest(test);
    setTestDetailsOpen(true);
  };

  const addOption = () => {
    const currentOptions = questionForm.getValues("options");
    questionForm.setValue("options", [...currentOptions, { text: "", isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    const currentOptions = questionForm.getValues("options");
    if (currentOptions.length > 2) {
      questionForm.setValue("options", currentOptions.filter((_, i) => i !== index));
    }
  };

  if (testsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quiz Management</h2>
          <p className="text-slate-600">Create and manage training quizzes for students</p>
        </div>
        <Dialog open={createTestOpen} onOpenChange={setCreateTestOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-orange hover:bg-brand-red text-white">
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
            </DialogHeader>
            <Form {...testForm}>
              <form onSubmit={testForm.handleSubmit(handleCreateTest)} className="space-y-4">
                <FormField
                  control={testForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quiz Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter quiz title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={testForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter quiz description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setCreateTestOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTestMutation.isPending}>
                    {createTestMutation.isPending ? "Creating..." : "Create Quiz"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quiz List */}
      <div className="grid gap-4">
        {tests.map((test) => (
          <Card key={test.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{test.title}</CardTitle>
                  {test.description && (
                    <p className="text-sm text-slate-600 mt-1">{test.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={test.isPublished ? "bg-brand-green text-white" : "bg-gray-100 text-gray-800"}>
                    {test.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Created: {new Date(test.createdAt).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewTest(test)}
                    className="border-brand-blue brand-blue hover:bg-brand-blue hover:text-white"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Questions
                  </Button>
                  <Button
                    variant={test.isPublished ? "outline" : "default"}
                    size="sm"
                    onClick={() => publishTestMutation.mutate({ 
                      testId: test.id, 
                      isPublished: !test.isPublished 
                    })}
                    className={test.isPublished ? 
                      "border-brand-purple brand-purple hover:bg-brand-purple hover:text-white" : 
                      "bg-brand-purple hover:bg-brand-blue text-white"
                    }
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {test.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteTestMutation.mutate(test.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {tests.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-slate-500">
              <h3 className="text-lg font-medium mb-2">No quizzes yet</h3>
              <p>Create your first quiz to get started with student assessments.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Test Details Modal */}
      <Dialog open={testDetailsOpen} onOpenChange={setTestDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedTest?.title} - Questions</span>
              <Dialog open={createQuestionOpen} onOpenChange={setCreateQuestionOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Question</DialogTitle>
                  </DialogHeader>
                  <Form {...questionForm}>
                    <form onSubmit={questionForm.handleSubmit(handleCreateQuestion)} className="space-y-4">
                      <FormField
                        control={questionForm.control}
                        name="text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Text</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter question text" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={questionForm.control}
                        name="kind"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
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
                      <div>
                        <FormLabel>Answer Options</FormLabel>
                        {questionForm.watch("options").map((_, index) => (
                          <div key={index} className="flex items-center space-x-2 mt-2">
                            <FormField
                              control={questionForm.control}
                              name={`options.${index}.text`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input placeholder={`Option ${index + 1}`} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={questionForm.control}
                              name={`options.${index}.isCorrect`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            {questionForm.watch("options").length > 2 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeOption(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOption}
                          className="mt-2"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Option
                        </Button>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setCreateQuestionOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createQuestionMutation.isPending}>
                          {createQuestionMutation.isPending ? "Adding..." : "Add Question"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {questionsLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {questions.map((question, index) => (
                  <Card key={question.id}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium">Question {index + 1}</h4>
                          <p className="text-slate-700 mt-1">{question.text}</p>
                          <Badge variant="outline" className="mt-2">
                            {question.kind === "MCQ" ? "Multiple Choice" : "True/False"}
                          </Badge>
                        </div>
                        {question.options && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-slate-600">Options:</h5>
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={option.id}
                                className={`p-2 rounded text-sm ${
                                  option.isCorrect
                                    ? "bg-brand-green text-white border border-brand-green"
                                    : "bg-gray-50 text-gray-700"
                                }`}
                              >
                                {String.fromCharCode(65 + optionIndex)}. {option.text}
                                {option.isCorrect && " ✓"}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {questions.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No questions added yet. Click "Add Question" to get started.
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}