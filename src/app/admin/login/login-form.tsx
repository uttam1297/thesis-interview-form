"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { StatusMessage } from "@/components/feedback/status-message";
import { StudyHeader } from "@/components/layout/study-header";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

interface LoginFormProps {
  next: string;
  notAResearcher: boolean;
}

export function LoginForm({ next, notAResearcher }: LoginFormProps) {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    notAResearcher ? "That account is not registered as a researcher." : null
  );
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const supabase = createBrowserSupabaseClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        setPending(false);
        if (signInError) {
          // Deliberately generic: does not reveal whether the email exists.
          setError("Those sign-in details were not recognised.");
          return;
        }
        router.replace(next.startsWith("/admin") ? next : "/admin");
        router.refresh();
      }}
    >
      <StudyHeader className="mb-2" />

      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">
          Researcher sign in
        </h1>
        <p className="text-sm text-muted-foreground">
          Participants do not need an account — this is the researcher area.
        </p>
      </div>

      {error && <StatusMessage variant="warning">{error}</StatusMessage>}

      <Field>
        <FieldLabel htmlFor={emailId}>Email</FieldLabel>
        <Input
          id={emailId}
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
        <Input
          id={passwordId}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
