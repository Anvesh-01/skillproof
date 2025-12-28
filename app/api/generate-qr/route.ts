import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { examId, userId, certificateName, score, result } = body;

    if (!examId || !userId) {
      return NextResponse.json(
        { success: false, message: "Exam ID and User ID are required" },
        { status: 400 }
      );
    }

    // Create verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${examId}`;

    // Create verification data
    const verificationData = {
      examId,
      userId,
      certificateName,
      score,
      result,
      verifiedAt: new Date().toISOString(),
      verificationUrl,
    };

    // Generate QR code as data URL (base64 image)
    const qrCodeDataUrl = await QRCode.toDataURL(
      JSON.stringify(verificationData),
      {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 1,
        margin: 2,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }
    );

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataUrl,
      verificationUrl,
      data: verificationData,
    });

  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate QR code",
      },
      { status: 500 }
    );
  }
}