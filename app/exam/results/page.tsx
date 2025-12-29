"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Award, TrendingUp, Clock, Home, Download, AlertTriangle, QrCode } from "lucide-react";
import Image from "next/image";

interface Exam {
  _id: string;
  certificateName: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  result: string;
  proctoringViolations: Array<{
    type: string;
    timestamp: string;
    severity: string;
  }>;
  finalGrade?: string;
  cheatingPenalty?: number;
  questionsAnswered: Array<{
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

function ExamResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId");

  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCode, setQrCode] = useState("");
  const [generatingQR, setGeneratingQR] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchExamResults();
    }
  }, [examId]);

  const fetchExamResults = async () => {
    try {
      console.log('Fetching exam results for examId:', examId);
      const response = await fetch(`/api/exams/${examId}`);
      const data = await response.json();
      
      console.log('Exam results response:', data);
      
      if (data.success && data.data) {
        setExam(data.data);
      } else {
        console.error('Failed to fetch exam:', data.message);
      }
    } catch (error) {
      console.error("Error fetching exam results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!examId) return;

    setGeneratingQR(true);
    try {
      const response = await fetch("/api/proctoring/exam/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId }),
      });

      const data = await response.json();

      if (data.success) {
        setQrCode(data.data.qrCode);
        setShowQR(true);
      } else {
        console.error("QR generation failed:", data.message);
        alert(`Failed to generate QR code: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      alert("Failed to generate QR code. Please try again.");
    } finally {
      setGeneratingQR(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `exam-certificate-${examId}.png`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!examId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
          <div className="text-red-600 mb-4">
            <AlertTriangle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Missing Exam ID</h2>
          <p className="text-gray-600 mb-4">
            No exam ID was provided. Please submit your exam properly.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
          <div className="text-yellow-600 mb-4">
            <AlertTriangle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Not Found</h2>
          <p className="text-gray-600 mb-4">
            The exam results could not be found. This may happen if the exam was not submitted properly.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isPassed = exam.result === 'pass' || (exam.finalGrade && exam.finalGrade === 'PASS');
  const timeSpentMinutes = Math.floor(exam.timeSpent / 60);
  const timeSpentSeconds = exam.timeSpent % 60;
  const adjustedScore = exam.cheatingPenalty 
    ? Math.max(0, exam.score - exam.cheatingPenalty) 
    : exam.score;

  const violationSummary = {
    high: exam.proctoringViolations?.filter(v => v.severity === 'high').length || 0,
    medium: exam.proctoringViolations?.filter(v => v.severity === 'medium').length || 0,
    low: exam.proctoringViolations?.filter(v => v.severity === 'low').length || 0,
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Result Header */}
        <div className={`bg-white rounded-xl shadow-lg border-2 p-8 mb-8 ${
          isPassed ? 'border-green-500' : 'border-red-500'
        }`}>
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isPassed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {isPassed ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : (
                <XCircle className="w-12 h-12 text-red-600" />
              )}
            </div>
            
            <h1 className={`text-4xl font-bold mb-2 ${
              isPassed ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPassed ? 'Congratulations! 🎉' : 'Keep Trying! 💪'}
            </h1>
            
            <p className="text-xl text-gray-700 mb-4">
              {isPassed 
                ? 'You passed the exam and verified your skills!' 
                : 'You can try again to improve your score.'}
            </p>
            
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full">
              <Award className="w-5 h-5 text-gray-700" />
              <span className="font-semibold text-gray-700">{exam.certificateName}</span>
            </div>
          </div>
        </div>

        {/* Score Overview with Proctoring */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Original Score</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">{exam.score}%</p>
          </div>

          {exam.cheatingPenalty && exam.cheatingPenalty > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Penalty</p>
              </div>
              <p className="text-3xl font-bold text-red-600">-{exam.cheatingPenalty.toFixed(1)}%</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Final Score</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{adjustedScore.toFixed(1)}%</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Time Spent</p>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {timeSpentMinutes}:{timeSpentSeconds.toString().padStart(2, '0')}
            </p>
          </div>
        </div>

        {/* Proctoring Violations */}
        {exam.proctoringViolations && exam.proctoringViolations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Proctoring Report</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{violationSummary.high}</p>
                <p className="text-sm text-red-800">High Severity</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{violationSummary.medium}</p>
                <p className="text-sm text-yellow-800">Medium Severity</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{violationSummary.low}</p>
                <p className="text-sm text-blue-800">Low Severity</p>
              </div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {exam.proctoringViolations.map((v, i) => (
                <div key={i} className={`p-3 rounded-lg border-l-4 ${
                  v.severity === 'high' ? 'bg-red-50 border-red-500' :
                  v.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">
                      {v.type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(v.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${
                    v.severity === 'high' ? 'text-red-700' :
                    v.severity === 'medium' ? 'text-yellow-700' :
                    'text-blue-700'
                  }`}>
                    {v.severity.toUpperCase()} SEVERITY
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR Code Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Verification Certificate</h2>
            </div>
            
            {!showQR ? (
              <button
                onClick={generateQRCode}
                disabled={generatingQR}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
              >
                {generatingQR ? 'Generating...' : 'Generate QR Code'}
              </button>
            ) : (
              <button
                onClick={downloadQRCode}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                <Download className="w-4 h-4" />
                Download QR
              </button>
            )}
          </div>

          {showQR && qrCode && (
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                <Image 
                  src={qrCode} 
                  alt="Exam Verification QR Code" 
                  width={300} 
                  height={300}
                  className="rounded-lg"
                />
              </div>
              <p className="text-sm text-gray-600 text-center max-w-md">
                Scan this QR code to view complete exam details including all questions, answers, 
                proctoring violations, and final grade. This serves as your verified skill certificate.
              </p>
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                <p className="text-xs text-blue-800">
                  <strong>QR Code Contains:</strong> All questions asked, your answers, correct answers, 
                  time taken, proctoring violations, penalty applied, and final grade
                </p>
              </div>
            </div>
          )}

          {!showQR && (
            <div className="text-center py-8 text-gray-500">
              <QrCode className="w-16 h-16 mx-auto mb-3 text-gray-400" />
              <p>Generate a QR code to create your verified digital certificate</p>
              <p className="text-sm mt-2">
                The QR code will contain complete exam details and serve as proof of your skills
              </p>
            </div>
          )}
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Detailed Question Review</h2>
          <div className="space-y-4">
            {exam.questionsAnswered.map((qa, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  qa.isCorrect 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 flex-1">
                    Question {index + 1}: {qa.questionText}
                  </h3>
                  {qa.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Your Answer:</p>
                    <p className={`text-sm font-semibold ${
                      qa.isCorrect ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {qa.userAnswer || 'Not answered'}
                    </p>
                  </div>
                  
                  {!qa.isCorrect && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Correct Answer:</p>
                      <p className="text-sm font-semibold text-green-700">{qa.correctAnswer}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Home className="w-5 h-5" />
            Back to Dashboard
          </button>
          
          {!isPassed && (
            <button
              onClick={() => router.push("/select-certificate")}
              className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ExamResults() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading results...</p>
          </div>
        </div>
      }
    >
      <ExamResultsContent />
    </Suspense>
  );
}