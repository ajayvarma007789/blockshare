import { FC } from 'react';
import { getFileType } from '@/lib/fileUtils';
import {
  FileImage,
  FileArchive,
  FileCode,
  Package,
  File,
  FileAudio,
  FileVideo,
  FileText,
  FileX
} from 'lucide-react';

interface FileIconProps {
  filename: string;
  size?: number;
  className?: string;
}

const FileIcon: FC<FileIconProps> = ({ filename, size = 24, className = '' }) => {
  const fileType = getFileType(filename);
  
  // Different background colors based on file type
  const getIconBackground = () => {
    switch (fileType) {
      case 'image':
        return 'bg-purple-100 text-purple-600';
      case 'pdf':
        return 'bg-blue-100 text-blue-600';
      case 'zip':
        return 'bg-gray-100 text-gray-600';
      case 'exe':
        return 'bg-gray-100 text-gray-600';
      case 'apk':
        return 'bg-green-100 text-green-600';
      case 'text':
        return 'bg-yellow-100 text-yellow-600';
      case 'audio':
        return 'bg-red-100 text-red-600';
      case 'video':
        return 'bg-indigo-100 text-indigo-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // Get the appropriate icon component based on file type
  const getIcon = () => {
    switch (fileType) {
      case 'image':
        return <FileImage size={size} />;
      case 'pdf':
        return <FileText size={size} />;
      case 'zip':
        return <FileArchive size={size} />;
      case 'exe':
        return <FileCode size={size} />;
      case 'apk':
        return <Package size={size} />;
      case 'text':
        return <FileText size={size} />;
      case 'audio':
        return <FileAudio size={size} />;
      case 'video':
        return <FileVideo size={size} />;
      default:
        return <File size={size} />;
    }
  };
  
  return (
    <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded ${getIconBackground()} ${className}`}>
      {getIcon()}
    </div>
  );
};

export default FileIcon;
