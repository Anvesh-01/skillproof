"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, Award, Clock, AlertTriangle, Shield } from "lucide-react";

interface VerificationData {
  examId: string;
  certificateName: string;
  userName: string;
  examDate: string;
  duration: string;
  totalQuestions: number;
  correctAnswers: number;
  originalScore: number;
  cheatingLogs: {
    total: number;
    high: number;
    medium: number;
    low: number;
    violations: Array<{
      type: string;
      severity: string;
      time: string;
    }>;
  };
  cheatingPenalty: string;
  adjustedScore: string;
  finalGrade: string;
  questions: Array<{
    q: number;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    correct: boolean;
  }>;
}

export default function VerifyExam() {
  const params = useParams();
  const examId = params.examId as string;

  const [data, setData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (examId) {
      fetchVerificationData();
    }
  }, [examId]);

  const fetchVerificationData = async () => {
    try {
      // In a real implementation, this would decode QR data
      // For now, we'll fetch from the API
      const response = await fetch(`/api/exam/verify/${examId}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError("Invalid or expired verification code");
      }
    } catch (err) {
      setError("Failed to verify exam. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md bg-white rounded-xl shadow-lg p-8">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const isPassed = data.finalGrade === 'PASS';

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Verification Header */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-green-500 p-8 mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Verified Exam Certificate
          </h1>
          <p className="text-center text-gray-600 mb-6">
            This certificate has been verified and authenticated by SkillProof
          </p>

          <div className="bg-gray-50 rounded-lg p-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Certificate:</span>
              <span className="font-semibold text-gray-900">{data.certificateName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Candidate:</span>
              <span className="font-semibold text-gray-900">{data.userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Exam Date:</span>
              <span className="font-semibold text-gray-900">
                {new Date(data.examDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-semibold text-gray-900">{data.duration}</span>
            </div>
          </div>
        </div>

        {/* Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Original Score</p>
              <p className="text-3xl font-bold text-blue-600">{data.originalScore}%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Penalty</p>
              <p className="text-3xl font-bold text-red-600">-{data.cheatingPenalty}%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Final Score</p>
              <p className="text-3xl font-bold text-green-600">{data.adjustedScore}%</p>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border p-6 ${
            isPassed ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
          }`}>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Result</p>
              <p className={`text-3xl font-bold ${
                isPassed ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.finalGrade}
              </p>
            </div>
          </div>
        </div>

        {/* Proctoring Report */}
        {data.cheatingLogs.total > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Proctoring Report</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{data.cheatingLogs.high}</p>
                <p className="text-sm text-red-800">High Severity</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{data.cheatingLogs.medium}</p>
                <p className="text-sm text-yellow-800">Medium Severity</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{data.cheatingLogs.low}</p>
                <p className="text-sm text-blue-800">Low Severity</p>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {data.cheatingLogs.violations.map((v, i) => (
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
                      {new Date(v.time).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions & Answers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Exam Questions & Answers</h2>
          <div className="space-y-4">
            {data.questions.map((q) => (
              <div 
                key={q.q}
                className={`p-4 rounded-lg border-l-4 ${
                  q.correct 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 flex-1">
                    Question {q.q}: {q.question}
                  </h3>
                  {q.correct ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Candidate's Answer:</p>
                    <p className={`text-sm font-semibold ${
                      q.correct ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {q.userAnswer || 'Not answered'}
                    </p>
                  </div>
                  
                  {!q.correct && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Correct Answer:</p>
                      <p className="text-sm font-semibold text-green-700">{q.correctAnswer}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification Footer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <Shield className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">
            This certificate has been verified by SkillProof's automated proctoring system.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Certificate ID: {data.examId}
          </p>
        </div>
      </div>
    </main>
  );
}

