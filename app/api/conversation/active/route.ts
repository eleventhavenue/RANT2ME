// app/api/conversation/active/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ConversationStatus } from "@prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { lastChatGroupId } = await req.json();

    // First, check if user has a lastActiveConversationId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        lastConversation: {
          include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } }
        }
      }
    });

    // If user has a last active conversation that's still active, return it
    if (user?.lastActiveConversationId && user.lastConversation?.status === ConversationStatus.ACTIVE) {
      return NextResponse.json(user.lastConversation);
    }

    // If a lastChatGroupId is provided, try to find a matching conversation
    let conversation = null;
    if (lastChatGroupId) {
      conversation = await prisma.conversation.findFirst({
        where: {
          userId: session.user.id,
          humeGroupId: lastChatGroupId,
          status: ConversationStatus.ACTIVE,
        },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
    }

    // If no conversation found yet, try to find any active conversation
    if (!conversation) {
      conversation = await prisma.conversation.findFirst({
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
    }

    // If still no conversation, create a new one
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: session.user.id,
          status: ConversationStatus.ACTIVE,
          humeGroupId: lastChatGroupId || undefined,
        },
        include: {
          messages: true
        }
      });
    }

    // Update the user's lastActiveConversationId
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastActiveConversationId: conversation.id }
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('[CONVERSATION_ACTIVE_ERROR]', error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch or create conversation" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}