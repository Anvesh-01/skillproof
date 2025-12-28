import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Exam from "@/models/Exam";
import Certificate from "@/models/Certificate";
import ActivityLog from "@/models/ActivityLog";
import type { IExamResponse } from "@/types/exam";

export async function POST(req: NextRequest): Promise<NextResponse<IExamResponse>> {
  try {
    const body = await req.json();
    const { examId, questionsAnswered, timeSpent } = body;

    if (!examId || !questionsAnswered) {
      return NextResponse.json(
        { success: false, message: "Exam ID and answers are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return NextResponse.json(
        { success: false, message: "Exam not found" },
        { status: 404 }
      );
    }

    // FIXED: Ensure all answers have userAnswer field (even if empty)
    const processedAnswers = questionsAnswered.map((q: any) => ({
      questionId: q.questionId || '',
      questionText: q.questionText || '',
      userAnswer: q.userAnswer || 'No answer',  // Default value if empty
      correctAnswer: q.correctAnswer || '',
      isCorrect: q.isCorrect || false,
      timeSpent: q.timeSpent || 0,
    }));

    // Calculate score
    const correctAnswers = processedAnswers.filter((q: any) => q.isCorrect).length;
    const totalQuestions = processedAnswers.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const result = score >= 70 ? 'pass' : 'fail';

    // Update exam
    exam.status = 'completed';
    exam.questionsAnswered = processedAnswers;
    exam.totalQuestions = totalQuestions;
    exam.correctAnswers = correctAnswers;
    exam.score = score;
    exam.timeSpent = timeSpent || 0;
    exam.result = result;
    exam.completedAt = new Date();

    await exam.save();

    // Update certificate status if passed
    if (result === 'pass') {
      await Certificate.findByIdAndUpdate(exam.certificateId, {
        status: 'verified',
        verificationDate: new Date(),
      });
    }

    // Log activity
    await ActivityLog.create({
      userId: exam.userId,
      examId: exam._id.toString(),
      action: 'exam_complete',
      description: `Completed exam with score: ${score}% (${result})`,
      timestamp: new Date(),
    });

    const plainExam = {
      ...exam.toObject(),
      _id: exam._id.toString(),
    };

    return NextResponse.json({
      success: true,
      data: plainExam,
    });
  } catch (error) {
    console.error("Error submitting exam:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to submit exam" 
      },
      { status: 500 }
    );
  }
}
