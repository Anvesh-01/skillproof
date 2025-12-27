import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Certificate from "@/models/Certificate";
import ActivityLog from "@/models/ActivityLog";
import { promises as fs } from "fs";
import type { ICertificateResponse } from "@/types/certificate";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ICertificateResponse>> {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Certificate ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const certificate = await Certificate.findById(id);

    if (!certificate) {
      return NextResponse.json(
        { success: false, message: "Certificate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error("Error fetching certificate:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to fetch certificate" 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ICertificateResponse>> {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Certificate ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const certificate = await Certificate.findById(id);

    if (!certificate) {
      return NextResponse.json(
        { success: false, message: "Certificate not found" },
        { status: 404 }
      );
    }

    // Delete file
    try {
      await fs.unlink(certificate.filePath);
    } catch (fileError) {
      console.error("Error deleting file:", fileError);
    }

    // Delete from database
    await Certificate.findByIdAndDelete(id);

    // Log activity
    await ActivityLog.create({
      userId: certificate.clerkUserId,
      action: 'certificate_delete',
      description: `Deleted certificate: ${certificate.courseName}`,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Certificate deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to delete certificate" 
      },
      { status: 500 }
    );
  }
}
