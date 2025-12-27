import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Exam from "@/models/Exam";
import Certificate from "@/models/Certificate";
import ActivityLog from "@/models/ActivityLog";
import type { IExamResponse } from "@/types/exam";

export async function POST(req: NextRequest): Promise<NextResponse<IExamResponse>> {
  try {
    const body = await req.json();
    const { userId, certificateId } = body;

    if (!userId || !certificateId) {
      return NextResponse.json(
        { success: false, message: "User ID and Certificate ID are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const certificate = await Certificate.findById(certificateId);
    
    if (!certificate) {
      return NextResponse.json(
        { success: false, message: "Certificate not found" },
        { status: 404 }
      );
    }

    const exam = await Exam.create({
      userId,
      certificateId,
      certificateName: certificate.courseName,
      status: 'in-progress',
      examDate: new Date(),
      questionsAnswered: [],
    });

    // Log activity
    await ActivityLog.create({
      userId,
      examId: exam._id.toString(),
      action: 'exam_start',
      description: `Started exam for: ${certificate.courseName}`,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: exam,
    });
  } catch (error) {
    console.error("Error starting exam:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to start exam" 
      },
      { status: 500 }
    );
  }
}