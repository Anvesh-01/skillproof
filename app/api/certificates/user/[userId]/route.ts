// ============================================
// API: Get User Certificates
// File: app/api/certificates/user/[userId]/route.ts
// ============================================

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Certificate from "@/models/Certificate";
import type { ICertificateResponse } from "@/types/certificate";

interface RouteParams {
  params: {
    userId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ICertificateResponse>> {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const certificates = await Certificate.find({
      clerkUserId: userId,
    }).sort({ uploadedAt: -1 });

    return NextResponse.json({
      success: true,
      data: certificates,
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to fetch certificates" 
      },
      { status: 500 }
    );
  }
}