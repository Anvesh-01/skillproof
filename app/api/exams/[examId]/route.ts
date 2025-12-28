import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Exam from "@/models/Exam";
import type { IExamResponse } from "@/types/exam";

interface RouteParams {
  params: {
    examId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<IExamResponse>> {
  try {
    const { examId } = params;

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
        { success: false, message: "Exam not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...exam.toObject(),
        _id: exam._id.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching exam:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to fetch exam" 
      },
      { status: 500 }
    );
  }
}
