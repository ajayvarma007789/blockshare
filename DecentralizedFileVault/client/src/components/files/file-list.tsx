import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FileListItem from './file-list-item';
import FilePreviewModal from './file-preview-modal';
import FileShareModal from './file-share-modal';
import { File } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';

interface FileListProps {
  title?: string;
  endpoint: string;
}

const FileList: FC<FileListProps> = ({ title = 'Recent Files', endpoint }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const { data: files, isLoading } = useQuery<File[]>({
    queryKey: [endpoint]
  });

  const filteredFiles = files?.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePreviewFile = (file: File) => {
    setSelectedFile(file);
    setIsPreviewModalOpen(true);
  };

  const handleShareFile = (file: File) => {
    setSelectedFile(file);
    setIsShareModalOpen(true);
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search files"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="divide-y divide-gray-200">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="ml-4 space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredFiles && filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <FileListItem
                  key={file.id}
                  file={file}
                  onPreview={() => handlePreviewFile(file)}
                  onShare={() => handleShareFile(file)}
                />
              ))
            ) : (
              <li className="p-4 text-center text-gray-500">
                {searchTerm ? 'No files match your search.' : 'No files found.'}
              </li>
            )}
          </ul>
        )}
      </div>
      
      {selectedFile && (
        <>
          <FilePreviewModal
            file={selectedFile}
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
          />
          <FileShareModal
            file={selectedFile}
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export default FileList;
