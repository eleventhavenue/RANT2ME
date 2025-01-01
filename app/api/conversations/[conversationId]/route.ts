// app/api/conversations/[conversationId]/route.ts
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await req.json()
    const { humeGroupId } = body

    const conversation = await prisma.conversation.update({
      where: {
        id: params.conversationId,
        userId: session.user.id
      },
      data: {
        humeGroupId,
        lastMessageAt: new Date()
      }
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('[CONVERSATION_UPDATE_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}