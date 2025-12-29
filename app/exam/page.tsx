"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, CheckCircle, Clock } from "lucide-react";
import LiveProctoring from "@/components/LiveProctoring";

interface Question {
  question: string;
  options: string[];
  answer: string;
}

function ExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  
  const examId = searchParams.get("examId");
  const certificateId = searchParams.get("certificateId");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [certificateName, setCertificateName] = useState("");
  const [violations, setViolations] = useState<string[]>([]);

  useEffect(() => {
    if (certificateId) {
      fetchQuestions();
    }
  }, [certificateId]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/certificates/${certificateId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setQuestions(data.data.questions || []);
        setCertificateName(data.data.courseName);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers({ ...answers, [currentQuestionIndex]: answer });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleViolation = (violation: string) => {
    setViolations([...violations, violation]);
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!confirm("You haven't answered all questions. Are you sure you want to submit?")) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const questionsAnswered = questions.map((q, index) => {
        const userAnswerLetter = answers[index] || "";
        const isCorrect = userAnswerLetter === q.answer;

        return {
          questionId: `q_${index}`,
          questionText: q.question,
          userAnswer: userAnswerLetter ? `${userAnswerLetter}) ${q.options.find(opt => opt.startsWith(userAnswerLetter))}` : "No answer",
          correctAnswer: `${q.answer}) ${q.options.find(opt => opt.startsWith(q.answer))}`,
          isCorrect: isCorrect,
          timeSpent: 0,
        };
      });

      const response = await fetch("/api/exams/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          questionsAnswered,
          timeSpent,
          proctorFlags: violations,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/exam/results?examId=${examId}`);
      } else {
        alert(`Failed to submit exam: ${data.message}`);
      }
    } catch (error) {
      console.error("Error submitting exam:", error);
      alert("Failed to submit exam. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No questions available for this certificate.</p>
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

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((Object.keys(answers).length / questions.length) * 100).toFixed(0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Exam Questions */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{certificateName}</h1>
                  <p className="text-sm text-gray-600 mt-1">Proctored Skill Assessment</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-2 text-right">{progress}% Complete</p>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {currentQuestion.question}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const optionLetter = option.charAt(0);
                  const isSelected = answers[currentQuestionIndex] === optionLetter;

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(optionLetter)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <span className={`flex-1 ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {option}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  currentQuestionIndex === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </button>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                  <CheckCircle className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Question Navigator */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Question Navigator</h3>
              <div className="grid grid-cols-10 gap-2">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 text-white'
                        : answers[index]
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Live Proctoring */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <LiveProctoring 
                examId={examId || ''} 
                onViolation={handleViolation}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ExamPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading exam...</p>
          </div>
        </div>
      }
    >
      <ExamContent />
    </Suspense>
  );
}
