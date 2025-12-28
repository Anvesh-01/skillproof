import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import ActivityLog from "@/models/ActivityLog";
import type { ILogResponse } from "@/types/log";

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ILogResponse>> {
  try {
    // FIXED: Await params
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const logs = await ActivityLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(100);

    const plainLogs = logs.map(log => ({
      ...log.toObject(),
      _id: log._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: plainLogs,
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to fetch logs" 
      },
      { status: 500 }
    );
  }
}
