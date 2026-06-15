import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createCommentSchema = z.object({
  message: z.string().min(1, "Comment message cannot be empty"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: issueId } = await params;
    const body = await request.json();
    const result = createCommentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const { message } = result.data;
    const isManager = session.user.role === "MANAGER";

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    if (!isManager && issue.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          issueId,
          userId: session.user.id,
          message,
        },
      });

      await tx.timelineEvent.create({
        data: {
          issueId,
          type: "COMMENT_ADDED",
          newValue: isManager ? "Manager Comment Added" : "Client Comment Added",
          createdBy: session.user.id,
        },
      });

      // Notify the other party when a comment is added
      if (isManager) {
        // Manager commented → notify the client who created the issue
        await tx.notification.create({
          data: {
            userId: issue.createdBy,
            message: `A manager responded to your issue "${issue.title}".`,
          },
        });
      }

      return newComment;
    });

    const finalComment = await prisma.comment.findUnique({
      where: { id: comment.id },
      include: {
        user: { select: { name: true, role: true, email: true } },
      },
    });

    return NextResponse.json(finalComment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
