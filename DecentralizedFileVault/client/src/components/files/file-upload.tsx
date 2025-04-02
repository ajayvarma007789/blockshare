import { FC, useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Lock, Link, Database } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { encryptFile, generateEncryptionKey } from '@/lib/cryptoUtils';
import { validateFileSize } from '@/lib/fileUtils';
import { useToast } from '@/hooks/use-toast';
import { uploadToFilecoin } from '@/lib/filecoinUtils';

const FileUpload: FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!validateFileSize(file)) {
        throw new Error('File size exceeds the maximum limit of 2GB');
      }
      
      // Generate encryption key
      const encryptionKey = generateEncryptionKey();
      
      // Encrypt file
      const { encryptedData } = await encryptFile(file, encryptionKey);
      
      // Upload to Filecoin
      const cid = await uploadToFilecoin(
        encryptedData,
        file.name,
        file.type,
        file.size
      );
      
      // Save file metadata to our backend
      return apiRequest('POST', '/api/files', {
        name: file.name,
        size: file.size,
        type: file.type,
        cid,
        encryptionKey
      });
    },
    onSuccess: () => {
      toast({
        title: 'File Uploaded',
        description: 'Your file has been encrypted and stored on the blockchain',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleUpload = (file: File) => {
    uploadFileMutation.mutate(file);
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg mb-8">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Upload Files</h3>
        <div className="mt-4 max-w-3xl text-sm text-gray-500">
          <p>Files are securely encrypted with AES before being stored on the Filecoin blockchain.</p>
        </div>
        <div className="mt-5">
          <div 
            className={`max-w-3xl border-2 border-dashed ${isDragging ? 'border-accent' : 'border-gray-300'} rounded-lg p-12 text-center hover:border-accent transition-colors duration-300 cursor-pointer`}
            onClick={openFileDialog}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-1 text-center">
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <div className="flex text-sm text-gray-600 justify-center">
                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-accent hover:text-accent focus-within:outline-none">
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    disabled={uploadFileMutation.isPending}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                Support for any file type. Max 2GB per file.
              </p>
              <div className="flex items-center justify-center mt-4 space-x-2 text-xs">
                <div className="flex items-center space-x-1">
                  <Lock className="h-3 w-3 text-secondary" />
                  <span>AES Encryption</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Link className="h-3 w-3 text-accent" />
                  <span>Filecoin Storage</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Database className="h-3 w-3 text-primary" />
                  <span>Supabase Backend</span>
                </div>
              </div>
              {uploadFileMutation.isPending && (
                <div className="mt-4 text-sm text-accent">
                  Encrypting and uploading file...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
