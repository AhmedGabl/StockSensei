import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "@/lib/types";

interface PlatformOverviewChartProps {
  user: User;
  onNavigate: (page: string) => void;
}

interface FeatureCategory {
  title: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  features: {
    name: string;
    description: string;
    page: string;
    status: "available" | "premium" | "admin-only";
  }[];
}

export function PlatformOverviewChart({ user, onNavigate }: PlatformOverviewChartProps) {
  const isAdmin = user.role === "ADMIN";

  const studentFeatures: FeatureCategory[] = [
    {
      title: "Learning & Training",
      description: "Core educational features",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      icon: "fas fa-graduation-cap",
      features: [
        {
          name: "Training Modules",
          description: "Interactive learning content",
          page: "dashboard",
          status: "available"
        },
        {
          name: "Materials Library",
          description: "Access training resources",
          page: "materials",
          status: "available"
        },
        {
          name: "Progress Tracking",
          description: "Monitor your advancement",
          page: "profile",
          status: "available"
        }
      ]
    },
    {
      title: "Practice & Assessment",
      description: "Skill development tools",
      color: "text-green-600",
      bgColor: "bg-green-50",
      icon: "fas fa-dumbbell",
      features: [
        {
          name: "AI Practice Calls",
          description: "Roleplay with AI assistant",
          page: "dashboard",
          status: "available"
        },
        {
          name: "Take Tests",
          description: "Complete assigned quizzes",
          page: "tests",
          status: "available"
        },
        {
          name: "Call Evaluation",
          description: "AI-powered performance analysis",
          page: "dashboard",
          status: "available"
        }
      ]
    },
    {
      title: "Support & Assistance",
      description: "Help and guidance",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      icon: "fas fa-headset",
      features: [
        {
          name: "Q&A Assistant",
          description: "AI-powered help chatbot",
          page: "qa-assistant",
          status: "available"
        },
        {
          name: "Problem Reports",
          description: "Report technical issues",
          page: "problem-reports",
          status: "available"
        }
      ]
    }
  ];

  const adminFeatures: FeatureCategory[] = [
    {
      title: "User Management",
      description: "Manage students and trainers",
      color: "text-red-600",
      bgColor: "bg-red-50",
      icon: "fas fa-users-cog",
      features: [
        {
          name: "Admin Panel",
          description: "User management & analytics",
          page: "admin",
          status: "admin-only"
        },
        {
          name: "Individual Students",
          description: "Notes & task tracking",
          page: "enhanced-admin",
          status: "admin-only"
        },
        {
          name: "Group Management",
          description: "Create & manage student groups",
          page: "group-management",
          status: "admin-only"
        }
      ]
    },
    {
      title: "Content Creation",
      description: "Build training materials",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      icon: "fas fa-edit",
      features: [
        {
          name: "Test Builder",
          description: "Create quizzes & assessments",
          page: "tests",
          status: "admin-only"
        },
        {
          name: "AI Test Generation",
          description: "Generate tests with AI assistance",
          page: "test-builder",
          status: "admin-only"
        },
        {
          name: "Module Management",
          description: "Control training modules",
          page: "admin-control",
          status: "admin-only"
        }
      ]
    },
    {
      title: "Analytics & Monitoring",
      description: "Track performance & usage",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      icon: "fas fa-chart-line",
      features: [
        {
          name: "Call Tracking",
          description: "Monitor practice call data",
          page: "call-tracking",
          status: "admin-only"
        },
        {
          name: "Material Analytics",
          description: "Track resource usage",
          page: "materials",
          status: "admin-only"
        },
        {
          name: "Progress Monitoring",
          description: "Student advancement tracking",
          page: "enhanced-admin",
          status: "admin-only"
        }
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="default" className="bg-green-100 text-green-700">Available</Badge>;
      case "premium":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Premium</Badge>;
      case "admin-only":
        return <Badge variant="destructive" className="bg-red-100 text-red-700">Admin Only</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const displayFeatures = isAdmin ? [...studentFeatures, ...adminFeatures] : studentFeatures;

  return (
    <div className="space-y-6">
      {/* Platform Overview Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-3">
            <i className="fas fa-sitemap text-blue-600"></i>
            CM Training Platform Overview
          </CardTitle>
          <p className="text-slate-600 mt-2">
            {isAdmin 
              ? "Complete platform access - Manage users, create content, and monitor performance"
              : "Student access - Learn, practice, and track your progress"
            }
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Badge variant="outline" className="bg-white">
              <i className="fas fa-user mr-1"></i>
              {user.role}
            </Badge>
            <Badge variant="outline" className="bg-white">
              <i className="fas fa-envelope mr-1"></i>
              {user.email}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Feature Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayFeatures.map((category, categoryIndex) => (
          <Card key={categoryIndex} className={`${category.bgColor} border-2 hover:shadow-lg transition-shadow`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-3 ${category.color}`}>
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <i className={`${category.icon} text-lg`}></i>
                </div>
                <div>
                  <div className="font-bold">{category.title}</div>
                  <div className="text-sm font-normal text-slate-600">{category.description}</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {category.features.map((feature, featureIndex) => (
                <div 
                  key={featureIndex}
                  className="bg-white rounded-lg p-3 border hover:border-slate-300 cursor-pointer transition-colors group"
                  onClick={() => onNavigate(feature.page)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {feature.name}
                    </h4>
                    {getStatusBadge(feature.status)}
                  </div>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                  <div className="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to access →
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-tachometer-alt text-green-600"></i>
            Platform Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {displayFeatures.reduce((total, category) => total + category.features.length, 0)}
              </div>
              <div className="text-sm text-slate-600">Total Features</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {displayFeatures.reduce((total, category) => 
                  total + category.features.filter(f => f.status === "available").length, 0)}
              </div>
              <div className="text-sm text-slate-600">Available to You</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {displayFeatures.length}
              </div>
              <div className="text-sm text-slate-600">Feature Categories</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {isAdmin ? "Admin" : "Student"}
              </div>
              <div className="text-sm text-slate-600">Access Level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technology Stack Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-cogs text-purple-600"></i>
            Powered By AI Technology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <i className="fas fa-robot text-blue-600 text-xl"></i>
              <div>
                <div className="font-semibold text-slate-800">OpenAI GPT-4o</div>
                <div className="text-sm text-slate-600">Chat assistance & evaluation</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <i className="fas fa-phone-alt text-green-600 text-xl"></i>
              <div>
                <div className="font-semibold text-slate-800">Ringg AI</div>
                <div className="text-sm text-slate-600">Voice roleplay calls</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <i className="fas fa-comments text-purple-600 text-xl"></i>
              <div>
                <div className="font-semibold text-slate-800">Botpress</div>
                <div className="text-sm text-slate-600">Q&A chatbot support</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}