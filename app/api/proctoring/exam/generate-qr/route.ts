import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Exam from "@/models/Exam";
import ProctoringEvent from "@/models/ProctoringEvent";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { examId } = body;

    console.log("🔍 Generating QR for examId:", examId);

    if (!examId) {
      return NextResponse.json(
        { success: false, message: "Exam ID required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch exam details
    const exam = await Exam.findById(examId);
    if (!exam) {
      console.error("❌ Exam not found:", examId);
      return NextResponse.json(
        { success: false, message: "Exam not found" },
        { status: 404 }
      );
    }

    console.log("✅ Exam found:", exam.certificateName);

    // Fetch proctoring events
    const proctoringEvents = await ProctoringEvent.find({ examId }).sort({ timestamp: 1 });
    console.log("📊 Proctoring events found:", proctoringEvents.length);

    // Calculate cheating penalty
    let cheatingPenalty = 0;
    const highViolations = proctoringEvents.filter(e => e.severity === 'high').length;
    const mediumViolations = proctoringEvents.filter(e => e.severity === 'medium').length;
    const lowViolations = proctoringEvents.filter(e => e.severity === 'low').length;

    cheatingPenalty = (highViolations * 5) + (mediumViolations * 2) + (lowViolations * 0.5);

    // Adjust final score
    const adjustedScore = Math.max(0, (exam.score || 0) - cheatingPenalty);
    const finalGrade = adjustedScore >= 70 ? 'PASS' : 'FAIL';

    // Create verification URL (simpler QR code data)
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${exam._id}`;

    console.log("🔗 Verification URL:", verificationUrl);

    // Generate QR Code with just the URL (much smaller)
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    console.log("✅ QR Code generated successfully");

    // Update exam with final data
    exam.finalGrade = finalGrade;
    exam.cheatingPenalty = cheatingPenalty;
    await exam.save();

    // Return full exam data separately
    const examData = {
      examId: exam._id.toString(),
      certificateName: exam.certificateName,
      userName: exam.userId,
      examDate: exam.examDate,
      duration: `${Math.floor((exam.timeSpent || 0) / 60)}m ${(exam.timeSpent || 0) % 60}s`,
      totalQuestions: exam.totalQuestions,
      correctAnswers: exam.correctAnswers,
      originalScore: exam.score,
      cheatingPenalty: cheatingPenalty.toFixed(1),
      adjustedScore: adjustedScore.toFixed(1),
      finalGrade,
      verificationUrl,
    };

    return NextResponse.json({
      success: true,
      data: {
        qrCode: qrCodeDataUrl,
        examData,
      },
    });
  } catch (error) {
    console.error("❌ Error generating QR code:", error);
    console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to generate QR code",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}