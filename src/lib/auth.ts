import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/db";

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/admin/login"
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" }
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const admin = await prisma.adminUser.findUnique({
          where: { username: parsed.data.username }
        });

        if (!admin || admin.status !== "ACTIVE") {
          return null;
        }

        const isValid = await bcrypt.compare(parsed.data.password, admin.passwordHash);

        if (!isValid) {
          return null;
        }

        await prisma.adminUser.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date() }
        });

        return {
          id: admin.id,
          name: admin.displayName,
          username: admin.username
        };
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    }
  }
});
