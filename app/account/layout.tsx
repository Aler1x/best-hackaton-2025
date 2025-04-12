import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AccountSidebar from "@/components/account-sidebar";

export const metadata: Metadata = {
  title: "Account - Best Shelter",
  description: "Manage your account settings and pets",
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin?next=/account");
  }

  return <AccountSidebar>{children}</AccountSidebar>;
}