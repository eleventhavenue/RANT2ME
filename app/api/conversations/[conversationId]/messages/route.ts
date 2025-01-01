// app/api/conversations/[conversationId]/messages/route.ts
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId: params.conversationId,
        conversation: {
          userId: session.user.id
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('[MESSAGES_GET_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}