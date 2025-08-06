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
    switch (status) {
      case "COMPLETED":
        return "emerald";
      case "IN_PROGRESS":
        return "blue";
      default:
        return "slate";
    }
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
  const statusColor = getStatusColor(progress?.status || "NOT_STARTED");
  const isLocked = !progress && module.id !== "SOP_1ST_CALL";

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-${module.color}-100 text-${module.color}-600 rounded-lg flex items-center justify-center`}>
              <i className={module.icon}></i>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">{module.title}</h4>
              <p className="text-sm text-slate-500">{module.description}</p>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={`bg-${statusColor}-100 text-${statusColor}-700`}
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
              className={`bg-${statusColor === "slate" ? "slate-300" : statusColor === "emerald" ? "emerald-500" : "blue-500"} h-2 rounded-full transition-all`}
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
