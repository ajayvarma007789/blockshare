import { FC } from 'react';
import FileList from '@/components/files/file-list';
import FileUpload from '@/components/files/file-upload';

const MyFiles: FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">My Files</h1>
      <FileUpload />
      <FileList title="All Files" endpoint="/api/files" />
    </div>
  );
};

export default MyFiles;
