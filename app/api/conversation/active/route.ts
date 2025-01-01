// app/api/conversation/active/route.ts

import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ConversationStatus } from "@prisma/client";
import { randomUUID } from "crypto"; // If using Node <19, import from "crypto"

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      body = {}; // default if JSON parsing fails
    }

    const { lastChatGroupId } = body || {};

    // 1. Try to find an active conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId: session.user.id,
        status: ConversationStatus.ACTIVE, // Enum usage
      },
    });

    // 2. If no active conversation, see if we can revive an archived one
    if (!conversation) {
      if (lastChatGroupId) {
        conversation = await prisma.conversation.findFirst({
          where: {
            userId: session.user.id,
            humeGroupId: lastChatGroupId,
            status: ConversationStatus.ARCHIVED,
          },
        });

        // If found, reactivate it
        if (conversation) {
          conversation = await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              status: ConversationStatus.ACTIVE,
              lastMessageAt: new Date(),
            },
          });
        }
      }

      // 3. If still no conversation, create new
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            userId: session.user.id,
            humeGroupId: lastChatGroupId || randomUUID(),
            status: ConversationStatus.ACTIVE,
          },
        });
      }
    }
    // 4. If we DID find an active conversation but it had no group ID
    else if (lastChatGroupId && !conversation.humeGroupId) {
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { humeGroupId: lastChatGroupId },
      });
    }

    // If we still have no conversation, bail
    if (!conversation) {
      return new NextResponse("Failed to create/find conversation", {
        status: 500,
      });
    }

    // 5. Final step: fetch that conversation again WITH messages included.
    // This ensures the returned object has the messages property,
    // satisfying your TypeScript type that requires messages[].
    const conversationWithMessages = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // conversationWithMessages may still be null (very unlikely),
    // but let's handle it just in case:
    if (!conversationWithMessages) {
      return new NextResponse("Could not fetch conversation messages", {
        status: 500,
      });
    }

    return NextResponse.json(conversationWithMessages);
  } catch (error) {
    if (error instanceof Error) {
      console.error("[CONVERSATION_ACTIVE_ERROR]", {
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error("[CONVERSATION_ACTIVE_ERROR]", "Unknown error occurred");
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}