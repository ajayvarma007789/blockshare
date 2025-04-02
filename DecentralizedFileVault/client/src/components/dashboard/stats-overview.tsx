import { FC } from 'react';
import StatsCard from './stats-card';
import { FileUp, Share2, HardDrive, FileDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface StatsData {
  filesUploaded: number;
  filesShared: number;
  storageUsed: string;
  downloads: number;
}

// This would normally come from an API call
// Here we're using TanStack Query to fetch from our backend
const StatsOverview: FC = () => {
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ['/api/stats'],
    initialData: {
      filesUploaded: 42,
      filesShared: 23,
      storageUsed: '1.2 GB',
      downloads: 128
    }
  });

  if (isLoading) {
    return <div>Loading stats...</div>;
  }

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Files Uploaded"
          value={stats?.filesUploaded || 0}
          icon={<FileUp className="h-5 w-5" />}
          iconBackground="bg-primary/10"
          iconColor="text-primary"
        />
        <StatsCard
          title="Files Shared"
          value={stats?.filesShared || 0}
          icon={<Share2 className="h-5 w-5" />}
          iconBackground="bg-secondary/10"
          iconColor="text-secondary"
        />
        <StatsCard
          title="Storage Used"
          value={stats?.storageUsed || '0 B'}
          icon={<HardDrive className="h-5 w-5" />}
          iconBackground="bg-accent/10"
          iconColor="text-accent"
        />
        <StatsCard
          title="Downloads"
          value={stats?.downloads || 0}
          icon={<FileDown className="h-5 w-5" />}
          iconBackground="bg-gray-100"
          iconColor="text-gray-500"
        />
      </div>
    </div>
  );
};

export default StatsOverview;
