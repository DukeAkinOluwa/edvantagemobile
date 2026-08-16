import { useEffect, useState } from "react";
import * as FileSystem from "expo-file-system";

// Simple string hash function for cache filenames
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

export function useMediaCache(remoteUrl: string | undefined, expectedExtension: string) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMedia() {
      if (!remoteUrl) {
        if (isMounted) setLocalUri(null);
        return;
      }

      // Check if it's already a local URI (e.g. from picker before upload finishes)
      if (remoteUrl.startsWith("file://") || remoteUrl.startsWith("content://")) {
        if (isMounted) setLocalUri(remoteUrl);
        return;
      }

      try {
        if (isMounted) setDownloading(true);

        const fileName = `${hashString(remoteUrl)}_${remoteUrl.length}.${expectedExtension}`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (fileInfo.exists) {
          if (isMounted) setLocalUri(fileUri);
        } else {
          // Download the file to the cache directory
          const downloadRes = await FileSystem.downloadAsync(remoteUrl, fileUri);
          if (isMounted) setLocalUri(downloadRes.uri);
        }
      } catch (err: any) {
        console.error("Media Cache Error:", err);
        if (isMounted) {
          setError(err);
          // Fallback to remote URL if download fails
          setLocalUri(remoteUrl);
        }
      } finally {
        if (isMounted) setDownloading(false);
      }
    }

    loadMedia();

    return () => {
      isMounted = false;
    };
  }, [remoteUrl, expectedExtension]);

  return { localUri, downloading, error };
}
