// lib/storageService.ts
// Firebase Storage upload helpers for chat media (images & documents)

import { storage } from "./firebase";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  UploadTaskSnapshot,
} from "firebase/storage";

export interface UploadResult {
  downloadUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// ─── Core upload helper ───────────────────────────────────────────────────────

async function uploadFile(
  localUri: string,
  storagePath: string,
  mimeType: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const storageRef = ref(storage, storagePath);
  const task = uploadBytesResumable(storageRef, blob, { contentType: mimeType });

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap: UploadTaskSnapshot) => {
        const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
        onProgress?.(Math.round(pct));
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

// ─── Image upload ─────────────────────────────────────────────────────────────

export async function uploadChatImage(
  chatId: string,
  senderUid: string,
  localUri: string,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  const ext = localUri.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}_${senderUid}.${ext}`;
  const storagePath = `chat/${chatId}/images/${fileName}`;
  const mimeType = ext === "png" ? "image/png" : "image/jpeg";

  // Get file size
  const response = await fetch(localUri);
  const blob = await response.blob();
  const fileSize = blob.size;

  const downloadUrl = await uploadFile(localUri, storagePath, mimeType, onProgress);
  return { downloadUrl, storagePath, fileName, fileSize, mimeType };
}

// ─── Document upload ──────────────────────────────────────────────────────────

export async function uploadChatDocument(
  chatId: string,
  senderUid: string,
  localUri: string,
  originalName: string,
  mimeType: string,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  const fileName = `${Date.now()}_${originalName}`;
  const storagePath = `chat/${chatId}/documents/${fileName}`;

  const response = await fetch(localUri);
  const blob = await response.blob();
  const fileSize = blob.size;

  const downloadUrl = await uploadFile(localUri, storagePath, mimeType, onProgress);
  return { downloadUrl, storagePath, fileName: originalName, fileSize, mimeType };
}

// ─── File size formatter ──────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
