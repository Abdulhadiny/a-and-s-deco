import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid email or password");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        });

         const passwordValid = user
          ? await bcrypt.compare(credentials.password as string, user.passwordHash)
          : false;

        if (!user || !user.isActive || !passwordValid) {
          throw new Error("Invalid email or password");
        }

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        const permissions = user.role?.rolePermissions.map(
          (rp) => `${rp.permission.module}:${rp.permission.action}`
        ) || [];

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role?.name || "STAFF",
          permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
      }
      return token;
      },
      async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
});
