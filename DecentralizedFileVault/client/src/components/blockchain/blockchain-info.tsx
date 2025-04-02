import { FC } from 'react';
import { Link, HardDrive, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getFilecoinStatus } from '@/lib/filecoinUtils';
import TransactionList from './transaction-list';
import { Skeleton } from '@/components/ui/skeleton';

const BlockchainInfo: FC = () => {
  const { data: blockchainStatus, isLoading } = useQuery({
    queryKey: ['/api/blockchain/status'],
    queryFn: getFilecoinStatus
  });

  return (
    <div className="bg-white shadow sm:rounded-lg mb-8">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Blockchain Storage Status</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Your files are stored securely on the Filecoin blockchain network.</p>
        </div>
        
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </>
          ) : (
            <>
              <div className="border border-gray-200 rounded-md p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-accent/10 rounded-md p-2">
                    <Link className="text-accent" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Network Status</h4>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-500">{blockchainStatus?.status || 'Connecting...'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-md p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary/10 rounded-md p-2">
                    <HardDrive className="text-primary" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Storage Providers</h4>
                    <div className="mt-1">
                      <span className="text-sm text-gray-500">{blockchainStatus?.providers || 'Loading...'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-md p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-secondary/10 rounded-md p-2">
                    <Lock className="text-secondary" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Encryption Status</h4>
                    <div className="mt-1">
                      <span className="text-sm text-gray-500">AES-256 Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-5">
          <TransactionList />
        </div>
      </div>
    </div>
  );
};

export default BlockchainInfo;
