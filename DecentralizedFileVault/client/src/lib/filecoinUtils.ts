// Simplified interface for interacting with Filecoin via the server API

// Upload file to Filecoin through our API
export async function uploadToFilecoin(
  encryptedData: string,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<string> {
  const response = await fetch('/api/files/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      encryptedData,
      fileName,
      fileType,
      fileSize,
    }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload to Filecoin: ${error}`);
  }

  const data = await response.json();
  return data.cid;
}

// Retrieve file from Filecoin through our API
export async function retrieveFromFilecoin(cid: string): Promise<string> {
  const response = await fetch(`/api/files/retrieve/${cid}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to retrieve from Filecoin: ${error}`);
  }

  const data = await response.json();
  return data.encryptedData;
}

// Check Filecoin network status
export async function getFilecoinStatus(): Promise<{
  status: string;
  providers: string;
}> {
  const response = await fetch('/api/blockchain/status', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get Filecoin network status');
  }

  return await response.json();
}

// Get recent blockchain transactions
export async function getRecentTransactions(): Promise<Array<{
  id: string;
  cid: string;
  type: string;
  status: string;
  timestamp: string;
}>> {
  const response = await fetch('/api/blockchain/transactions', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get recent transactions');
  }

  return await response.json();
}
