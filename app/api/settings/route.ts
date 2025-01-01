// app/api/settings/route.ts
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id }
    })

    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          isDark: false,
          volume: 100,
          microphoneSensitivity: 75,
          language: "en",
          notifications: true,
          autoConnect: false,
          privacyMode: false
        }
      })
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('[SETTINGS_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await req.json()
    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: body,
      create: {
        userId: session.user.id,
        ...body
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('[SETTINGS_UPDATE_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}