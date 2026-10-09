import { prisma } from "@/lib/prisma";
import { requireUser, apiError } from "@/lib/session";
import { ensureUserProfile } from "@/lib/profile";
import { isProfileReady, profileToContent } from "@/lib/resume-content";

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await ensureUserProfile(user.id);
    const content = profileToContent(user, profile);
    return Response.json({
      ...profile,
      name: user.name,
      email: user.email,
      image: user.image,
      // Resume-shaped view of the same data, so the editor can prefill from it.
      content,
      ready: isProfileReady(content),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        phone: body.phone,
        location: body.location,
        linkedinUrl: body.linkedinUrl,
        githubUrl: body.githubUrl,
        portfolioUrl: body.portfolioUrl,
        targetRole: body.targetRole,
        codingProfiles: body.codingProfiles,
        skills: body.skills ?? [],
        skillCategories: body.skillCategories,
        experience: body.experience ?? [],
        education: body.education ?? [],
        projects: body.projects,
        certifications: body.certifications,
        summary: body.summary,
        onboardingStep: body.onboardingStep ?? 0,
      },
      create: {
        userId: user.id,
        phone: body.phone,
        location: body.location,
        linkedinUrl: body.linkedinUrl,
        githubUrl: body.githubUrl,
        portfolioUrl: body.portfolioUrl,
        targetRole: body.targetRole,
        codingProfiles: body.codingProfiles,
        skills: body.skills ?? [],
        skillCategories: body.skillCategories,
        experience: body.experience ?? [],
        education: body.education ?? [],
        projects: body.projects,
        certifications: body.certifications,
        summary: body.summary,
        onboardingStep: body.onboardingStep ?? 0,
      },
    });
    return Response.json(profile);
  } catch (error) {
    return apiError(error);
  }
}
