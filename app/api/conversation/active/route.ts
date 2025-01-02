// app/api/conversation/active/route.ts
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ConversationStatus } from "@prisma/client";

// app/api/conversation/active/route.ts
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Try to find an active conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId: session.user.id,
        status: ConversationStatus.ACTIVE,
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // If no active conversation, create one
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: session.user.id,
          status: ConversationStatus.ACTIVE,
        },
        include: {
          messages: true
        }
      });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('[CONVERSATION_ACTIVE_ERROR]', error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch or create conversation" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}