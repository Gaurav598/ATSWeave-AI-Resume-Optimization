import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <ProfileForm redirectTo={next} />;
}
