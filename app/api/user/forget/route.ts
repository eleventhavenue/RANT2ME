// app/api/user/forget/route.ts
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Delete all user's conversations and messages
    await prisma.conversation.deleteMany({
      where: {
        userId: session.user.id
      }
    })

    // Reset user settings to default
    await prisma.userSettings.update({
      where: { userId: session.user.id },
      data: {
        isDark: false,
        volume: 100,
        microphoneSensitivity: 75,
        language: "en",
        notifications: true,
        autoConnect: false,
        privacyMode: false
      }
    })

    // Delete mood entries
    await prisma.moodEntry.deleteMany({
      where: {
        userId: session.user.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[USER_FORGET_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}