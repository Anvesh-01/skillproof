import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Exam from "@/models/Exam";

interface RouteParams {
  params: Promise<{
    examId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { examId } = await params;

    if (!examId) {
      return NextResponse.json(
        { success: false, message: "Exam ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const exam = await Exam.findById(examId);

    if (!exam) {
      return NextResponse.json(
        { success: false, message: "Certificate not found" },
        { status: 404 }
      );
    }

    // Only show verified/passed exams
    if (exam.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: "Certificate verification pending" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        examId: exam._id.toString(),
        certificateName: exam.certificateName,
        score: exam.score,
        result: exam.result,
        completedAt: exam.completedAt,
        userId: exam.userId,
      },
    });

  } catch (error) {
    console.error("Error verifying exam:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Verification failed",
      },
      { status: 500 }
    );
  }
}