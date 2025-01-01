// app/api/moods/route.ts
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const moods = await prisma.moodEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30, // Last 30 days
    })

    return NextResponse.json(moods)
  } catch (error) {
    console.error('[MOODS_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await req.json()
    const mood = await prisma.moodEntry.create({
      data: {
        userId: session.user.id,
        rating: body.rating,
        note: body.note,
      }
    })

    return NextResponse.json(mood)
  } catch (error) {
    console.error('[MOOD_CREATE_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}