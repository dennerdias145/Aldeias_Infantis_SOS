import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, LayoutDashboard, LogOut, Shield, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/familias", label: "Famílias", icon: Users },
] as const;

function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const { data, refetch } = useQuery({
    queryKey: ["staff-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aldeias_notifications")
        .select("id, title, body, read, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });
  const unread = data?.filter((n) => !n.read).length ?? 0;

  async function markAllRead() {
    const ids = data?.filter((n) => !n.read).map((n) => n.id) ?? [];
    if (!ids.length) return;
    await supabase.from("aldeias_notifications").update({ read: true }).in("id", ids);
    void refetch();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) void refetch();
      }}
    >
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="size-5" />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-card" />
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm">
        <SheetHeader>
          <SheetTitle>Notificações</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto px-4 pb-6">
          {!data?.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma notificação por enquanto.</p>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => void markAllRead()}>
                Marcar todas como lidas
              </Button>
              {data.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "rounded-xl border border-border p-3",
                    n.read ? "bg-card" : "bg-primary-soft/60",
                  )}
                >
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.body ? <p className="text-xs text-muted-foreground">{n.body}</p> : null}
                  <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, isAdmin, isCoordination, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = isCoordination ? [...NAV, { to: "/admin", label: "Administração", icon: Shield }] : NAV;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/painel" className="flex items-center gap-2">
            <BrandLogo className="w-40 rounded-sm" />
            <span className="sr-only">Aldeias Acompanha</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  pathname.startsWith(item.to)
                    ? "bg-primary-soft text-primary-soft-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <NotificationsButton />
            <span className="hidden text-sm font-semibold text-muted-foreground sm:inline">
              {profile?.full_name ?? ""}
              {isAdmin ? " · Admin" : ""}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sair"
              onClick={async () => {
                await signOut();
                void navigate({ to: "/", replace: true });
              }}
            >
              <LogOut className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="mx-auto flex h-18 max-w-md items-center justify-around px-4 py-3">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 text-[11px] font-bold",
                pathname.startsWith(item.to) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
