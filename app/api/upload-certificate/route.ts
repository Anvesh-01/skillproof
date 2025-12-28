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
        { success: false, message: "No file uploaded", error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, message: "User ID is required", error: "User ID is required" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, message: "Only PDF files are allowed", error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "File size exceeds 10MB limit", error: "File size exceeds 10MB limit" },
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
        { success: false, message: "Failed to parse PDF file", error: "Failed to parse PDF file" },
        { status: 400 }
      );
    }

    const text: string = pdfData.text;
    const courseName: string = extractCourseName(text, file.name);

    // Generate questions
    let questions: IQuestion[] = [];
    try {
      questions = await generateQuestions(courseName);
      if (!questions || questions.length === 0) {
        console.warn("No questions generated, using fallback questions");
        questions = getFallbackQuestions(courseName);
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      questions = getFallbackQuestions(courseName);
    }

    // Ensure we have at least some questions
    if (questions.length === 0) {
      await fs.unlink(uploadPath);
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to generate exam questions. Please try again or contact support.",
          error: "Question generation failed" 
        },
        { status: 500 }
      );
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
        message: "Failed to process certificate",
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
  try {
    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY is not set in environment variables");
      throw new Error("Gemini API key not configured");
    }

    console.log("🔑 Gemini API Key exists:", !!process.env.GEMINI_API_KEY);
    console.log("📝 Generating questions for:", courseName);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

    console.log("🚀 Sending request to Gemini...");
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    console.log("📥 Raw Gemini Response:");
    console.log("─────────────────────────────────────────");
    console.log(responseText.substring(0, 500)); // First 500 chars
    console.log("─────────────────────────────────────────");

    // Try multiple cleaning strategies
    let cleanedText = responseText.trim();

    // Strategy 1: Remove markdown code blocks
    cleanedText = cleanedText.replace(/```json\s*/gi, '');
    cleanedText = cleanedText.replace(/```\s*/g, '');

    // Strategy 2: Remove any text before the first [
    const startIndex = cleanedText.indexOf('[');
    const endIndex = cleanedText.lastIndexOf(']');
    
    if (startIndex === -1 || endIndex === -1) {
      console.error("❌ No JSON array found in response");
      throw new Error("Invalid response format - no JSON array");
    }

    cleanedText = cleanedText.substring(startIndex, endIndex + 1);

    console.log("🧹 Cleaned text:");
    console.log(cleanedText.substring(0, 300));

    // Parse JSON
    let questions: IQuestion[];
    try {
      questions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("❌ JSON Parse Error:", parseError);
      console.error("Failed text:", cleanedText.substring(0, 500));
      throw new Error("Failed to parse JSON response");
    }

    console.log("✅ Parsed questions count:", questions.length);

    // Validate questions
    if (!Array.isArray(questions)) {
      console.error("❌ Response is not an array");
      throw new Error("Response is not an array");
    }

    if (questions.length === 0) {
      console.error("❌ No questions in array");
      throw new Error("Empty questions array");
    }

    // Validate each question
    const validQuestions = questions.filter((q, index) => {
      const isValid = (
        q.question &&
        typeof q.question === 'string' &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.answer &&
        ['A', 'B', 'C', 'D'].includes(q.answer)
      );

      if (!isValid) {
        console.warn(`⚠️ Invalid question at index ${index}:`, q);
      }

      return isValid;
    });

    console.log("✅ Valid questions count:", validQuestions.length);

    if (validQuestions.length < 5) {
      console.error("❌ Too few valid questions:", validQuestions.length);
      throw new Error(`Only ${validQuestions.length} valid questions generated`);
    }

    console.log("🎉 Successfully generated", validQuestions.length, "questions");
    return validQuestions;

  } catch (error) {
    console.error("❌ Error in generateQuestions:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // Re-throw to use fallback
    throw error;
  }
}

function getFallbackQuestions(courseName: string): IQuestion[] {
  console.log("⚠️ Using fallback questions for:", courseName);
  
  return [
    {
      question: `What is the primary objective of ${courseName}?`,
      options: [
        "A) Understanding fundamental concepts and principles",
        "B) Memorizing facts and figures",
        "C) Only theoretical knowledge",
        "D) None of the above",
      ],
      answer: "A",
    },
    {
      question: `Which of the following best describes the practical application of ${courseName}?`,
      options: [
        "A) Limited to academic settings",
        "B) Real-world problem solving and implementation",
        "C) Only research purposes",
        "D) Not applicable in practice",
      ],
      answer: "B",
    },
    {
      question: `What skill level is typically required to master ${courseName}?`,
      options: [
        "A) Beginner with basic understanding",
        "B) Intermediate with practical experience",
        "C) Advanced with deep expertise",
        "D) It depends on the specific area of focus",
      ],
      answer: "D",
    },
    {
      question: `Which approach is most effective when learning ${courseName}?`,
      options: [
        "A) Theory only",
        "B) Practice only",
        "C) Combination of theory and hands-on practice",
        "D) Passive observation",
      ],
      answer: "C",
    },
    {
      question: `What is a key benefit of certification in ${courseName}?`,
      options: [
        "A) Validation of skills and knowledge",
        "B) Guaranteed job placement",
        "C) No practical value",
        "D) Only for resume enhancement",
      ],
      answer: "A",
    },
    {
      question: `In ${courseName}, continuous learning is important because:`,
      options: [
        "A) The field evolves with new techniques and tools",
        "B) It's required by law",
        "C) There's nothing new to learn",
        "D) It's not important at all",
      ],
      answer: "A",
    },
    {
      question: `Which resource is most valuable for staying updated in ${courseName}?`,
      options: [
        "A) Outdated textbooks",
        "B) Current industry publications and online communities",
        "C) Social media gossip",
        "D) Random blog posts",
      ],
      answer: "B",
    },
    {
      question: `What distinguishes an expert in ${courseName} from a beginner?`,
      options: [
        "A) Years of experience only",
        "B) Depth of understanding and ability to solve complex problems",
        "C) Number of certificates",
        "D) Social media following",
      ],
      answer: "B",
    },
    {
      question: `Best practices in ${courseName} typically involve:`,
      options: [
        "A) Following outdated methods",
        "B) Ignoring industry standards",
        "C) Adhering to proven methodologies and continuous improvement",
        "D) Working in isolation",
      ],
      answer: "C",
    },
    {
      question: `The future of ${courseName} likely includes:`,
      options: [
        "A) No changes or evolution",
        "B) Integration with emerging technologies and methodologies",
        "C) Complete obsolescence",
        "D) Remaining exactly the same",
      ],
      answer: "B",
    },
  ];
}