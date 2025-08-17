import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Loader2, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout";

interface QAMessage {
  question: string;
  answer: string;
  timestamp: Date;
}

interface QAAssistantProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function QAAssistant({ user, onNavigate, onLogout }: QAAssistantProps) {
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [history, setHistory] = useState<QAMessage[]>([]);
  const { toast } = useToast();

  const askQuestion = useMutation({
    mutationFn: async (data: { question: string; context?: string }) => {
      const response = await fetch("/api/qa/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to process question");
      return response.json();
    },
    onSuccess: (data) => {
      const newMessage: QAMessage = {
        question,
        answer: data.answer,
        timestamp: new Date(),
      };
      setHistory(prev => [newMessage, ...prev]);
      setQuestion("");
      setContext("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Process Question",
        description: error.message || "Unable to get answer",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      toast({
        title: "Question Required",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }
    askQuestion.mutate({ 
      question: question.trim(), 
      context: context.trim() || undefined 
    });
  };

  return (
    <Layout user={user} currentPage="qa-assistant" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Q&A Assistant
            </CardTitle>
            <CardDescription>
              Ask questions about SOPs, procedures, or training materials. Provide context for more specific answers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="context">Context (Optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Provide relevant context, specific scenario, or reference material..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="question">Your Question</Label>
                <Textarea
                  id="question"
                  placeholder="What would you like to know? e.g., 'How should I handle a customer escalation?'"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={askQuestion.isPending}
              >
                {askQuestion.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Ask Question
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Q&A History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Q&A History</CardTitle>
            <CardDescription>
              Your recent questions and AI-generated answers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No questions asked yet</p>
                  <p className="text-sm">Ask your first question to get started</p>
                </div>
              ) : (
                history.map((msg, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {msg.timestamp.toLocaleString()}
                      </div>
                      <div className="font-medium text-blue-600 dark:text-blue-400">
                        Q: {msg.question}
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded p-3">
                      <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                        A:
                      </div>
                      <div className="text-sm whitespace-pre-wrap">
                        {msg.answer}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </Layout>
  );
}