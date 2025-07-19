"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getDocuments,
  uploadDocument,
  signDocument,
  deleteDocument,
  downloadDocument,
  type Document,
  type UploadDocumentData,
  type SignDocumentData,
  type ErrorResponse,
} from "@/src/lib/auth-api";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch documents"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadDoc = useCallback(
    async (data: UploadDocumentData) => {
      setError(null);

      try {
        const newDoc = await uploadDocument(data);
        setDocuments((prev) => [newDoc, ...prev]);
        return newDoc;
      } catch (err) {
        if (err && typeof err === "object" && "title" in err) {
          throw err as ErrorResponse;
        }
        throw new Error("Failed to upload document");
      }
    },
    [documents]
  );

  const signAndRefresh = useCallback(
    async (data: SignDocumentData) => {
      setError(null);

      try {
        await signDocument(data);
        await fetchDocuments();
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "Failed to sign document"
        );
      }
    },
    [fetchDocuments]
  );

  const downloadDoc = async () => {
    throw new Error("Deprecated: use local handleDownload()");
  };

  const deleteDoc = useCallback(async (documentId: number) => {
    setError(null);

    try {
      await deleteDocument(documentId);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (err) {
      throw new Error("Failed to delete document");
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    isLoading,
    error,
    fetchDocuments,
    uploadDoc,
    signAndRefresh,
    downloadDoc,
    deleteDoc,
  };
}
