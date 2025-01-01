// types/db.ts
import { Prisma } from '@prisma/client'

export type FullConversation = Prisma.ConversationGetPayload<{
  include: {
    messages: true;
  };
}>;

export type UserWithSettings = Prisma.UserGetPayload<{
  include: {
    userSettings: true;
  };
}>;

// Add NextAuth session type augmentation
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    }
  }
}

// Extend next-auth JWT type
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}