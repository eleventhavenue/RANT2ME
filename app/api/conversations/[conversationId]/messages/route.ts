// app/api/conversations/[conversationId]/messages/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.conversationId,
        userId: session.user.id
      },
      select: { id: true }
    });

    if (!conversation) {
      return new NextResponse(
        JSON.stringify({ error: "Conversation not found" }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: params.conversationId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[MESSAGES_GET_ERROR]', error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch messages" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}