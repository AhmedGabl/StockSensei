import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Material } from "@/lib/types";

interface FileViewerProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FileViewer({ material, isOpen, onClose }: FileViewerProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!material) return null;

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
        return { icon: "fas fa-file-pdf", color: "text-red-600" };
      case "POWERPOINT":
        return { icon: "fas fa-file-powerpoint", color: "text-orange-600" };
      case "VIDEO":
        return { icon: "fas fa-play", color: "text-purple-600" };
      case "SCRIPT":
        return { icon: "fas fa-file-alt", color: "text-amber-600" };
      case "DOCUMENT":
        return { icon: "fas fa-file-word", color: "text-blue-600" };
      default:
        return { icon: "fas fa-file", color: "text-slate-600" };
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      if (material.filePath) {
        const link = document.createElement('a');
        link.href = material.filePath;
        link.download = material.title || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (material.url) {
        window.open(material.url, '_blank');
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = () => {
    if (material.filePath) {
      window.open(material.filePath, '_blank');
    } else if (material.url) {
      window.open(material.url, '_blank');
    }
  };

  const isVideo = material.type === "VIDEO" || 
    material.fileName?.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i);
  
  const isPDF = material.type === "PDF" || 
    material.fileName?.match(/\.pdf$/i);
  
  const renderPreview = () => {
    if (isVideo && material.filePath) {
      return (
        <div className="w-full max-w-2xl mx-auto mb-4">
          <video 
            controls 
            className="w-full h-auto rounded-lg"
            style={{ maxHeight: '400px' }}
          >
            <source src={material.filePath} type="video/mp4" />
            <source src={material.filePath} type="video/webm" />
            <source src={material.filePath} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else if (isPDF && material.filePath) {
      return (
        <div className="w-full max-w-4xl mx-auto mb-4" style={{ height: '500px' }}>
          <iframe
            src={material.filePath}
            className="w-full h-full border rounded-lg"
            title="PDF Preview"
          />
        </div>
      );
    }
    return null;
  };

  const typeInfo = getTypeIcon(material.type || "DOCUMENT");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <i className={`${typeInfo.icon} ${typeInfo.color} text-xl`}></i>
            <span>{material.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Information */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800 mb-3">File Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-slate-500">File Type:</span>
                <p className="font-medium">{material.type}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">File Size:</span>
                <p className="font-medium">{formatFileSize(material.fileSize || 0)}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">Created:</span>
                <p className="font-medium">
                  {material.createdAt ? new Date(material.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <div>
                <span className="text-sm text-slate-500">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {material.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {material.description && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Description</h3>
              <p className="text-slate-600 bg-slate-50 rounded-lg p-3">
                {material.description}
              </p>
            </div>
          )}

          {/* File Preview */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">File Preview</h3>
            <div className="border rounded-lg bg-white p-4">
              {renderPreview() ? renderPreview() : material.type === "POWERPOINT" ? (
                <div className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-lg">
                  <i className="fas fa-file-powerpoint text-6xl text-orange-600 mb-4"></i>
                  <p className="text-slate-600 mb-4">PowerPoint files can be viewed by downloading or opening externally</p>
                  <div className="flex space-x-2">
                    <Button onClick={handleView} size="sm">
                      <i className="fas fa-eye mr-2"></i>
                      View Online
                    </Button>
                    <Button onClick={handleDownload} size="sm" variant="outline" disabled={isLoading}>
                      <i className="fas fa-download mr-2"></i>
                      {isLoading ? 'Downloading...' : 'Download'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className={`${typeInfo.icon} ${typeInfo.color} text-4xl mb-4`}></i>
                  <p className="text-slate-500 mb-4">Preview not available for this file type</p>
                  <div className="flex justify-center space-x-2">
                    <Button onClick={handleView} size="sm">
                      <i className="fas fa-external-link-alt mr-2"></i>
                      Open File
                    </Button>
                    <Button onClick={handleDownload} size="sm" variant="outline" disabled={isLoading}>
                      <i className="fas fa-download mr-2"></i>
                      {isLoading ? 'Downloading...' : 'Download'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
            <div className="flex space-x-2">
              <Button onClick={handleView} variant="outline">
                <i className="fas fa-external-link-alt mr-2"></i>
                Open in New Tab
              </Button>
              <Button onClick={handleDownload} disabled={isLoading}>
                <i className="fas fa-download mr-2"></i>
                {isLoading ? 'Downloading...' : 'Download File'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}