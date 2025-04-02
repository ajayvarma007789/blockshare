import { FC } from 'react';
import { Eye, Share2, Download, Trash2 } from 'lucide-react';
import { formatFileSize, formatRelativeTime } from '@/lib/fileUtils';
import FileIcon from '@/components/ui/file-icon';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { File } from '@shared/schema';

interface FileListItemProps {
  file: File;
  onPreview: () => void;
  onShare: () => void;
}

const FileListItem: FC<FileListItemProps> = ({ file, onPreview, onShare }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const deleteFileMutation = useMutation({
    mutationFn: () => {
      return apiRequest('DELETE', `/api/files/${file.id}`);
    },
    onSuccess: () => {
      toast({
        title: 'File Deleted',
        description: 'The file has been successfully deleted',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete file: ${error.message}`,
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
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to download file: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  const handleDownload = () => {
    downloadFileMutation.mutate();
  };
  
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      deleteFileMutation.mutate();
    }
  };
  
  const isPreviewable = () => {
    const fileType = file.type.split('/')[0];
    return ['image', 'application/pdf'].includes(fileType);
  };
  
  return (
    <li className="hover:bg-gray-50">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileIcon filename={file.name} />
            <div className="ml-4">
              <div className="text-sm font-medium text-accent">{file.name}</div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span>{formatRelativeTime(new Date(file.uploadedAt))}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="success" className="bg-green-100 text-green-800">
              Encrypted
            </Badge>
            <div className="flex space-x-1">
              {isPreviewable() && (
                <Button variant="ghost" size="icon" onClick={onPreview} title="Preview">
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onShare} title="Share">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDownload}
                disabled={downloadFileMutation.isPending}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDelete}
                disabled={deleteFileMutation.isPending}
                className="text-red-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default FileListItem;
