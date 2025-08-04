"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  FileText,
  LogOut,
  Upload,
  PenTool,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useDocuments } from "@/src/hooks/use-documents";
import type { Document, ErrorResponse } from "@/src/lib/auth-api";

interface DashboardProps {
  username?: string;
  onLogout?: () => void;
}

export default function Dashboard({
  username = "user",
  onLogout,
}: DashboardProps) {
  const departments = [
    { id: "hr", name: "Human Resources" },
    { id: "doj", name: "Department of Justice" },
    { id: "edu", name: "Education " },
    { id: "it", name: "Information Technology" },
    { id: "research", name: "Research Geeks" },
  ];

  const {
    documents,
    isLoading: documentsLoading,
    error: documentsError,
    uploadDoc,
    signAndRefresh,
    downloadDoc,
    deleteDoc,
  } = useDocuments();

  const [uploadForm, setUploadForm] = useState({
    title: "",
    department: "",
    file: null as File | null,
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [signDialog, setSignDialog] = useState<{
    isOpen: boolean;
    document: Document | null;
    password: string;
    loading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    document: null,
    password: "",
    loading: false,
    error: null,
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    document: Document | null;
    loading: boolean;
  }>({
    isOpen: false,
    document: null,
    loading: false,
  });

  const [downloadLoading, setDownloadLoading] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadForm((prev) => ({ ...prev, file }));
    setUploadError(null);
    setUploadSuccess(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !uploadForm.title.trim() ||
      !uploadForm.department.trim() ||
      !uploadForm.file
    )
      return;

    // Validate file type
    if (uploadForm.file.type !== "application/pdf") {
      setUploadError("Please select a PDF file");
      return;
    }

    // Validate file size (10MB limit)
    if (uploadForm.file.size > 10 * 1024 * 1024) {
      setUploadError("File size must be less than 10MB");
      return;
    }

    setUploadLoading(true);
    setUploadError(null);

    try {
      await uploadDoc({
        title: uploadForm.title.trim(),
        department: uploadForm.department.trim(),
        file: uploadForm.file,
      });

      setUploadForm({ title: "", department: "", file: null });
      setUploadSuccess(true);

      // Reset file input
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      if (err && typeof err === "object" && "title" in err) {
        const error = err as ErrorResponse;
        setUploadError(error.title?.[0] || error.file?.[0] || "Upload failed");
      } else {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      }
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signDialog.document || !signDialog.password.trim()) return;

    setSignDialog((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch("http://localhost:8000/api/verify-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ password: signDialog.password }),
      });

      const result = await res.json();

      if (!res.ok || !result.verified) {
        throw new Error("Password is incorrect");
      }

      await signAndRefresh({
        document_id: signDialog.document.id,
      });

      setSignDialog({
        isOpen: false,
        document: null,
        password: "",
        loading: false,
        error: null,
      });
    } catch (err) {
      setSignDialog((prev) => ({
        ...prev,
        loading: false,
        error:
          err instanceof Error ? err.message : "Password verification failed",
      }));
    }
  };

  const handleDownload = async (document: Document) => {
    setDownloadLoading(document.id);
    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/${document.id}/download/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to download");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.title + ".pdf";
      window.document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloadLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.document) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      await deleteDoc(deleteDialog.document.id);
      setDeleteDialog({ isOpen: false, document: null, loading: false });
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const openSignDialog = (document: Document) => {
    setSignDialog({
      isOpen: true,
      document,
      password: "",
      loading: false,
      error: null,
    });
  };

  const openDeleteDialog = (document: Document) => {
    setDeleteDialog({
      isOpen: true,
      document,
      loading: false,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Document Manager
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{username}</span>
              </span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Upload Document</span>
                </CardTitle>
                <CardDescription>
                  Upload a new PDF document to the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  {uploadError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{uploadError}</AlertDescription>
                    </Alert>
                  )}

                  {uploadSuccess && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Document uploaded successfully!
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Enter document title"
                      value={uploadForm.title}
                      onChange={(e) => {
                        setUploadForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }));
                        setUploadError(null);
                        setUploadSuccess(false);
                      }}
                      required
                      disabled={uploadLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department Case</Label>
                    <Select
                      value={uploadForm.department}
                      onValueChange={(value) => {
                        setUploadForm((prev) => ({
                          ...prev,
                          department: value,
                        }));
                        setUploadError(null);
                        setUploadSuccess(false);
                      }}
                      disabled={uploadLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">PDF File</Label>
                    <Input
                      id="file-doc"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required
                      disabled={uploadLoading}
                    />
                    <p className="text-xs text-gray-500">
                      Maximum file size: 10MB
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      !uploadForm.title.trim() ||
                      !uploadForm.department.trim() ||
                      !uploadForm.file ||
                      uploadLoading
                    }
                  >
                    {uploadLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Documents List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  Manage your uploaded documents and digital signatures
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentsError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{documentsError}</AlertDescription>
                  </Alert>
                )}

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="min-w-[100px]">
                          Upload By
                        </TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Signed By</TableHead>
                        <TableHead>Signed Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentsLoading
                        ? // Loading skeleton
                          Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <Skeleton className="h-4 w-32" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-24" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-16" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-20" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-20" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-24" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-24" />
                              </TableCell>
                            </TableRow>
                          ))
                        : documents.map((document) => (
                            <TableRow key={document.id}>
                              <TableCell className="font-medium text-center">
                                {document.title}
                              </TableCell>
                              <TableCell className="font-medium text-center">
                                {document.department}
                              </TableCell>
                              <TableCell className="text-center  font-bold">
                                {document.owner}
                              </TableCell>
                              <TableCell className="min-w-32 text-center">
                                {formatDate(document.uploaded_at)}
                              </TableCell>
                              <TableCell>{document.file_size || "-"}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    document.is_signed ? "default" : "secondary"
                                  }
                                >
                                  {document.is_signed ? "Signed" : "Unsigned"}
                                </Badge>
                              </TableCell>
                              <TableCell className="min-w-24">
                                {document.signed_by || "-"}
                              </TableCell>
                              <TableCell className="min-w-28">
                                {document.signed_at
                                  ? formatDate(document.signed_at)
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(document)}
                                    disabled={downloadLoading === document.id}
                                  >
                                    {downloadLoading === document.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4" />
                                    )}
                                  </Button>
                                  {!document.is_signed && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openSignDialog(document)}
                                    >
                                      <PenTool className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDeleteDialog(document)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </div>
                {!documentsLoading && documents.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No documents uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sign Document Dialog */}
      <Dialog
        open={signDialog.isOpen}
        onOpenChange={(open) => {
          if (!signDialog.loading) {
            setSignDialog((prev) => ({ ...prev, isOpen: open }));
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Document</DialogTitle>
            <DialogDescription>
              Enter your name to digitally sign "{signDialog.document?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {signDialog.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{signDialog.error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="sign-password">password</Label>
              <Input
                id="sign-password"
                placeholder="Enter your password"
                type="text"
                value={signDialog.password}
                onChange={(e) =>
                  setSignDialog((prev) => ({
                    ...prev,
                    password: e.target.value,
                    error: null,
                  }))
                }
                disabled={signDialog.loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setSignDialog({
                  isOpen: false,
                  document: null,
                  password: "",
                  loading: false,
                  error: null,
                })
              }
              disabled={signDialog.loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSign}
              disabled={!signDialog.password.trim() || signDialog.loading}
            >
              {signDialog.loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <PenTool className="h-4 w-4 mr-2" />
                  Sign Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!deleteDialog.loading) {
            setDeleteDialog((prev) => ({ ...prev, isOpen: open }));
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.document?.title}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDialog.loading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteDialog.loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteDialog.loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
