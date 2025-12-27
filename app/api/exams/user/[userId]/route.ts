import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Exam from "@/models/Exam";
import type { IExamResponse } from "@/types/exam";

interface RouteParams {
  params: {
    userId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<IExamResponse>> {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const exams = await Exam.find({ userId }).sort({ examDate: -1 });

    return NextResponse.json({
      success: true,
      data: exams,
    });
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to fetch exams" 
      },
      { status: 500 }
    );
  }
}