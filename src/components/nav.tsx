"use client";

import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { FileText, BarChart3, LogOut } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Applications", icon: FileText },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

export function Nav({ email }: { email: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-tight"
          >
            Resume Tracker
          </Link>
          <nav className="flex items-center gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "gap-1.5",
                  pathname === link.href && "bg-muted font-medium"
                )}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {email}
          </span>
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
