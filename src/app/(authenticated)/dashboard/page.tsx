import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

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
    status: site.status as "ONLINE" | "DOWN" | "DEGRADED" | "UNKNOWN",
    lastChecked: site.lastChecked.toISOString(),
    clientId: site.clientId,
    openIssuesCount: site.issues.length,
  }));

  return <DashboardClient initialWebsites={formattedWebsites} />;
}
