import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import ActivityLog from "@/models/ActivityLog";
import type { ILogResponse } from "@/types/log";

interface RouteParams {
  params: {
    userId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ILogResponse>> {
  try {
    const { userId } = params;

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

    return NextResponse.json({
      success: true,
      data: logs,
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