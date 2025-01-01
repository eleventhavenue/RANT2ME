// app/api/analytics/message/route.ts
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await req.json()
    const { conversationId, messageType, emotions } = body

    await prisma.$transaction(async (tx) => {
      // Update user analytics
      await tx.userAnalytics.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          totalMessages: 1,
          totalConversations: 1,
          averageEmotionScores: emotions || {},
        },
        update: {
          totalMessages: { increment: 1 },
          lastActive: new Date(),
          averageEmotionScores: emotions ? {
            // Implement averaging logic for emotions
          } : undefined,
        },
      })

      // Update conversation lastMessageAt
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ANALYTICS_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}