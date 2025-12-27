import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import connectDB from "@/lib/mongoose";
import Certificate from "@/models/Certificate";
import ActivityLog from "@/models/ActivityLog";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IUploadResponse, IQuestion } from "@/types/certificate";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest): Promise<NextResponse<IUploadResponse>> {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const clerkUserId = formData.get("clerkUserId") as string;
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;

    // Validation
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), "uploads");
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}_${sanitizedFileName}`;
    const uploadPath = path.join(uploadsDir, fileName);
    
    await fs.writeFile(uploadPath, buffer);

    // Parse PDF
    let pdfData: pdfParse.Result;
    try {
      pdfData = await pdfParse(buffer);
    } catch (error) {
      await fs.unlink(uploadPath);
      return NextResponse.json(
        { success: false, error: "Failed to parse PDF file" },
        { status: 400 }
      );
    }

    const text: string = pdfData.text;
    const courseName: string = extractCourseName(text, file.name);

    // Generate questions
    let questions: IQuestion[] = [];
    try {
      questions = await generateQuestions(courseName);
    } catch (error) {
      console.error("Error generating questions:", error);
      questions = [];
    }

    // Save to database
    await connectDB();
    const newCert = await Certificate.create({
      clerkUserId,
      username,
      email,
      courseName,
      filePath: uploadPath,
      questions,
      uploadedAt: new Date(),
      status: 'pending',
    });

    // Log activity
    await ActivityLog.create({
      userId: clerkUserId,
      action: 'certificate_upload',
      description: `Uploaded certificate: ${courseName}`,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Certificate uploaded successfully!",
      courseName,
      questions: questions.length,
      certificateId: newCert._id.toString(),
    });
  } catch (error) {
    console.error("Error processing certificate:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process certificate",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function extractCourseName(text: string, fileName: string): string {
  const patterns: RegExp[] = [
    /Course\s*:\s*(.+)/i,
    /Certificate\s+in\s+(.+)/i,
    /Certificate\s+of\s+(.+)/i,
    /Certificate\s+of\s+Completion\s+in\s+(.+)/i,
    /has\s+completed\s+(.+)/i,
    /successfully\s+completed\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim().split('\n')[0].trim();
      if (extracted.length > 3 && extracted.length < 200) {
        return extracted;
      }
    }
  }

  return fileName.replace('.pdf', '').replace(/_/g, ' ').trim();
}

async function generateQuestions(courseName: string): Promise<IQuestion[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
You are an expert exam generator. Based on the course "${courseName}", 
generate 10 challenging multiple-choice questions to verify knowledge.

Requirements:
- Create practical, scenario-based questions
- Focus on real-world application
- Include 4 options (A, B, C, D) for each
- Test understanding, not memorization
- Mix difficulty levels

Provide ONLY a valid JSON array:
[
  {
    "question": "Question text?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "answer": "A"
  }
]

No markdown, no code blocks, only JSON.
`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  try {
    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const questions: IQuestion[] = JSON.parse(cleanedText);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid questions format");
    }

    const validQuestions = questions.filter((q) => {
      return (
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.answer &&
        ['A', 'B', 'C', 'D'].includes(q.answer)
      );
    });

    if (validQuestions.length === 0) {
      throw new Error("No valid questions generated");
    }

    return validQuestions;
  } catch (parseError) {
    console.error("Error parsing Gemini response:", parseError);
    return [
      {
        question: `What is the primary focus of ${courseName}?`,
        options: [
          "A) Fundamental concepts",
          "B) Advanced techniques",
          "C) Practical applications",
          "D) All of the above",
        ],
        answer: "D",
      },
    ];
  }
}

