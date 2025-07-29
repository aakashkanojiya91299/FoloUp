"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Eye, 
  X,
  File,
  FileImage,
  FileType,
  FileCode
} from "lucide-react";

interface FileViewerProps {
  fileUrl: string;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FileViewer({ fileUrl, filename, isOpen, onClose }: FileViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return <FileType className="h-8 w-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileCode className="h-8 w-8 text-blue-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-8 w-8 text-green-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const getFileType = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return 'PDF Document';
      case 'doc':
        return 'Word Document';
      case 'docx':
        return 'Word Document (DOCX)';
      case 'jpg':
      case 'jpeg':
        return 'JPEG Image';
      case 'png':
        return 'PNG Image';
      case 'gif':
        return 'GIF Image';
      default:
        return 'Unknown File Type';
    }
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download file');
    }
  };

  const renderFileContent = () => {
    const ext = filename.toLowerCase().split('.').pop();
    
    if (ext === 'pdf') {
      return (
        <div className="w-full h-96">
          <iframe
            src={fileUrl}
            className="w-full h-full border rounded-md"
            title={filename}
          />
        </div>
      );
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
      return (
        <div className="flex justify-center">
          <img
            src={fileUrl}
            alt={filename}
            className="max-w-full max-h-96 object-contain rounded-md"
            onError={() => setError('Failed to load image')}
          />
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-md">
          <FileText className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">Preview not available for this file type</p>
          <Button onClick={handleDownload} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download to View
          </Button>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon(filename)}
              <div>
                <DialogTitle className="text-lg">{filename}</DialogTitle>
                <Badge variant="secondary" className="mt-1">
                  {getFileType(filename)}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button onClick={onClose} variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          {error ? (
            <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-md">
              <FileText className="h-16 w-16 text-red-400 mb-4" />
              <p className="text-red-600 mb-2">{error}</p>
              <Button onClick={handleDownload} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download File
              </Button>
            </div>
          ) : (
            renderFileContent()
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
