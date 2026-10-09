import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    throw new Error("UNAUTHORIZED");
  }
  const user =
    (session.user.id
      ? await prisma.user.findUnique({ where: { id: session.user.id } })
      : null) ??
    (session.user.email
      ? await prisma.user.findUnique({ where: { email: session.user.email } })
      : null);
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function apiError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") return unauthorized();
  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
