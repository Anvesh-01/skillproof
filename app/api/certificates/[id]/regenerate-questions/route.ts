import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Certificate from "@/models/Certificate";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IQuestion } from "@/types/certificate";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
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

    // Generate new questions
    let questions: IQuestion[] = [];
    try {
      questions = await generateQuestions(certificate.courseName);
      if (!questions || questions.length === 0) {
        questions = getFallbackQuestions(certificate.courseName);
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      questions = getFallbackQuestions(certificate.courseName);
    }

    // Update certificate with new questions
    certificate.questions = questions;
    await certificate.save();

    return NextResponse.json({
      success: true,
      message: "Questions regenerated successfully",
      questionsCount: questions.length,
    });
  } catch (error) {
    console.error("Error regenerating questions:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to regenerate questions" 
      },
      { status: 500 }
    );
  }
}

async function generateQuestions(courseName: string): Promise<IQuestion[]> {
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
    return getFallbackQuestions(courseName);
  }
}

function getFallbackQuestions(courseName: string): IQuestion[] {
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
