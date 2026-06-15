import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createIssueSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().min(5, "Description must be at least 5 characters long"),
  websiteId: z.string().min(1, "Website is required"),
  category: z.enum(["BUG", "FEEDBACK", "SUGGESTION", "IMPROVEMENT"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const isManager = session.user.role === "MANAGER";
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const whereClause: Prisma.IssueWhereInput = {};

    if (!isManager) {
      whereClause.createdBy = session.user.id;
    }

    if (status) whereClause.status = status;
    if (severity) whereClause.severity = severity;
    if (category) whereClause.category = category;
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const issues = await prisma.issue.findMany({
      where: whereClause,
      include: {
        website: { select: { name: true, url: true } },
        creator: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createIssueSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const { title, description, websiteId, category, severity } = result.data;

    const website = await prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      return NextResponse.json({ error: "Monitored website not found" }, { status: 404 });
    }

    if (session.user.role !== "MANAGER" && website.clientId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Website does not belong to you" }, { status: 403 });
    }

    const issue = await prisma.$transaction(async (tx) => {
      const newIssue = await tx.issue.create({
        data: {
          title,
          description,
          websiteId,
          category,
          severity,
          status: "OPEN",
          createdBy: session.user.id,
        },
      });

      await tx.timelineEvent.create({
        data: {
          issueId: newIssue.id,
          type: "ISSUE_CREATED",
          newValue: "OPEN",
          createdBy: session.user.id,
        },
      });

      return newIssue;
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error("Error creating issue:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
