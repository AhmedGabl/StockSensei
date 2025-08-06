import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Material } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

interface MaterialsProps {
  user: User;
  onNavigate: (page: string) => void;
}

const MATERIAL_TAGS = ["SOP", "VOIP", "REFERRALS", "YOUTH", "ADULT"];

export default function Materials({ user, onNavigate }: MaterialsProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: materialsData, isLoading } = useQuery({
    queryKey: ["/api/materials", selectedTags],
    queryFn: async () => {
      const tagsParam = selectedTags.length > 0 ? `?tags=${selectedTags.join(',')}` : '';
      const response = await apiRequest("GET", `/api/materials${tagsParam}`);
      return await response.json();
    },
  });

  const materials = materialsData?.materials || [];

  const filteredMaterials = materials.filter((material: Material) =>
    material.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return { icon: "fas fa-file-pdf", color: "red" };
      case "VIDEO":
        return { icon: "fas fa-play", color: "purple" };
      case "SCRIPT":
        return { icon: "fas fa-file-alt", color: "amber" };
      default:
        return { icon: "fas fa-file", color: "slate" };
    }
  };

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      SOP: "blue",
      VOIP: "purple",
      REFERRALS: "amber",
      YOUTH: "emerald",
      ADULT: "blue",
    };
    return colors[tag] || "slate";
  };

  return (
    <Layout user={user} currentPage="materials" onNavigate={onNavigate}>
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Training Materials</h1>
            <p className="text-slate-500">Access your learning resources and documentation</p>
          </div>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
            <i className="fas fa-search absolute left-3 top-3 text-slate-400"></i>
          </div>
        </div>

        {/* Filter Tags */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTags.length === 0 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTags([])}
            >
              All
            </Button>
            {MATERIAL_TAGS.map((tag) => (
              <Button
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>

        {/* Materials Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material: Material) => {
              const typeInfo = getTypeIcon(material.type);
              return (
                <Card key={material.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-${typeInfo.color}-100 text-${typeInfo.color}-600 rounded-lg flex items-center justify-center`}>
                          <i className={typeInfo.icon}></i>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{material.title}</h4>
                          <p className="text-sm text-slate-500 capitalize">
                            {material.type.toLowerCase()} • 2.4 MB
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mb-4">
                      Comprehensive training material for Class Mentors covering essential procedures and best practices.
                    </p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {material.tags.map((tag) => (
                        <Badge
                          key={tag}
                          className={`bg-${getTagColor(tag)}-100 text-${getTagColor(tag)}-700`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <Button className="flex-1" size="sm">
                        <i className="fas fa-eye mr-1"></i>
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        <i className="fas fa-download"></i>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <i className="fas fa-folder-open text-4xl text-slate-300 mb-4"></i>
            <h3 className="text-lg font-medium text-slate-600 mb-2">No materials found</h3>
            <p className="text-slate-500">
              {selectedTags.length > 0 || searchTerm
                ? "Try adjusting your filters or search term"
                : "Materials will appear here once they're added"}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
