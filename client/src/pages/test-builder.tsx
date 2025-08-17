import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Wand2, Plus, X, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout";

interface GenerateTestForm {
  topic: string;
  materialId?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionCount: number;
  questionTypes: ("MCQ" | "TRUE_FALSE" | "SHORT")[];
}

interface TestBuilderProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function TestBuilder({ user, onNavigate, onLogout }: TestBuilderProps) {
  const [form, setForm] = useState<GenerateTestForm>({
    topic: "",
    materialId: "",
    difficulty: "MEDIUM",
    questionCount: 5,
    questionTypes: ["MCQ"]
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch available materials
  const { data: materialsData } = useQuery({
    queryKey: ["/api/materials"],
  });

  const generateTest = useMutation({
    mutationFn: async (data: GenerateTestForm) => {
      const response = await fetch("/api/admin/tests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to generate test");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test Generated Successfully",
        description: `Created "${data.test.title}" with AI assistance`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      // Reset form
      setForm({
        topic: "",
        materialId: "",
        difficulty: "MEDIUM", 
        questionCount: 5,
        questionTypes: ["MCQ"]
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate test",
        variant: "destructive",
      });
    },
  });

  const handleQuestionTypeChange = (type: "MCQ" | "TRUE_FALSE" | "SHORT", checked: boolean) => {
    if (checked) {
      setForm(prev => ({
        ...prev,
        questionTypes: [...prev.questionTypes, type]
      }));
    } else {
      setForm(prev => ({
        ...prev,
        questionTypes: prev.questionTypes.filter(t => t !== type)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic.trim() && !form.materialId) {
      toast({
        title: "Topic or Material Required",
        description: "Please enter a topic or select a material for the test",
        variant: "destructive",
      });
      return;
    }
    if (form.questionTypes.length === 0) {
      toast({
        title: "Question Types Required", 
        description: "Please select at least one question type",
        variant: "destructive",
      });
      return;
    }
    generateTest.mutate(form);
  };

  const materials = (materialsData as any)?.materials || [];

  return (
    <Layout user={user} currentPage="test-builder" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Test Builder
          </CardTitle>
          <CardDescription>
            Generate comprehensive tests automatically using AI. Specify your topic and preferences, and our AI will create relevant questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Source Material (Optional)</Label>
                <Select
                  value={form.materialId || "none"}
                  onValueChange={(value) => setForm(prev => ({ 
                    ...prev, 
                    materialId: value === "none" ? "" : value,
                    topic: value !== "none" ? "" : prev.topic 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a material to base test on" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No material selected</SelectItem>
                    {materials.map((material: any) => (
                      <SelectItem key={material.id} value={material.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {material.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select a material to generate questions based on its content
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Custom Topic {form.materialId && "(Optional)"}</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Customer Service SOPs, Call Center Operations"
                  value={form.topic}
                  onChange={(e) => setForm(prev => ({ ...prev, topic: e.target.value }))}
                  disabled={!!form.materialId}
                />
                <p className="text-xs text-muted-foreground">
                  {form.materialId 
                    ? "Using selected material content for test generation" 
                    : "Enter a topic for AI to generate relevant questions"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(value: "EASY" | "MEDIUM" | "HARD") => 
                    setForm(prev => ({ ...prev, difficulty: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="questionCount">Number of Questions</Label>
                <Input
                  id="questionCount"
                  type="number"
                  min="1"
                  max="20"
                  value={form.questionCount}
                  onChange={(e) => setForm(prev => ({ 
                    ...prev, 
                    questionCount: parseInt(e.target.value) || 5 
                  }))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Question Types</Label>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mcq"
                    checked={form.questionTypes.includes("MCQ")}
                    onCheckedChange={(checked) => 
                      handleQuestionTypeChange("MCQ", checked as boolean)
                    }
                  />
                  <Label htmlFor="mcq">Multiple Choice Questions (MCQ)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="truefalse"
                    checked={form.questionTypes.includes("TRUE_FALSE")}
                    onCheckedChange={(checked) => 
                      handleQuestionTypeChange("TRUE_FALSE", checked as boolean)
                    }
                  />
                  <Label htmlFor="truefalse">True/False Questions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="short"
                    checked={form.questionTypes.includes("SHORT")}
                    onCheckedChange={(checked) => 
                      handleQuestionTypeChange("SHORT", checked as boolean)
                    }
                  />
                  <Label htmlFor="short">Short Answer Questions</Label>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={generateTest.isPending}
            >
              {generateTest.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Test...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Test with AI
                </>
              )}
            </Button>
          </form>
        </CardContent>
        </Card>
      </div>
    </Layout>
  );
}