import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-(--width-content-narrow) flex-col items-center gap-6 text-center">
        <h1 className="text-xl font-medium sm:text-2xl">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you were looking for doesn&apos;t exist. If you were
          following a link to continue an interview, it may have expired.
        </p>
        <Button render={<Link href="/interview" />}>Go to the interview</Button>
      </div>
    </main>
  );
}
