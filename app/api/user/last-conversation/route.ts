// app/api/user/last-conversation/route.ts
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { conversationId } = await req.json();

    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastActiveConversationId: conversationId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LAST_CONVERSATION_UPDATE_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}