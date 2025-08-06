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
}

export default function Profile({ user, onNavigate }: ProfileProps) {
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

  const progress = progressData?.progress || [];
  const practiceCalls = practiceCallsData?.calls || [];

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
    switch (status) {
      case "COMPLETED":
        return "emerald";
      case "IN_PROGRESS":
        return "blue";
      default:
        return "slate";
    }
  };

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case "PASSED":
        return "emerald";
      case "IMPROVE":
        return "amber";
      default:
        return "slate";
    }
  };

  const formatDuration = (startedAt: string, endedAt?: string) => {
    if (!endedAt) return "N/A";
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
    return `${duration}m`;
  };

  return (
    <Layout user={user} currentPage="profile" onNavigate={onNavigate}>
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
              const statusColor = getStatusColor(prog.status);
              return (
                <div key={prog.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 bg-${statusColor}-100 text-${statusColor}-600 rounded-lg flex items-center justify-center`}>
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
                      <span className={`font-semibold text-${statusColor}-600`}>
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
                      const outcomeColor = getOutcomeColor(call.outcome);
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
                              <Badge className={`bg-${outcomeColor}-100 text-${outcomeColor}-700`}>
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
