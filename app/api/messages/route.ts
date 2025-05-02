// app/api/messages/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { MessageRole } from "@prisma/client";

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
    const { conversationId, content, role, emotions } = body;

    if (!conversationId || !content || !role) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate the role
    const validRoles = ['USER', 'ASSISTANT'];
    if (!validRoles.includes(role)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid role value" }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      }
    });

    if (!conversation) {
      return new NextResponse(
        JSON.stringify({ error: "Conversation not found" }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create the message in a transaction along with updating the conversation
    const [message] = await prisma.$transaction([
      // Create message
      prisma.message.create({
        data: {
          conversationId,
          content,
          role: role as MessageRole,
          emotions: emotions ? emotions : undefined,
        }
      }),
      
      // Update conversation's lastMessageAt
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      })
    ]);

    // Update analytics in the background
    prisma.userAnalytics.upsert({
      where: { userId: session.user.id },
      update: {
        totalMessages: { increment: 1 },
        lastActive: new Date(),
      },
      create: {
        userId: session.user.id,
        totalMessages: 1,
        totalConversations: 1,
        lastActive: new Date(),
      }
    }).catch(err => console.error('Analytics update error:', err));

    return NextResponse.json(message);
  } catch (error) {
    console.error('[MESSAGE_CREATE_ERROR]', error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create message" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}