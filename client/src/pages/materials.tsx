import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Material } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

interface MaterialsProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const MATERIAL_TAGS = ["SOP", "VOIP", "REFERRALS", "YOUTH", "ADULT"];

export default function Materials({ user, onNavigate, onLogout }: MaterialsProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    type: "",
    tags: [] as string[],
    fileName: "",
    fileSize: 0,
    fileURL: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: typeof uploadData) => {
      const response = await apiRequest("PUT", "/api/materials/file", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({
        title: "Success",
        description: "Material uploaded successfully!",
      });
      setUploadDialogOpen(false);
      setUploadData({
        title: "",
        description: "",
        type: "",
        tags: [],
        fileName: "",
        fileSize: 0,
        fileURL: ""
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload material. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0]) {
      const file = result.successful[0];
      setUploadData(prev => ({
        ...prev,
        fileURL: file.uploadURL || "",
        fileName: file.name || "",
        fileSize: file.size || 0,
        type: file.name?.endsWith('.pdf') ? 'PDF' : 
              file.name?.endsWith('.ppt') || file.name?.endsWith('.pptx') ? 'POWERPOINT' : 'DOCUMENT'
      }));
    }
  };

  const handleDownload = async (material: Material) => {
    if (material.filePath) {
      window.open(material.filePath, '_blank');
    } else if (material.url) {
      window.open(material.url, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return { icon: "fas fa-file-pdf", color: "red" };
      case "POWERPOINT":
        return { icon: "fas fa-file-powerpoint", color: "orange" };
      case "VIDEO":
        return { icon: "fas fa-play", color: "purple" };
      case "SCRIPT":
        return { icon: "fas fa-file-alt", color: "amber" };
      case "DOCUMENT":
        return { icon: "fas fa-file-word", color: "blue" };
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
    <Layout user={user} currentPage="materials" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Training Materials Portal</h1>
            <p className="text-slate-500">Upload, manage, and access PDFs and PowerPoint files</p>
          </div>
          <div className="flex items-center space-x-4">
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
            {user.role === "ADMIN" && (
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    <i className="fas fa-plus mr-2"></i>
                    Upload Material
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload New Material</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={uploadData.title}
                          onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter material title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Select
                          value={uploadData.type}
                          onValueChange={(value) => setUploadData(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PDF">PDF Document</SelectItem>
                            <SelectItem value="POWERPOINT">PowerPoint Presentation</SelectItem>
                            <SelectItem value="DOCUMENT">General Document</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={uploadData.description}
                        onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter description"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {MATERIAL_TAGS.map((tag) => (
                          <Button
                            key={tag}
                            type="button"
                            variant={uploadData.tags.includes(tag) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setUploadData(prev => ({
                                ...prev,
                                tags: prev.tags.includes(tag)
                                  ? prev.tags.filter(t => t !== tag)
                                  : [...prev.tags, tag]
                              }));
                            }}
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>File Upload</Label>
                      <div className="mt-2">
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={52428800} // 50MB
                          allowedFileTypes={['.pdf', '.ppt', '.pptx', '.doc', '.docx']}
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={handleUploadComplete}
                          buttonClassName="w-full"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <i className="fas fa-cloud-upload-alt"></i>
                            <span>Choose PDF or PowerPoint File</span>
                          </div>
                        </ObjectUploader>
                        {uploadData.fileName && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm text-green-700">
                              <i className="fas fa-check mr-1"></i>
                              {uploadData.fileName} ({formatFileSize(uploadData.fileSize)})
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setUploadDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => uploadMutation.mutate(uploadData)}
                        disabled={!uploadData.title || !uploadData.type || !uploadData.fileURL || uploadMutation.isPending}
                      >
                        {uploadMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-upload mr-2"></i>
                            Upload Material
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
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
                            {material.type.toLowerCase()} 
                            {material.fileSize && ` • ${formatFileSize(material.fileSize)}`}
                            {material.fileName && !material.fileSize && ` • ${material.fileName}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mb-4">
                      {material.description || "Comprehensive training material for Class Mentors covering essential procedures and best practices."}
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
                      <Button 
                        className="flex-1" 
                        size="sm" 
                        onClick={() => handleDownload(material)}
                        disabled={!material.filePath && !material.url}
                      >
                        <i className="fas fa-eye mr-1"></i>
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownload(material)}
                        disabled={!material.filePath && !material.url}
                      >
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
