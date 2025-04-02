import CryptoJS from 'crypto-js';

// Generate a random encryption key
export function generateEncryptionKey(): string {
  // Generate a 256-bit random key (32 bytes)
  const keyArray = new Uint8Array(32);
  window.crypto.getRandomValues(keyArray);
  return Array.from(keyArray).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Encrypt a file using AES
export async function encryptFile(file: File, encryptionKey: string): Promise<{ encryptedData: string, encryptionKey: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target || !event.target.result) {
        reject(new Error('Failed to read file'));
        return;
      }
      
      try {
        const fileContent = event.target.result as ArrayBuffer;
        const wordArray = CryptoJS.lib.WordArray.create(fileContent);
        const encryptedData = CryptoJS.AES.encrypt(wordArray, encryptionKey).toString();
        
        resolve({
          encryptedData,
          encryptionKey
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Decrypt file data using AES
export function decryptFile(encryptedData: string, encryptionKey: string): ArrayBuffer {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    const typedArray = convertWordArrayToUint8Array(decrypted);
    return typedArray.buffer;
  } catch (error) {
    throw new Error('Failed to decrypt file: Invalid encryption key or corrupted data');
  }
}

// Helper function to convert WordArray to Uint8Array
function convertWordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const u8 = new Uint8Array(sigBytes);
  
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  
  return u8;
}
