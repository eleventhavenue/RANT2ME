// app/api/messages/route.ts
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { MessageRole } from "@prisma/client"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await req.json()
    const { conversationId, content, role, emotions } = body

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      }
    })

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 })
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId,
        content,
        role: role as MessageRole,
        emotions: emotions ? emotions : undefined,
      }
    })

    // Update conversation's lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('[MESSAGE_CREATE_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}