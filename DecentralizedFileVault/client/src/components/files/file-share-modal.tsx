import { FC, useState } from 'react';
import { Clipboard, User, Users } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatFileSize } from '@/lib/fileUtils';
import { apiRequest } from '@/lib/queryClient';
import { shareFile, shareFileByRecipientId, getShareLink } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileIcon from '@/components/ui/file-icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { File } from '@shared/schema';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface FileShareModalProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
}

const FileShareModal: FC<FileShareModalProps> = ({ file, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('email');
  const [email, setEmail] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [permission, setPermission] = useState('view');
  const [requirePassword, setRequirePassword] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const shareLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await getShareLink(file.id.toString(), requirePassword);
      return response;
    },
    onSuccess: (data) => {
      setShareLink(data.shareLink);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to generate share link: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  const shareWithUserByEmailMutation = useMutation({
    mutationFn: async () => {
      if (!email) {
        throw new Error('Please enter an email address');
      }
      return shareFile(file.id.toString(), email, permission);
    },
    onSuccess: () => {
      toast({
        title: 'File Shared',
        description: `File has been shared with ${email}`,
      });
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['/api/files/shared'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Sharing Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const shareWithUserByIdMutation = useMutation({
    mutationFn: async () => {
      if (!recipientId) {
        throw new Error('Please enter a recipient ID');
      }
      return shareFileByRecipientId(file.id.toString(), parseInt(recipientId), permission);
    },
    onSuccess: () => {
      toast({
        title: 'File Shared',
        description: `File has been shared with recipient ID: ${recipientId}`,
      });
      setRecipientId('');
      queryClient.invalidateQueries({ queryKey: ['/api/files/shared'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Sharing Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const handleShareWithUserByEmail = (e: React.FormEvent) => {
    e.preventDefault();
    shareWithUserByEmailMutation.mutate();
  };
  
  const handleShareWithUserById = (e: React.FormEvent) => {
    e.preventDefault();
    shareWithUserByIdMutation.mutate();
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: 'Link Copied',
      description: 'Share link has been copied to clipboard',
    });
  };
  
  // Generate share link when modal opens
  useState(() => {
    if (isOpen) {
      shareLinkMutation.mutate();
    }
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 mb-4">
          <FileIcon filename={file.name} />
          <div>
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <Label htmlFor="permission">Permission level</Label>
          <Select value={permission} onValueChange={setPermission}>
            <SelectTrigger id="permission" className="w-full mt-1">
              <SelectValue placeholder="Select permission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="view">Can view</SelectItem>
              <SelectItem value="edit">Can edit</SelectItem>
              <SelectItem value="download">Can download</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Share by Email
            </TabsTrigger>
            <TabsTrigger value="id" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Share by ID
            </TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <form onSubmit={handleShareWithUserByEmail} className="mt-2">
              <Label htmlFor="email">Email address</Label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-grow"
                />
                <Button 
                  type="submit" 
                  className="ml-3"
                  disabled={shareWithUserByEmailMutation.isPending}
                >
                  Add
                </Button>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="id">
            <form onSubmit={handleShareWithUserById} className="mt-2">
              <Label htmlFor="recipient-id">Recipient ID</Label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <Input
                  type="number"
                  id="recipient-id"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder="Enter recipient user ID"
                  className="flex-grow"
                />
                <Button 
                  type="submit" 
                  className="ml-3"
                  disabled={shareWithUserByIdMutation.isPending}
                >
                  Add
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
        
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Share link</p>
          <div className="flex rounded-md shadow-sm">
            <Input
              type="text"
              value={shareLink || 'Generating link...'}
              readOnly
              className="flex-grow bg-gray-50"
            />
            <Button 
              variant="outline" 
              className="ml-3" 
              onClick={handleCopyLink}
              disabled={!shareLink}
            >
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-1 flex items-center">
            <Checkbox
              id="require-password"
              checked={requirePassword}
              onCheckedChange={(checked) => {
                setRequirePassword(checked === true);
                if (checked) {
                  shareLinkMutation.mutate();
                }
              }}
            />
            <Label htmlFor="require-password" className="ml-2 text-sm">
              Require password for access
            </Label>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">People with access</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gray-200 text-gray-500">
                    {file.owner.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">You (Owner)</p>
                  <p className="text-xs text-gray-500">{file.owner}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (activeTab === 'email' && email) {
                shareWithUserByEmailMutation.mutate();
              } else if (activeTab === 'id' && recipientId) {
                shareWithUserByIdMutation.mutate();
              } else {
                onClose();
              }
            }}
            disabled={shareWithUserByEmailMutation.isPending || shareWithUserByIdMutation.isPending}
          >
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileShareModal;
