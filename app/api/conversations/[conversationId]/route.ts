// app/api/conversations/[conversationId]/route.ts - Fix any type and unused variable
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ConversationStatus } from "@prisma/client";

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
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.conversationId,
        userId: session.user.id
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!conversation) {
      return new NextResponse(
        JSON.stringify({ error: "Conversation not found" }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('[CONVERSATION_GET_ERROR]', error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch conversation" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PATCH(
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
    const body = await req.json();
    const { humeGroupId, title, status } = body;

    // Validate the data
    const updateData: Record<string, unknown> = {};
    if (humeGroupId) updateData.humeGroupId = humeGroupId;
    if (title) updateData.title = title;
    if (status) {
      const validStatuses = ['ACTIVE', 'ARCHIVED', 'DELETED'];
      if (!validStatuses.includes(status)) {
        return new NextResponse(
          JSON.stringify({ error: "Invalid status value" }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      updateData.status = status;
    }

    // Always update lastMessageAt to keep it fresh
    updateData.lastMessageAt = new Date();

    const conversation = await prisma.conversation.update({
      where: {
        id: params.conversationId,
        userId: session.user.id
      },
      data: updateData
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('[CONVERSATION_UPDATE_ERROR]', error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update conversation" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(
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
    // Check if this is the user's last active conversation
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastActiveConversationId: true }
    });

    // First update the conversation status to DELETED instead of actually deleting
    await prisma.conversation.update({
      where: {
        id: params.conversationId,
        userId: session.user.id
      },
      data: {
        status: ConversationStatus.DELETED
      }
    });

    // If this was the lastActiveConversation, clear that reference
    if (user?.lastActiveConversationId === params.conversationId) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { lastActiveConversationId: null }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CONVERSATION_DELETE_ERROR]', error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to delete conversation" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
