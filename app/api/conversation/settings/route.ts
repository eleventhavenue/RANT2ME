// app/api/conversation/settings/route.ts
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
    const { custom_session_id, variables } = body;

    if (custom_session_id) {
      // Update the active conversation with the session ID
      await prisma.conversation.updateMany({
        where: {
          userId: session.user.id,
          status: 'ACTIVE'
        },
        data: {
          humeGroupId: custom_session_id
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SETTINGS_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}