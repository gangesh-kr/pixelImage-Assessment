import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateIssueSchema = z.object({
  status: z.enum(["OPEN", "IN_REVIEW", "IN_PROGRESS", "WAITING_FOR_CLIENT", "RESOLVED", "CLOSED"]).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const isManager = session.user.role === "MANAGER";

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        website: { select: { name: true, url: true } },
        creator: { select: { name: true, email: true } },
        comments: {
          include: {
            user: { select: { name: true, role: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        events: {
          include: {
            creator: { select: { name: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    if (!isManager && issue.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error fetching issue details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const isManager = session.user.role === "MANAGER";
    const body = await request.json();
    
    const result = updateIssueSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const { status, severity } = result.data;

    const issue = await prisma.issue.findUnique({
      where: { id },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    if (!isManager) {
      if (issue.createdBy !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (severity) {
        return NextResponse.json({ error: "Only managers can update severity" }, { status: 403 });
      }
      if (status && status !== "CLOSED") {
        return NextResponse.json({ error: "Clients can only close their own issues" }, { status: 403 });
      }
    }

    const updatedIssue = await prisma.$transaction(async (tx) => {
      const updates: any = {};
      const timelineEventsToCreate: any[] = [];

      if (status && status !== issue.status) {
        updates.status = status;
        
        const eventType = status === "RESOLVED" ? "ISSUE_RESOLVED" : "STATUS_CHANGED";
        timelineEventsToCreate.push({
          type: eventType,
          oldValue: issue.status,
          newValue: status,
          createdBy: session.user.id,
        });

        if (status === "RESOLVED") {
          await tx.notification.create({
            data: {
              userId: issue.createdBy,
              message: `Your issue "${issue.title}" has been resolved.`,
            },
          });
        }
      }

      if (severity && severity !== issue.severity) {
        updates.severity = severity;
        timelineEventsToCreate.push({
          type: "SEVERITY_CHANGED",
          oldValue: issue.severity,
          newValue: severity,
          createdBy: session.user.id,
        });
      }

      if (Object.keys(updates).length === 0) {
        return issue;
      }

      const updated = await tx.issue.update({
        where: { id },
        data: updates,
      });

      for (const event of timelineEventsToCreate) {
        await tx.timelineEvent.create({
          data: {
            issueId: id,
            ...event,
          },
        });
      }

      return updated;
    });

    return NextResponse.json(updatedIssue);
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
