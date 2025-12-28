"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Calendar, Trash2, Eye, Download } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface Certificate {
  _id: string;
  courseName: string;
  filePath: string;
  questions: any[];
  uploadedAt: string;
  status: string;
}

export default function UploadCertificate() {
  const router = useRouter();
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchCertificates();
    }
  }, [user]);

  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/certificates/user/${user?.id}`);
      const data = await response.json();
      
      if (data.success) {
        setCertificates(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile && selectedFile.type !== "application/pdf") {
      setMessage("❌ Only PDF files are allowed.");
      setFile(null);
      return;
    }

    if (selectedFile) {
      setFile(selectedFile);
      setMessage("✅ File selected: " + selectedFile.name);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setMessage("⚠️ Please select a PDF certificate first.");
      return;
    }

    if (!user) {
      setMessage("❌ Please sign in to upload certificates.");
      return;
    }

    setIsUploading(true);
    setMessage("📤 Uploading and processing certificate...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clerkUserId", user.id);
      formData.append("username", user.username || "");
      formData.append("email", user.emailAddresses[0]?.emailAddress || "");

      const response = await fetch("/api/upload-certificate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Certificate uploaded! Course: ${data.courseName}, Questions: ${data.questions}`);
        setFile(null);
        
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = "";

        await fetchCertificates();
      } else {
        setMessage(`❌ Upload failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error uploading certificate:", error);
      setMessage("❌ Failed to upload certificate. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, courseName: string) => {
    if (!confirm(`Are you sure you want to delete "${courseName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/certificates/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage("🗑️ Certificate deleted successfully!");
        setCertificates(certificates.filter(cert => cert._id !== id));
      } else {
        setMessage("❌ Failed to delete certificate");
      }
    } catch (error) {
      console.error("Error deleting certificate:", error);
      setMessage("❌ Failed to delete certificate.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const sortedCertificates = [...certificates].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Certificate Management</h1>
          <p className="text-gray-600">Upload and manage your professional certificates</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Upload className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Upload New Certificate</h2>
          </div>

          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                
                <div>
                  <label 
                    htmlFor="file-upload" 
                    className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Click to upload
                  </label>
                  <span className="text-gray-600"> or drag and drop</span>
                  <p className="text-sm text-gray-500 mt-1">PDF files only (Max 10MB)</p>
                </div>

                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </div>

              {file && (
                <div className="mt-4 inline-flex items-center justify-center gap-2 text-sm text-gray-700 bg-blue-50 py-2 px-4 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{file.name}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!file || isUploading}
              className={`w-full px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                !file || isUploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Upload className="w-5 h-5" />
              {isUploading ? 'Processing...' : 'Upload Certificate'}
            </button>

            {message && (
              <div className={`text-center p-3 rounded-lg ${
                message.includes('❌') || message.includes('⚠️') 
                  ? 'bg-red-50 text-red-700' 
                  : message.includes('📤')
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-green-50 text-green-700'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Certificates List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Your Certificates</h2>
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {sortedCertificates.length} {sortedCertificates.length === 1 ? 'certificate' : 'certificates'}
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading certificates...</p>
            </div>
          ) : sortedCertificates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No certificates uploaded yet</p>
              <p className="text-sm text-gray-400 mt-1">Upload your first certificate to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCertificates.map((cert) => (
                <div
                  key={cert._id}
                  className="group flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{cert.courseName}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(cert.uploadedAt)}
                        </span>
                        <span>•</span>
                        <span>{cert.questions.length} questions</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          cert.status === 'verified' 
                            ? 'bg-green-100 text-green-700'
                            : cert.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {cert.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(cert._id, cert.courseName)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete certificate"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}