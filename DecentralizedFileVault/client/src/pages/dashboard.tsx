import { FC } from 'react';
import StatsOverview from '@/components/dashboard/stats-overview';
import FileUpload from '@/components/files/file-upload';
import FileList from '@/components/files/file-list';
import BlockchainInfo from '@/components/blockchain/blockchain-info';

const Dashboard: FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StatsOverview />
      <FileUpload />
      <FileList title="Recent Files" endpoint="/api/files" />
      <BlockchainInfo />
    </div>
  );
};

export default Dashboard;
