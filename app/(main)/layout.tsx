import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { PhilosophySection } from "@/components/PhilosophySection";
import { GlobalNav } from "@/components/global-nav";

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
      <main className="flex flex-1">
        <GlobalNav user={user} />
        <div className="min-w-0 flex-1 lg:ml-[260px]">
          {children}
        </div>
      </main>
      <PhilosophySection />
    </div>
  );
}
