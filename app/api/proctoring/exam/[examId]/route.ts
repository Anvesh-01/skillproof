import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
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

    const events = await ProctoringEvent.find({ examId }).sort({ timestamp: 1 });

    // Calculate summary
    const summary = {
      total: events.length,
      byType: {} as Record<string, number>,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
      },
    };

    events.forEach((event) => {
      summary.byType[event.eventType] = (summary.byType[event.eventType] || 0) + 1;
      summary.bySeverity[event.severity]++;
    });

    return NextResponse.json({
      success: true,
      data: {
        events,
        summary,
      },
    });
  } catch (error) {
    console.error("Error fetching proctoring events:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch events" },
      { status: 500 }
    );
  }
}