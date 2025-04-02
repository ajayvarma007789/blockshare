import { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRecentTransactions } from '@/lib/filecoinUtils';
import { formatRelativeTime } from '@/lib/fileUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  id: string;
  cid: string;
  type: string;
  status: string;
  timestamp: string;
}

const TransactionList: FC = () => {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/blockchain/transactions'],
    queryFn: getRecentTransactions
  });

  // Format transaction ID and CID to be more readable
  const formatId = (id: string): string => {
    if (id.length > 12) {
      return `${id.substring(0, 5)}...${id.substring(id.length - 4)}`;
    }
    return id;
  };

  return (
    <div className="border border-gray-200 rounded-md p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Blockchain Transactions</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File CID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              // Show loading skeletons
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-20" /></td>
                </tr>
              ))
            ) : transactions && transactions.length > 0 ? (
              // Show actual transactions
              transactions.map((tx, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{formatId(tx.id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{formatId(tx.cid)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      {tx.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatRelativeTime(new Date(tx.timestamp))}
                  </td>
                </tr>
              ))
            ) : (
              // No transactions
              <tr>
                <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
