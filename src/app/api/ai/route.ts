import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { classifyIssue, generateResponseDraft } from "@/lib/ai";
import { z } from "zod";

const aiSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("classify"),
    description: z.string().min(1, "Description is required"),
  }),
  z.object({
    action: z.literal("respond"),
    issueId: z.string().min(1, "Issue ID is required"),
  }),
]);

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = aiSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const payload = result.data;

    if (payload.action === "classify") {
      const classification = await classifyIssue(payload.description);
      return NextResponse.json(classification);
    } else {
      if (session.user.role !== "MANAGER") {
        return NextResponse.json({ error: "Forbidden: Only managers can generate responses" }, { status: 403 });
      }

      const issue = await prisma.issue.findUnique({
        where: { id: payload.issueId },
        include: {
          website: true,
        },
      });

      if (!issue) {
        return NextResponse.json({ error: "Issue not found" }, { status: 404 });
      }

      const draft = await generateResponseDraft({
        title: issue.title,
        description: issue.description,
        category: issue.category,
        severity: issue.severity,
        status: issue.status,
        websiteName: issue.website.name,
      });

      return NextResponse.json({ draft });
    }
  } catch (error) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
