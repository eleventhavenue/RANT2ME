// app/api/conversation/reset/route.ts
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Use a transaction to ensure atomicity
    const newConversation = await prisma.$transaction(async (tx) => {
      // Archive all active conversations
      await tx.conversation.updateMany({
        where: {
          userId: session.user.id,
          status: 'ACTIVE'
        },
        data: {
          status: 'ARCHIVED'
        }
      });

      // Create new conversation
      return await tx.conversation.create({
        data: {
          userId: session.user.id,
          humeGroupId: crypto.randomUUID(),
          status: 'ACTIVE'
        }
      });
    });

    return NextResponse.json(newConversation);
  } catch (error) {
    console.error('[CONVERSATION_RESET_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}