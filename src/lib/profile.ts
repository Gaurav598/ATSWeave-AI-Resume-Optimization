import { prisma } from "@/lib/prisma";

export async function ensureUserProfile(userId: string) {
  const existing = await prisma.userProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.userProfile.create({
    data: {
      userId,
      experience: [],
      education: [],
      skills: [],
      skillCategories: { languages: [], frameworks: [], tools: [] },
      projects: [],
      certifications: [],
      codingProfiles: {},
    },
  });
}

export async function getOrCreateDemoUser() {
  const email = "alex@example.com";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      id: "demo-user",
      email,
      name: "Alex Rivera",
    },
  });
  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    await prisma.userProfile.create({
      data: {
        userId: user.id,
        experience: [],
        education: [],
        skills: [],
        skillCategories: { languages: [], frameworks: [], tools: [] },
        projects: [],
        certifications: [],
        codingProfiles: {},
      },
    });
  }
  return user;
}
