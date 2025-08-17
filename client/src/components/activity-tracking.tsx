import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { 
  Activity, Users, BookOpen, TestTube, Phone, 
  Clock, TrendingUp, Eye, BarChart3, Calendar,
  FileText, User, Play
} from "lucide-react";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  userId: string;
  type: "MATERIAL_VIEW" | "TEST_TAKEN" | "MODULE_ACCESSED" | "PRACTICE_CALL" | "LOGIN" | "LOGOUT";
  entityId?: string;
  entityType?: string;
  metadata?: string;
  timestamp: string;
  sessionId?: string;
  user: {
    name?: string;
    email: string;
  };
}

interface UserStats {
  materialViews: number;
  testsCompleted: number;
  practiceCallsMade: number;
  modulesAccessed: number;
  totalLoginTime: number;
}

interface MaterialView {
  id: string;
  materialId: string;
  userId: string;
  viewedAt: string;
  duration?: number;
  progress?: number;
  user: {
    name?: string;
    email: string;
  };
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: string;
}

const activityTypeLabels = {
  MATERIAL_VIEW: "Material View",
  TEST_TAKEN: "Test Taken",
  MODULE_ACCESSED: "Module Access",
  PRACTICE_CALL: "Practice Call",
  LOGIN: "Login",
  LOGOUT: "Logout"
};

const activityTypeIcons = {
  MATERIAL_VIEW: Eye,
  TEST_TAKEN: TestTube,
  MODULE_ACCESSED: BookOpen,
  PRACTICE_CALL: Phone,
  LOGIN: User,
  LOGOUT: User
};

export function ActivityTracking() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedActivityType, setSelectedActivityType] = useState<string>("all");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");

  // Fetch all users for selection
  const { data: usersData } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      return response.json();
    }
  });

  // Fetch materials for selection
  const { data: materialsData } = useQuery({
    queryKey: ["/api/materials"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/materials");
      return response.json();
    }
  });

  // Fetch user statistics
  const { data: userStats } = useQuery({
    queryKey: ["/api/activity/stats", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const response = await apiRequest("GET", `/api/activity/stats/${selectedUserId}`);
      return response.json();
    },
    enabled: !!selectedUserId
  });

  // Fetch user activity logs
  const { data: userActivities } = useQuery({
    queryKey: ["/api/activity/user", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const response = await apiRequest("GET", `/api/activity/user/${selectedUserId}?limit=100`);
      return response.json();
    },
    enabled: !!selectedUserId
  });

  // Fetch activities by type
  const { data: typeActivities } = useQuery({
    queryKey: ["/api/activity/type", selectedActivityType],
    queryFn: async () => {
      if (selectedActivityType === "all") return null;
      const response = await apiRequest("GET", `/api/activity/type/${selectedActivityType}?limit=100`);
      return response.json();
    },
    enabled: selectedActivityType !== "all"
  });

  // Fetch material views
  const { data: materialViews } = useQuery({
    queryKey: ["/api/materials", selectedMaterialId, "views"],
    queryFn: async () => {
      if (!selectedMaterialId) return null;
      const response = await apiRequest("GET", `/api/materials/${selectedMaterialId}/views`);
      return response.json();
    },
    enabled: !!selectedMaterialId
  });

  const users: User[] = usersData?.users || [];
  const materials = materialsData?.materials || [];
  const stats: UserStats | null = userStats?.stats || null;
  const activities: ActivityLog[] = userActivities?.activities || [];
  const typeBasedActivities: ActivityLog[] = typeActivities?.activities || [];
  const views: MaterialView[] = materialViews?.views || [];
  const viewCount: number = materialViews?.count || 0;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-6 h-6 text-brand-orange" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Activity Tracking</h2>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Stats</TabsTrigger>
          <TabsTrigger value="activities">Activity Feed</TabsTrigger>
          <TabsTrigger value="materials">Material Views</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {users.filter(u => u.role === "STUDENT").length}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-brand-blue" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Materials</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{materials.length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-brand-green" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sessions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
                  </div>
                  <Activity className="w-8 h-8 text-brand-orange" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Engagement</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-brand-purple" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Activity by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Select value={selectedActivityType} onValueChange={setSelectedActivityType}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Activities</SelectItem>
                        <SelectItem value="MATERIAL_VIEW">Material Views</SelectItem>
                        <SelectItem value="TEST_TAKEN">Tests Taken</SelectItem>
                        <SelectItem value="MODULE_ACCESSED">Module Access</SelectItem>
                        <SelectItem value="PRACTICE_CALL">Practice Calls</SelectItem>
                        <SelectItem value="LOGIN">Logins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {selectedActivityType !== "all" && (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {typeBasedActivities.map((activity) => {
                        const Icon = activityTypeIcons[activity.type];
                        return (
                          <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4 text-brand-orange" />
                              <div>
                                <p className="font-medium">{activity.user.name || activity.user.email}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {activityTypeLabels[activity.type]}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {format(new Date(activity.timestamp), "MMM dd, HH:mm")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Student</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a student to view stats" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.role === "STUDENT").map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Material Views</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.materialViews}</p>
                      </div>
                      <Eye className="w-8 h-8 text-brand-blue" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tests Completed</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.testsCompleted}</p>
                      </div>
                      <TestTube className="w-8 h-8 text-brand-green" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Practice Calls</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.practiceCallsMade}</p>
                      </div>
                      <Phone className="w-8 h-8 text-brand-orange" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Modules Accessed</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.modulesAccessed}</p>
                      </div>
                      <BookOpen className="w-8 h-8 text-brand-purple" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Time</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLoginTime}m</p>
                      </div>
                      <Clock className="w-8 h-8 text-gray-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedUserId ? (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {activities.map((activity) => {
                      const Icon = activityTypeIcons[activity.type];
                      let metadata = null;
                      try {
                        metadata = activity.metadata ? JSON.parse(activity.metadata) : null;
                      } catch (e) {
                        // Invalid JSON, ignore
                      }

                      return (
                        <div key={activity.id} className="flex items-start gap-3 p-4 border rounded-lg">
                          <Icon className="w-5 h-5 text-brand-orange mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{activityTypeLabels[activity.type]}</Badge>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {format(new Date(activity.timestamp), "MMM dd, yyyy HH:mm:ss")}
                              </span>
                            </div>
                            <p className="text-sm mt-1">
                              {activity.entityType && activity.entityId && (
                                <span className="font-medium">
                                  {activity.entityType}: {activity.entityId}
                                </span>
                              )}
                            </p>
                            {metadata && (
                              <div className="text-xs text-gray-500 mt-1">
                                {metadata.duration && (
                                  <span>Duration: {formatDuration(metadata.duration)} </span>
                                )}
                                {metadata.progress && (
                                  <span>Progress: {metadata.progress}%</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  Select a student to view their activity feed
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Material View Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a material to view analytics" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material: any) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedMaterialId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>View Details</span>
                    <Badge variant="secondary">Total Views: {viewCount}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {views.map((view) => (
                        <div key={view.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Play className="w-4 h-4 text-brand-green" />
                            <div>
                              <p className="font-medium">{view.user.name || view.user.email}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Viewed: {format(new Date(view.viewedAt), "MMM dd, yyyy HH:mm")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              Duration: {formatDuration(view.duration)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Progress: {view.progress}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}