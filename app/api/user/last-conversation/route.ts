// app/api/user/last-conversation/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { conversationId } = await req.json();
    if (!conversationId) {
      return new NextResponse(
        JSON.stringify({ error: "Conversation ID is required" }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the conversation exists and belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id
      }
    });

    if (!conversation) {
      return new NextResponse(
        JSON.stringify({ error: "Conversation not found" }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update the user's lastActiveConversationId
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastActiveConversationId: conversationId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LAST_CONVERSATION_UPDATE_ERROR]', error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update last active conversation" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}