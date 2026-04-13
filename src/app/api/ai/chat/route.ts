import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getBusinessContext } from "@/lib/ai/business-context";
import { buildSystemPrompt } from "@/lib/ai/prompt-builder";
import { orchestrate } from "@/lib/ai/orchestrator";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { isFeatureEnabled } from "@/lib/plans/gates";
import type { PlanType } from "@/lib/plans/limits";

export async function POST(request: NextRequest) {
  try {
    const { businessId } = await requireBusinessOwner();

    const businessRow = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
      columns: { subscriptionPlan: true },
    });
    const plan = (businessRow?.subscriptionPlan as PlanType) ?? "FREE";
    if (!isFeatureEnabled(plan, "aiInsights")) {
      return Response.json(
        { error: "AI features require a PRO plan" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { messages } = body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Messages required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    const ctx = await getBusinessContext(businessId);
    const insights = orchestrate(ctx, ctx.profile.locale);
    const systemPrompt = buildSystemPrompt(ctx, insights);

    const openai = new OpenAI({ apiKey });

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-10),
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
