import { FC } from 'react';
import FileList from '@/components/files/file-list';

const SharedFiles: FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Shared Files</h1>
      <div className="bg-white shadow sm:rounded-lg mb-8 p-4">
        <p className="text-gray-500">Files that have been shared with you will appear here.</p>
      </div>
      <FileList title="Files Shared With Me" endpoint="/api/files/shared" />
    </div>
  );
};

export default SharedFiles;
