"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Calendar, Search, CheckCircle, Circle, AlertCircle, ArrowRight, Brain } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface Certificate {
  _id: string;
  courseName: string;
  filePath: string;
  questions: any[];
  uploadedAt: string;
  status: string;
  selected: boolean;
}

export default function SelectCertificate() {
  const router = useRouter();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [message, setMessage] = useState("");
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
        const certs = (data.data || []).map((cert: any) => ({
          ...cert,
          selected: false
        }));
        setCertificates(certs);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setCertificates(certificates.map(cert => 
      cert._id === id ? { ...cert, selected: true } : { ...cert, selected: false }
    ));
  };

  const clearSelection = () => {
    setCertificates(certificates.map(cert => ({ ...cert, selected: false })));
  };

  const handleStartExam = () => {
    const selectedCert = certificates.find(cert => cert.selected);
    if (!selectedCert) {
      setMessage("⚠️ Please select a certificate to proceed.");
      return;
    }
    setMessage("");
    setShowInstructions(true);
  };

  const proceedToExam = async () => {
    const selectedCert = certificates.find(cert => cert.selected);
    if (!selectedCert) return;

    try {
      // Start exam
      const response = await fetch("/api/exams/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          certificateId: selectedCert._id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to exam page with exam ID and certificate ID
        router.push(`/exam?examId=${data.data._id}&certificateId=${selectedCert._id}`);
      } else {
        alert("Failed to start exam. Please try again.");
      }
    } catch (error) {
      console.error("Error starting exam:", error);
      alert("Failed to start exam. Please try again.");
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

  const filteredCertificates = certificates
    .filter(cert => cert.courseName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  const selectedCount = certificates.filter(cert => cert.selected).length;
  const selectedCert = certificates.find(cert => cert.selected);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Select Certificate for Verification</h1>
          <p className="text-gray-600">Choose the certificate you want to verify through the skill assessment exam</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Your Certificates</h2>
            </div>
            <span className="text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 rounded-full">
              {selectedCount === 1 ? '1 selected' : 'Select a certificate'}
            </span>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search certificates by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Clear Selection */}
          {selectedCount > 0 && (
            <div className="flex gap-3 mb-4">
              <button
                onClick={clearSelection}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Clear Selection
              </button>
            </div>
          )}

          {/* Certificates List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading certificates...</p>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {searchQuery ? <Search className="w-10 h-10 text-gray-400" /> : <FileText className="w-10 h-10 text-gray-400" />}
              </div>
              <p className="text-gray-500 text-lg">
                {searchQuery ? "No certificates found matching your search" : "No certificates uploaded yet"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery ? "Try a different search term" : "Upload your first certificate to get started"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {filteredCertificates.map((cert) => (
                <div
                  key={cert._id}
                  onClick={() => toggleSelection(cert._id)}
                  className={`group flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${
                    cert.selected 
                      ? 'bg-blue-50 border-2 border-blue-500 shadow-sm' 
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  {cert.selected ? (
                    <CheckCircle className="w-7 h-7 text-blue-600 flex-shrink-0" />
                  ) : (
                    <Circle className="w-7 h-7 text-gray-400 flex-shrink-0 group-hover:text-gray-500" />
                  )}
                  
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate text-lg">{cert.courseName}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(cert.uploadedAt)}
                      </span>
                      <span>•</span>
                      <span>{cert.questions.length} questions</span>
                    </div>
                  </div>

                  {cert.selected && (
                    <div className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                      SELECTED
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Message */}
          {message && (
            <div className="mt-4 text-center p-3 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200">
              {message}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            ← Back to Dashboard
          </button>
          
          <button
            onClick={handleStartExam}
            disabled={selectedCount === 0}
            className={`flex-1 px-6 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              selectedCount > 0 
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-lg' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Brain className="w-5 h-5" />
            Start Exam {selectedCount > 0 && '(1 Certificate)'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions Modal */}
        {showInstructions && selectedCert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Exam Instructions</h2>
                    <p className="text-sm text-gray-600 mt-1">Please read carefully before proceeding</p>
                  </div>
                </div>

                <div className="space-y-6 text-gray-700">
                  {/* Selected Certificate */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-sm font-semibold text-blue-800 mb-2">📋 Certificate Selected:</p>
                    <div className="text-sm text-blue-700 font-medium">• {selectedCert.courseName}</div>
                    <div className="text-xs text-blue-600 mt-1">{selectedCert.questions.length} questions will be asked</div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm">1</span>
                      Before You Begin
                    </h3>
                    <ul className="space-y-2 ml-8">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">✓</span>
                        <span>Ensure you have a <strong>stable internet connection</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">✓</span>
                        <span>Find a <strong>quiet environment</strong> without distractions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">✓</span>
                        <span>Close all unnecessary browser tabs and applications</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">✓</span>
                        <span>Have your reference materials ready if needed</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm">2</span>
                      During the Exam
                    </h3>
                    <ul className="space-y-2 ml-8">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span><strong>Read each question carefully</strong> before selecting your answer</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>You can navigate between questions using Previous/Next buttons</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>Your progress is saved automatically</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>Questions are based on the certificate: <strong>{selectedCert.courseName}</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>Take your time - there's no strict time limit</span>
                      </li>
                    </ul>
                  </div>

                  {/* Important Notice */}
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                    <p className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Important Notice</p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• You need to score <strong>70% or higher</strong> to pass</li>
                      <li>• Once submitted, you <strong>cannot retake</strong> the same exam</li>
                      <li>• Your responses will be evaluated automatically</li>
                      <li>• Results will be shown immediately after submission</li>
                    </ul>
                  </div>

                  {/* Exam Details */}
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Total Questions</p>
                        <p className="text-sm text-gray-600 mt-1">{selectedCert.questions.length} questions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">Passing Score</p>
                        <p className="text-sm text-gray-600 mt-1">70% or higher</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={proceedToExam}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    I Understand, Start Exam
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
