// Convert bytes to human-readable file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${sizes[i]}`;
}

// Get file icon type based on file extension or mime type
export function getFileType(filename: string): 'image' | 'pdf' | 'zip' | 'exe' | 'apk' | 'text' | 'audio' | 'video' | 'other' {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
    return 'image';
  } else if (extension === 'pdf') {
    return 'pdf';
  } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return 'zip';
  } else if (extension === 'exe') {
    return 'exe';
  } else if (extension === 'apk') {
    return 'apk';
  } else if (['txt', 'doc', 'docx', 'rtf', 'odt'].includes(extension)) {
    return 'text';
  } else if (['mp3', 'wav', 'ogg', 'flac'].includes(extension)) {
    return 'audio';
  } else if (['mp4', 'avi', 'mov', 'wmv', 'mkv'].includes(extension)) {
    return 'video';
  } else {
    return 'other';
  }
}

// Format relative time (e.g. "2 days ago")
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

// Create a URL from an array buffer
export function createBlobUrl(data: ArrayBuffer, mimeType: string): string {
  const blob = new Blob([data], { type: mimeType });
  return URL.createObjectURL(blob);
}

// Validate file size (max 2GB)
export function validateFileSize(file: File): boolean {
  const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
  return file.size <= MAX_FILE_SIZE;
}

// Download a file from URL or Blob
export function downloadFile(url: string | Blob, filename: string): void {
  const a = document.createElement('a');
  if (typeof url === 'string') {
    a.href = url;
  } else {
    a.href = URL.createObjectURL(url);
  }
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (typeof url !== 'string') {
    URL.revokeObjectURL(a.href);
  }
}
