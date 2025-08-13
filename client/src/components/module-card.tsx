import { Progress, ModuleInfo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ModuleCardProps {
  module: ModuleInfo;
  progress?: Progress;
  onAction: (action: "continue" | "review" | "start", moduleId: string) => void;
  onPracticeCall: (scenario: string) => void;
}

export function ModuleCard({ module, progress, onAction, onPracticeCall }: ModuleCardProps) {
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, { bg: string; text: string; progress: string }> = {
      COMPLETED: { bg: "bg-emerald-100", text: "text-emerald-700", progress: "bg-emerald-500" },
      IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700", progress: "bg-blue-500" },
    };
    return colorMap[status] || { bg: "bg-slate-100", text: "text-slate-700", progress: "bg-slate-300" };
  };

  const getModuleColor = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
      blue: { bg: "bg-blue-100", text: "text-blue-600" },
      purple: { bg: "bg-purple-100", text: "text-purple-600" },
      amber: { bg: "bg-amber-100", text: "text-amber-600" },
      red: { bg: "bg-red-100", text: "text-red-600" },
    };
    return colorMap[color] || { bg: "bg-slate-100", text: "text-slate-600" };
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Completed";
      case "IN_PROGRESS":
        return "In Progress";
      default:
        return "Not Started";
    }
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    if (progress.status === "COMPLETED") return 100;
    if (progress.status === "IN_PROGRESS") return progress.score || 50;
    return 0;
  };

  const progressPercentage = getProgressPercentage();
  const statusColors = getStatusColor(progress?.status || "NOT_STARTED");
  const moduleColors = getModuleColor(module.color);
  const isLocked = !progress && module.id !== "SOP_1ST_CALL";

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${moduleColors.bg} ${moduleColors.text} rounded-lg flex items-center justify-center`}>
              <i className={module.icon}></i>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">{module.title}</h4>
              <p className="text-sm text-slate-500">{module.description}</p>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={`${statusColors.bg} ${statusColors.text}`}
          >
            {getStatusText(progress?.status || "NOT_STARTED")}
          </Badge>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className={`${statusColors.progress} h-2 rounded-full transition-all`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="flex space-x-2">
          {isLocked ? (
            <Button disabled className="flex-1" variant="secondary">
              <i className="fas fa-lock mr-2"></i>
              Locked
            </Button>
          ) : (
            <>
              <Button
                className="flex-1"
                variant={progress?.status === "COMPLETED" ? "secondary" : "default"}
                onClick={() => {
                  if (progress?.status === "COMPLETED") {
                    onAction("review", module.id);
                  } else if (progress?.status === "IN_PROGRESS") {
                    onAction("continue", module.id);
                  } else {
                    onAction("start", module.id);
                  }
                }}
              >
                {progress?.status === "COMPLETED" 
                  ? "Review" 
                  : progress?.status === "IN_PROGRESS" 
                    ? "Continue" 
                    : "Start Module"
                }
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onPracticeCall(module.id)}
                className="text-primary hover:text-primary-700"
              >
                <i className="fas fa-phone"></i>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
