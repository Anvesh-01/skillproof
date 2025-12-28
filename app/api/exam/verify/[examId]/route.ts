import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Exam from "@/models/Exam";
import ProctoringEvent from "@/models/ProctoringEvent";

interface RouteParams {
  params: {
    examId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { examId } = params;

    await connectDB();

    const exam = await Exam.findById(examId);
    if (!exam) {
      return NextResponse.json(
        { success: false, message: "Exam not found" },
        { status: 404 }
      );
    }

    const proctoringEvents = await ProctoringEvent.find({ examId }).sort({ createdAt: 1 });

    const verificationData = {
      examId: exam._id.toString(),
      certificateName: exam.certificateName,
      userName: exam.userId,
      examDate: exam.examDate,
      duration: `${Math.floor((exam.timeSpent || 0) / 60)}m ${(exam.timeSpent || 0) % 60}s`,
      totalQuestions: exam.totalQuestions,
      correctAnswers: exam.correctAnswers,
      originalScore: exam.score,
      cheatingLogs: {
        total: proctoringEvents.length,
        high: proctoringEvents.filter(e => e.severity === 'high').length,
        medium: proctoringEvents.filter(e => e.severity === 'medium').length,
        low: proctoringEvents.filter(e => e.severity === 'low').length,
        violations: proctoringEvents.map(e => ({
          type: e.eventType,
          severity: e.severity,
          time: e.createdAt,
        })),
      },
      cheatingPenalty: (exam.cheatingPenalty || 0).toFixed(1),
      adjustedScore: (Math.max(0, (exam.score || 0) - (exam.cheatingPenalty || 0))).toFixed(1),
      finalGrade: exam.finalGrade || 'PENDING',
      questions: exam.questionsAnswered.map((q, i) => ({
        q: i + 1,
        question: q.questionText,
        userAnswer: q.userAnswer,
        correctAnswer: q.correctAnswer,
        correct: q.isCorrect,
      })),
    };

    return NextResponse.json({
      success: true,
      data: verificationData,
    });
  } catch (error) {
    console.error("Error verifying exam:", error);
    return NextResponse.json(
      { success: false, message: "Verification failed" },
      { status: 500 }
    );
  }
}