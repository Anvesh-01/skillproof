import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import ProctoringEvent from "@/models/ProctoringEvent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { examId, userId, eventType, severity, metadata } = body;

    if (!examId || !userId || !eventType) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await ProctoringEvent.create({
      examId,
      userId,
      eventType,
      severity: severity || 'medium',
      timestamp: new Date(),
      metadata,
    });

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error logging proctoring event:", error);
    return NextResponse.json(
      { success: false, message: "Failed to log event" },
      { status: 500 }
    );
  }
}
