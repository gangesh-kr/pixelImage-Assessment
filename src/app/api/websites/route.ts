import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const isManager = session.user.role === "MANAGER";
    
    const websites = await prisma.website.findMany({
      where: isManager ? {} : { clientId: session.user.id },
      include: {
        issues: {
          where: {
            status: {
              notIn: ["RESOLVED", "CLOSED"],
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    const formattedWebsites = websites.map((site) => ({
      id: site.id,
      name: site.name,
      url: site.url,
      status: site.status,
      lastChecked: site.lastChecked,
      clientId: site.clientId,
      openIssuesCount: site.issues.length,
    }));

    return NextResponse.json(formattedWebsites);
  } catch (error) {
    console.error("Error fetching websites:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
