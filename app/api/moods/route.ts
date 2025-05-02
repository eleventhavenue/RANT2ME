// app/api/moods/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const moods = await prisma.moodEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30, // Last 30 days
    });

    return NextResponse.json(moods);
  } catch (error) {
    console.error('[MOODS_ERROR]', error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch moods" }), 
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
    
    if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid rating. Must be a number between 1 and 5." }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const mood = await prisma.moodEntry.create({
      data: {
        userId: session.user.id,
        rating: body.rating,
        note: body.note || null,
      }
    });

    // Update user analytics
    await prisma.userAnalytics.upsert({
      where: { userId: session.user.id },
      update: {
        lastActive: new Date(),
      },
      create: {
        userId: session.user.id,
        totalConversations: 0,
        totalMessages: 0,
        lastActive: new Date(),
      }
    });

    return NextResponse.json(mood);
  } catch (error) {
    console.error('[MOOD_CREATE_ERROR]', error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create mood entry" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}