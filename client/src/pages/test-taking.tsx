import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface TestTakingProps {
  testId: string;
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function TestTaking({ testId, user, onNavigate, onLogout }: TestTakingProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const { data: testData, isLoading } = useQuery({
    queryKey: [`/api/tests/${testId}`],
  });

  const { data: attemptsData } = useQuery({
    queryKey: ["/api/attempts"],
    refetchOnMount: true,
  });

  const startAttemptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/tests/${testId}/attempt`, {});
      return await response.json();
    },
    onSuccess: (data: any) => {
      console.log("Start attempt success:", data);
      if (data?.attempt?.id) {
        setAttemptId(data.attempt.id);
        setStartTime(new Date());
        toast({
          title: "Test Started",
          description: "Good luck! Answer all questions and submit when ready."
        });
      } else {
        console.error("Invalid response format:", data);
        toast({
          title: "Error",
          description: "Invalid response from server",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      console.error("Start attempt error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to start test attempt";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const submitAttemptMutation = useMutation({
    mutationFn: async (answerData: any) => {
      const response = await apiRequest("POST", `/api/attempts/${attemptId}/submit`, { answers: answerData });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/attempts"] });
      toast({
        title: "Test Submitted",
        description: `Your score: ${data.scorePercent}%`
      });
    },
    onError: (error: any) => {
      console.error("Submit attempt error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to submit test";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const test = (testData as any)?.test;
  const questions = (testData as any)?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  // Check if user has already completed this test
  const existingAttempt = (attemptsData as any)?.attempts?.find((attempt: any) => 
    attempt.testId === testId && attempt.submittedAt
  );

  const handleStartTest = () => {
    startAttemptMutation.mutate();
  };

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const answerData = Object.entries(answers).map(([questionId, optionId]) => ({
      questionId,
      optionId,
      valueBool: null
    }));

    submitAttemptMutation.mutate(answerData);
  };

  const progressPercent = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredQuestions = Object.keys(answers).length;
  const canSubmit = answeredQuestions === questions.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Test Not Found</h2>
            <p className="text-muted-foreground mb-4">The test you're looking for doesn't exist or isn't available.</p>
            <Button onClick={() => onNavigate("tests")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show results if already completed
  if (existingAttempt && isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Test Completed!</h2>
            <p className="text-muted-foreground mb-4">
              You have successfully submitted your answers.
            </p>
            <div className="bg-muted p-4 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">Your Score</p>
              <p className="text-3xl font-bold text-primary">{existingAttempt.scorePercent}%</p>
            </div>
            <Button onClick={() => onNavigate("tests")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show start screen if not started
  if (!attemptId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Ready to Take the Test?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">{test.title}</h3>
              {test.description && (
                <p className="text-muted-foreground">{test.description}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="text-2xl font-bold">{questions.length}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Time Limit</p>
                <p className="text-2xl font-bold">No Limit</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Instructions:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Answer all questions to the best of your ability</li>
                <li>• You can navigate between questions using the Next/Previous buttons</li>
                <li>• Review your answers before submitting</li>
                <li>• Once submitted, you cannot change your answers</li>
              </ul>
            </div>

            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => onNavigate("tests")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleStartTest}
                disabled={startAttemptMutation.isPending}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                {startAttemptMutation.isPending ? "Starting..." : "Start Test"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main test-taking interface
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">{test.title}</h1>
              <p className="text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-2">
                <Clock className="h-4 w-4" />
                {startTime && new Date().toLocaleTimeString()}
              </Badge>
              <Badge variant={answeredQuestions === questions.length ? "default" : "secondary"}>
                {answeredQuestions}/{questions.length} Answered
              </Badge>
            </div>
          </div>
          <Progress value={progressPercent} className="w-full" />
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>Question {currentQuestionIndex + 1}</span>
                <Badge variant="outline">{currentQuestion.kind}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg">{currentQuestion.text}</p>

              {currentQuestion.kind === "MCQ" && currentQuestion.options && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option: any, index: number) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label 
                        htmlFor={option.id} 
                        className="flex-1 cursor-pointer text-base p-3 rounded border hover:bg-muted"
                      >
                        <span className="font-mono mr-3">{String.fromCharCode(65 + index)}.</span>
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitAttemptMutation.isPending}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {submitAttemptMutation.isPending ? "Submitting..." : "Submit Test"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1}
                className="gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Question Overview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Question Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {questions.map((question: any, index: number) => (
                <Button
                  key={question.id}
                  variant={index === currentQuestionIndex ? "default" : answers[question.id] ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className="aspect-square p-0"
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}