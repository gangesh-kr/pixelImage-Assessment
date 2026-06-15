import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";

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

    const website = await prisma.website.findUnique({
      where: { id },
      include: {
        issues: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    if (!isManager && website.clientId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(website);
  } catch (error) {
    console.error("Error fetching website details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
