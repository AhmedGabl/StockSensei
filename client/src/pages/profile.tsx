import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { ProgressDonut } from "@/components/progress-donut";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Progress, PracticeCall, MODULES } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

interface ProfileProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function Profile({ user, onNavigate, onLogout }: ProfileProps) {
  const { data: progressData } = useQuery({
    queryKey: ["/api/progress"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/progress");
      return await response.json();
    },
  });

  const { data: practiceCallsData } = useQuery({
    queryKey: ["/api/practice-calls"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/practice-calls");
      return await response.json();
    },
  });

  const { data: notesData } = useQuery({
    queryKey: [`/api/users/${user.id}/notes`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user.id}/notes`);
      return await response.json();
    },
  });

  const progress = progressData?.progress || [];
  const practiceCalls = practiceCallsData?.calls || [];
  const notes = notesData?.notes?.filter((note: any) => note.isVisibleToStudent) || [];

  const getOverallProgress = (): number => {
    if (progress.length === 0) return 0;
    const completed = progress.filter((p: Progress) => p.status === "COMPLETED").length;
    return Math.round((completed / progress.length) * 100);
  };

  const getModuleTitle = (moduleId: string): string => {
    const module = MODULES.find(m => m.id === moduleId);
    return module?.title || moduleId.replace(/_/g, ' ');
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      COMPLETED: { bg: "bg-emerald-100", text: "text-emerald-600" },
      IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-600" },
    };
    return colorMap[status] || { bg: "bg-slate-100", text: "text-slate-600" };
  };

  const getOutcomeColor = (outcome?: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      PASSED: { bg: "bg-emerald-100", text: "text-emerald-700" },
      IMPROVE: { bg: "bg-amber-100", text: "text-amber-700" },
      FAILED: { bg: "bg-red-100", text: "text-red-700" },
    };
    return colorMap[outcome || "INCOMPLETE"] || { bg: "bg-slate-100", text: "text-slate-700" };
  };

  const formatDuration = (startedAt: string, endedAt?: string) => {
    if (!endedAt) return "N/A";
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
    return `${duration}m`;
  };

  return (
    <Layout user={user} currentPage="profile" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold">
                {user.name?.charAt(0) || user.email.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-800">
                  {user.name || user.email.split('@')[0]}
                </h2>
                <p className="text-slate-500">{user.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className="bg-emerald-100 text-emerald-700 capitalize">
                    {user.role.toLowerCase()}
                  </Badge>
                  <span className="text-sm text-slate-500">
                    Joined {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <ProgressDonut percentage={getOverallProgress()} />
                <p className="text-sm text-slate-500 mt-1">Overall Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Module Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Module Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {progress.map((prog: Progress) => {
              const statusColors = getStatusColor(prog.status);
              return (
                <div key={prog.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 ${statusColors.bg} ${statusColors.text} rounded-lg flex items-center justify-center`}>
                      <i className={prog.status === "COMPLETED" ? "fas fa-check" : prog.status === "IN_PROGRESS" ? "fas fa-clock" : "fas fa-lock"}></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{getModuleTitle(prog.module)}</h4>
                      <p className="text-sm text-slate-500">
                        Last accessed: {new Date(prog.lastTouched).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-500">Score:</span>
                      <span className={`font-semibold ${statusColors.text}`}>
                        {prog.score ? `${prog.score}%` : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-500">Attempts:</span>
                      <span className="font-medium text-slate-700">{prog.attempts}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {progress.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <i className="fas fa-chart-line text-2xl mb-2"></i>
                <p>No progress data available yet. Start your first module!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages from Admin */}
        {notes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-sticky-note text-amber-600"></i>
                Messages from Admin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notes.map((note: any) => (
                  <div key={note.id} className="p-4 border-l-4 border-amber-400 bg-amber-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center">
                          <i className="fas fa-user-shield text-xs"></i>
                        </div>
                        <span className="text-xs font-medium text-amber-700 bg-amber-200 px-2 py-1 rounded-full">
                          Admin Message
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed ml-8">{note.body}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Practice Call History */}
        <Card>
          <CardHeader>
            <CardTitle>Practice Call History</CardTitle>
          </CardHeader>
          <CardContent>
            {practiceCalls.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Scenario</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Duration</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Outcome</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {practiceCalls.map((call: PracticeCall) => {
                      const outcomeColors = getOutcomeColor(call.outcome);
                      return (
                        <tr key={call.id}>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {new Date(call.startedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-800">{call.scenario}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {formatDuration(call.startedAt, call.endedAt)}
                          </td>
                          <td className="py-3 px-4">
                            {call.outcome ? (
                              <Badge className={`${outcomeColors.bg} ${outcomeColors.text}`}>
                                {call.outcome}
                              </Badge>
                            ) : (
                              <span className="text-slate-400">Incomplete</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {call.notes || "No notes"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <i className="fas fa-phone text-2xl mb-2"></i>
                <p>No practice calls completed yet. Start your first session!</p>
                <Button className="mt-4" onClick={() => onNavigate("dashboard")}>
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
