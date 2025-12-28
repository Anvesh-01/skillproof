import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Certificate from "@/models/Certificate";
import type { ICertificateResponse } from "@/types/certificate";

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ICertificateResponse>> {
  try {
    // FIXED: Await params in Next.js 15
    const { userId } = await params;

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

    const plainCertificates = certificates.map(cert => ({
      ...cert.toObject(),
      _id: cert._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: plainCertificates,
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
