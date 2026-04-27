import type { Account, NextAuthOptions, Profile, Session, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import OktaProvider from "next-auth/providers/okta";
import { prisma } from "@/lib/prisma";
import { roleForIdentity } from "@/lib/admin";

type OktaProfile = Profile & {
  groups?: string[];
};

type DevCredentials = {
  email?: string;
  password?: string;
};

export function isDevAuthEnabled() {
  return process.env.ENABLE_DEV_AUTH === "true" && process.env.NODE_ENV !== "production";
}

function getProviders() {
  const providers = [];

  if (process.env.OKTA_ISSUER && process.env.OKTA_CLIENT_ID && process.env.OKTA_CLIENT_SECRET) {
    providers.push(
      OktaProvider({
        issuer: process.env.OKTA_ISSUER,
        clientId: process.env.OKTA_CLIENT_ID,
        clientSecret: process.env.OKTA_CLIENT_SECRET,
        authorization: {
          params: {
            scope: "openid email profile groups",
          },
        },
      }),
    );
  }

  if (isDevAuthEnabled()) {
    providers.push(
      CredentialsProvider({
        id: "dev",
        name: "Local development",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const { email, password } = (credentials ?? {}) as DevCredentials;
          const configuredUsers = [
            {
              email: process.env.DEV_ADMIN_EMAIL ?? "admin@anysphere.co",
              password: process.env.DEV_ADMIN_PASSWORD ?? "password",
              name: "CoachSphere Admin",
              groups: ["CoachSphere Admins"],
            },
            {
              email: process.env.DEV_USER_EMAIL ?? "user@anysphere.co",
              password: process.env.DEV_USER_PASSWORD ?? "password",
              name: "CoachSphere Listener",
              groups: [],
            },
          ];
          const devUser = configuredUsers.find(
            (candidate) => candidate.email === email && candidate.password === password,
          );

          if (!devUser) {
            return null;
          }

          const role = roleForIdentity({ email: devUser.email, groups: devUser.groups });
          const user = await prisma.user.upsert({
            where: { email: devUser.email },
            update: {
              name: devUser.name,
              role,
            },
            create: {
              email: devUser.email,
              name: devUser.name,
              role,
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            groups: devUser.groups,
          };
        },
      }),
    );
  }

  return providers;
}

async function upsertSignedInUser(user: NextAuthUser, profile?: OktaProfile, account?: Account | null) {
  if (!user.email) {
    return null;
  }

  const groups = profile?.groups ?? [];
  const role = roleForIdentity({ email: user.email, groups });
  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      image: user.image,
      oktaSub: account?.provider === "okta" ? account.providerAccountId : profile?.sub,
      role,
    },
    create: {
      email: user.email,
      name: user.name,
      image: user.image,
      oktaSub: account?.provider === "okta" ? account.providerAccountId : profile?.sub,
      role,
    },
  });
}

export const authOptions: NextAuthOptions = {
  providers: getProviders(),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      await upsertSignedInUser(user, profile as OktaProfile | undefined, account);
      return Boolean(user.email);
    },
    async jwt({ token, user, profile, account }): Promise<JWT> {
      if (user?.email) {
        const groups =
          "groups" in user && Array.isArray(user.groups)
            ? user.groups
            : ((profile as OktaProfile | undefined)?.groups ?? []);
        token.role = roleForIdentity({ email: user.email, groups });
        token.groups = groups;
      }

      if (account?.provider === "okta" && token.email) {
        const dbUser = await upsertSignedInUser(
          {
            id: token.sub ?? "",
            email: token.email,
            name: token.name,
            image: token.picture,
            role: token.role ?? roleForIdentity({ email: token.email }),
          },
          profile as OktaProfile | undefined,
          account,
        );
        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
        }
      }

      if (token.email && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }): Promise<Session> {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role ?? roleForIdentity({ email: session.user.email });
        session.user.groups = token.groups ?? [];
      }
      return session;
    },
  },
};

