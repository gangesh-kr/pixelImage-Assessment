import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateNotificationSchema = z.object({
  id: z.string().optional(),
  isRead: z.boolean().default(true),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = updateNotificationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const { id, isRead } = result.data;

    if (id) {
      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification || notification.userId !== session.user.id) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead },
      });
      return NextResponse.json(updated);
    } else {
      const result = await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead },
      });
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
