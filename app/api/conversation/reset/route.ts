// app/api/conversation/reset/route.ts - Fix unused variable
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ConversationStatus } from "@prisma/client";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Use a transaction to ensure atomicity
    const newConversation = await prisma.$transaction(async (tx) => {
      // Archive all active conversations
      await tx.conversation.updateMany({
        where: {
          userId: session.user.id,
          status: ConversationStatus.ACTIVE
        },
        data: {
          status: ConversationStatus.ARCHIVED
        }
      });

      // Create new conversation
      const newConv = await tx.conversation.create({
        data: {
          userId: session.user.id,
          humeGroupId: crypto.randomUUID(),
          status: ConversationStatus.ACTIVE
        }
      });

      // Update the user's lastActiveConversationId
      await tx.user.update({
        where: { id: session.user.id },
        data: { lastActiveConversationId: newConv.id }
      });

      return newConv;
    });

    return NextResponse.json(newConversation);
  } catch (error) {
    console.error('[CONVERSATION_RESET_ERROR]', error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to reset conversation" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}