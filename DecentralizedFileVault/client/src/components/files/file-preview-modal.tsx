import { FC, useState, useEffect } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { formatFileSize } from '@/lib/fileUtils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import FileIcon from '@/components/ui/file-icon';
import { File } from '@shared/schema';

interface FilePreviewModalProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
}

const FilePreviewModal: FC<FilePreviewModalProps> = ({ file, isOpen, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  const previewFileMutation = useMutation({
    mutationFn: () => {
      return apiRequest('GET', `/api/files/${file.id}/preview`);
    },
    onSuccess: async (response) => {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    },
    onError: (error: Error) => {
      toast({
        title: 'Preview Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const downloadFileMutation = useMutation({
    mutationFn: () => {
      return apiRequest('GET', `/api/files/${file.id}/download`);
    },
    onSuccess: async (response) => {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'File Downloaded',
        description: 'Your file has been decrypted and downloaded',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Download Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  useEffect(() => {
    if (isOpen && isPreviewable()) {
      previewFileMutation.mutate();
    }
    
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    };
  }, [isOpen, file.id]);
  
  const isPreviewable = () => {
    return file.type.startsWith('image/') || file.type === 'application/pdf';
  };
  
  const renderPreview = () => {
    if (previewFileMutation.isPending) {
      return (
        <div className="flex items-center justify-center h-96">
          <p>Loading preview...</p>
        </div>
      );
    }
    
    if (!previewUrl) {
      return (
        <div className="bg-gray-200 w-full h-96 flex items-center justify-center">
          <div className="text-center">
            <FileIcon filename={file.name} size={48} className="mx-auto h-16 w-16" />
            <p className="text-gray-600 mt-2">Preview not available</p>
          </div>
        </div>
      );
    }
    
    if (file.type.startsWith('image/')) {
      return (
        <div className="overflow-auto h-96 flex items-center justify-center bg-gray-100">
          <img src={previewUrl} alt={file.name} className="max-w-full max-h-full object-contain" />
        </div>
      );
    }
    
    if (file.type === 'application/pdf') {
      return (
        <iframe
          src={previewUrl}
          title={file.name}
          className="w-full h-96"
        />
      );
    }
    
    return (
      <div className="bg-gray-200 w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <FileIcon filename={file.name} size={48} className="mx-auto h-16 w-16" />
          <p className="text-gray-600 mt-2">Preview not available for this file type</p>
        </div>
      </div>
    );
  };
  
  const handleDownload = () => {
    downloadFileMutation.mutate();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>File Preview</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
          {renderPreview()}
          
          <div className="mt-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(file.size)} • Encrypted with AES</p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={downloadFileMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
