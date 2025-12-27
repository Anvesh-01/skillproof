"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Award, TrendingUp, Clock, Home } from "lucide-react";

interface Exam {
  _id: string;
  certificateName: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  result: string;
  questionsAnswered: Array<{
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

export default function ExamResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId");

  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (examId) {
      fetchExamResults();
    }
  }, [examId]);

  const fetchExamResults = async () => {
    try {
      const response = await fetch(`/api/exams/user/${examId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // If data.data is an array, find the specific exam
        if (Array.isArray(data.data)) {
          const foundExam = data.data.find((e: any) => e._id === examId);
          setExam(foundExam || null);
        } else {
          setExam(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching exam results:", error);
    } finally {
      setIsLoading(false);
    }
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

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Exam not found.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isPassed = exam.result === 'pass';
  const timeSpentMinutes = Math.floor(exam.timeSpent / 60);
  const timeSpentSeconds = exam.timeSpent % 60;

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

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Your Score</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">{exam.score}%</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Correct</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{exam.correctAnswers}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Incorrect</p>
            </div>
            <p className="text-3xl font-bold text-red-600">
              {exam.totalQuestions - exam.correctAnswers}
            </p>
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

        {/* Performance Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Breakdown</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Correct Answers</span>
                <span className="font-semibold text-green-600">
                  {((exam.correctAnswers / exam.totalQuestions) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(exam.correctAnswers / exam.totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Incorrect Answers</span>
                <span className="font-semibold text-red-600">
                  {(((exam.totalQuestions - exam.correctAnswers) / exam.totalQuestions) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-red-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${((exam.totalQuestions - exam.correctAnswers) / exam.totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Question Review</h2>
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