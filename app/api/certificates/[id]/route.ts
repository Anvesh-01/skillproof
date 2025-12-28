import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Certificate from "@/models/Certificate";
import ActivityLog from "@/models/ActivityLog";
import { promises as fs } from "fs";
import type { ICertificateResponse } from "@/types/certificate";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ICertificateResponse>> {
  try {
    // FIXED: Await params
    const { id } = await params;

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

    const plainCertificate = {
      ...certificate.toObject(),
      _id: certificate._id.toString(),
    };

    return NextResponse.json({
      success: true,
      data: plainCertificate,
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
    // FIXED: Await params
    const { id } = await params;

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

    try {
      await fs.unlink(certificate.filePath);
    } catch (fileError) {
      console.error("Error deleting file:", fileError);
    }

    await Certificate.findByIdAndDelete(id);

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
