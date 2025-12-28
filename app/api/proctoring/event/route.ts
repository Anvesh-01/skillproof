import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import ProctoringEvent from "@/models/ProctoringEvent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { examId, userId, eventType, severity, timestamp } = body;

    await connectDB();

    const event = await ProctoringEvent.create({
      examId,
      userId,
      eventType,
      severity: severity || 'medium',
      metadata: { timestamp },
    });

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error logging proctoring event:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to log event",
      },
      { status: 500 }
    );
  }
}