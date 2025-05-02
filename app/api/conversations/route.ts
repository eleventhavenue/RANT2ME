// app/api/conversations/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ConversationStatus } from "@prisma/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const statusParam = searchParams.get('status') || 'ACTIVE';
    
    // Validate the status parameter
    const validStatuses = ['ACTIVE', 'ARCHIVED', 'DELETED'];
    const status = validStatuses.includes(statusParam) 
      ? statusParam as ConversationStatus 
      : 'ACTIVE' as ConversationStatus;

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: session.user.id,
        status: status,
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { lastMessageAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.conversation.count({
      where: {
        userId: session.user.id,
        status: status,
      }
    });

    return NextResponse.json({
      conversations,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit
      }
    });
  } catch (error) {
    console.error('[CONVERSATIONS_GET_ERROR]', error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch conversations" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { humeGroupId } = body;

    const conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        humeGroupId: humeGroupId || crypto.randomUUID(),
        status: ConversationStatus.ACTIVE
      }
    });

    // Update the user's lastActiveConversationId
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastActiveConversationId: conversation.id }
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('[CONVERSATION_CREATE_ERROR]', error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create conversation" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}