import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");


  await prisma.notification.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.website.deleteMany();
  await prisma.user.deleteMany();


  const hashedPassword = await bcrypt.hash("password123", 10);


  const clientUser = await prisma.user.create({
    data: {
      name: "John Client",
      email: "client@test.com",
      password: hashedPassword,
      role: "CLIENT",
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      name: "Sarah Manager",
      email: "manager@test.com",
      password: hashedPassword,
      role: "MANAGER",
    },
  });

  console.log("Users created:", {
    client: clientUser.email,
    manager: managerUser.email,
  });


  const shopSite = await prisma.website.create({
    data: {
      name: "E-Commerce App",
      url: "https://github.com/gangesh-kr",
      status: "ONLINE",
      clientId: clientUser.id,
    },
  });

  const hubSite = await prisma.website.create({
    data: {
      name: "Corporate Hub",
      url: "https://www.barg-ai.com",
      status: "DEGRADED",
      clientId: clientUser.id,
    },
  });

  const apiSite = await prisma.website.create({
    data: {
      name: "API Gateway",
      url: "https://api.example.com",
      status: "DOWN",
      clientId: clientUser.id,
    },
  });

  const statsSite = await prisma.website.create({
    data: {
      name: "Analytics Stats",
      url: "https://analytics.example.com",
      status: "UNKNOWN",
      clientId: clientUser.id,
    },
  });

  console.log("Websites created:", [shopSite.name, hubSite.name, apiSite.name, statsSite.name]);


  const issue1 = await prisma.issue.create({
    data: {
      title: "Checkout process failing",
      description: "Getting a 500 server error on the checkout page when clicking complete payment.",
      category: "BUG",
      severity: "CRITICAL",
      status: "OPEN",
      websiteId: shopSite.id,
      createdBy: clientUser.id,
    },
  });


  await prisma.timelineEvent.create({
    data: {
      issueId: issue1.id,
      type: "ISSUE_CREATED",
      newValue: "OPEN",
      createdBy: clientUser.id,
    },
  });


  const issue2 = await prisma.issue.create({
    data: {
      title: "Dashboard page loading extremely slowly",
      description: "The admin dashboard takes upwards of 8-10 seconds to load lists and charts.",
      category: "BUG",
      severity: "HIGH",
      status: "IN_PROGRESS",
      websiteId: hubSite.id,
      createdBy: clientUser.id,
    },
  });


  await prisma.timelineEvent.create({
    data: {
      issueId: issue2.id,
      type: "ISSUE_CREATED",
      newValue: "OPEN",
      createdBy: clientUser.id,
    },
  });

  await prisma.timelineEvent.create({
    data: {
      issueId: issue2.id,
      type: "STATUS_CHANGED",
      oldValue: "OPEN",
      newValue: "IN_PROGRESS",
      createdBy: managerUser.id,
    },
  });


  await prisma.comment.create({
    data: {
      issueId: issue2.id,
      userId: managerUser.id,
      message: "We have reproduced the issue. It looks like an unindexed database query in the metrics module. We are actively optimizing it.",
    },
  });

  await prisma.timelineEvent.create({
    data: {
      issueId: issue2.id,
      type: "COMMENT_ADDED",
      newValue: "Manager Comment Added",
      createdBy: managerUser.id,
    },
  });

  console.log("Issues, Comments, and Timelines seeded.");
  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
