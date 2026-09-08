import type { Metadata } from "next";

import { LoginForm } from "@/app/admin/login/login-form";

export const metadata: Metadata = { title: "Researcher sign in" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/admin";
  const notAResearcher = params.error === "not_a_researcher";

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <LoginForm next={next} notAResearcher={notAResearcher} />
    </div>
  );
}
