// app/api/conversations/route.ts
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'ACTIVE'

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: session.user.id,
        status: status as ConversationStatus,
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
    })

    const total = await prisma.conversation.count({
      where: {
        userId: session.user.id,
        status: status as ConversationStatus,
      }
    })

    return NextResponse.json({
      conversations,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit
      }
    })
  } catch (error) {
    console.error('[CONVERSATIONS_GET_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        humeGroupId: crypto.randomUUID(),
      }
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('[CONVERSATION_CREATE_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}