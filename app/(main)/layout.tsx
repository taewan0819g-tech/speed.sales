import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { PhilosophySection } from "@/components/PhilosophySection";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <PhilosophySection />
    </div>
  );
}
