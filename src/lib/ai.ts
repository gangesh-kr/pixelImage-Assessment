import OpenAI from "openai";

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "mock-key") {
    return null;
  }
  return new OpenAI({ apiKey });
};

export interface AIClassification {
  category: "BUG" | "FEEDBACK" | "SUGGESTION" | "IMPROVEMENT";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export async function classifyIssue(description: string): Promise<AIClassification> {
  const openai = getOpenAIClient();

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an IT support assistant. Analyze the user's issue description and classify it.
You MUST respond with a raw JSON object containing exactly two keys:
1. "category": must be one of "BUG", "FEEDBACK", "SUGGESTION", "IMPROVEMENT"
2. "severity": must be one of "LOW", "MEDIUM", "HIGH", "CRITICAL"

Keep it short. Output ONLY the JSON. Do not include markdown code block formatting (like \`\`\`json).`
          },
          {
            role: "user",
            content: `Description: "${description}"`
          }
        ],
        temperature: 0.1,
      });

      const text = response.choices[0]?.message?.content?.trim() || "";
      const cleanText = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      const result = JSON.parse(cleanText) as AIClassification;
      
      const validCategories = ["BUG", "FEEDBACK", "SUGGESTION", "IMPROVEMENT"];
      const validSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
      
      if (validCategories.includes(result.category) && validSeverities.includes(result.severity)) {
        return result;
      }
    } catch (error) {
      console.warn("OpenAI classification failed, falling back to heuristics:", error);
    }
  }

  const desc = description.toLowerCase();
  let category: AIClassification["category"] = "BUG";
  let severity: AIClassification["severity"] = "MEDIUM";

  if (desc.includes("suggest") || desc.includes("feature") || desc.includes("would be nice") || desc.includes("add support")) {
    category = "SUGGESTION";
  } else if (desc.includes("feedback") || desc.includes("opinion") || desc.includes("love") || desc.includes("dislike")) {
    category = "FEEDBACK";
  } else if (desc.includes("slow") || desc.includes("performance") || desc.includes("lag") || desc.includes("optimize") || desc.includes("speed")) {
    category = "IMPROVEMENT";
  } else if (desc.includes("crash") || desc.includes("fail") || desc.includes("bug") || desc.includes("error") || desc.includes("broken") || desc.includes("not working") || desc.includes("500")) {
    category = "BUG";
  }

  if (desc.includes("crash") || desc.includes("down") || desc.includes("offline") || desc.includes("completely broken") || desc.includes("failing for all") || desc.includes("payment fail")) {
    severity = "CRITICAL";
  } else if (desc.includes("error") || desc.includes("bug") || desc.includes("cannot access") || desc.includes("failed")) {
    if (desc.includes("urgent") || desc.includes("blocker") || desc.includes("asap")) {
      severity = "HIGH";
    } else {
      severity = "MEDIUM";
    }
  } else if (desc.includes("minor") || desc.includes("typo") || desc.includes("spacing") || desc.includes("color") || desc.includes("font")) {
    severity = "LOW";
  }

  return { category, severity };
}

export async function generateResponseDraft(issue: {
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  websiteName: string;
}): Promise<string> {
  const openai = getOpenAIClient();

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional Customer Support Manager for a website monitoring SaaS.
Draft a professional, empathetic, and polite response email/comment to a client who reported an issue.
Write only the comment message body itself. Do not include subject lines, greetings like "Dear Client", signatures, or placeholders.
Tailor the tone and content to the issue's severity (${issue.severity}), category (${issue.category}), and current status (${issue.status}) on website "${issue.websiteName}".`
          },
          {
            role: "user",
            content: `Issue Title: "${issue.title}"\nDescription: "${issue.description}"`
          }
        ],
        temperature: 0.7,
      });

      const text = response.choices[0]?.message?.content?.trim();
      if (text) return text;
    } catch (error) {
      console.warn("OpenAI draft generation failed, falling back to heuristics:", error);
    }
  }

  const { title, status, websiteName } = issue;
  
  switch (status) {
    case "OPEN":
    case "IN_REVIEW":
      return `Hi, thank you for reporting the issue regarding "${title}" on ${websiteName}. We have received your ticket and our team is currently reviewing the logs to identify the root cause. We will keep you updated as we progress.`;
    
    case "IN_PROGRESS":
      return `Hello, our engineering team is actively working on resolving the issue "${title}" on ${websiteName}. We have identified the problem area and are implementing a fix. Thank you for your patience; we will post another update as soon as the patch is ready.`;
    
    case "WAITING_FOR_CLIENT":
      return `Hi, thank you for your patience. Our team is investigating "${title}", but we require a little more context. Could you please provide steps to reproduce, or share screenshot/console log errors if possible? This will help us pin down the issue faster.`;
    
    case "RESOLVED":
      return `Hello! We are pleased to inform you that the issue "${title}" on ${websiteName} has been successfully resolved. Our tests indicate everything is running smoothly now. Please verify on your end and let us know if you have any further questions.`;
    
    case "CLOSED":
      return `Hi, this ticket has been marked as closed. If you run into any other troubles or need further assistance with ${websiteName}, please feel free to open a new support request.`;
    
    default:
      return `Hi, thank you for reaching out. We are reviewing your ticket "${title}" for ${websiteName} and will get back to you with updates shortly.`;
  }
}
