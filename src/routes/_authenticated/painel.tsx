import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { useEffect } from "react";

import { CommitmentKindIcon } from "@/components/commitment-kind";
import { PageTitle, StatCard, StatusBadge } from "@/components/section";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { statusMeta, PRIORITIES } from "@/lib/aldeias";
import { formatDateTime, isToday } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel — Aldeias Acompanha" },
      { name: "description", content: "Resumo diário dos compromissos das famílias acompanhadas." },
      { property: "og:title", content: "Painel — Aldeias Acompanha" },
      { property: "og:description", content: "Compromissos de hoje, atrasos e pedidos de ajuda." },
    ],
  }),
  component: Painel,
});

type Row = {
  id: string;
  title: string;
  scheduled_at: string;
  status: string;
  priority: string;
  kind: string;
  family_id: string;
  families: { name: string } | null;
};

function Painel() {
  const query = useQuery({
    queryKey: ["painel-commitments"],
    queryFn: async () => {
      await supabase.rpc("refresh_overdue_commitments");
      const { data, error } = await supabase
        .from("commitments")
        .select("id, title, scheduled_at, status, priority, kind, family_id, families(name)")
        .neq("status", "cancelado")
        .order("scheduled_at", { ascending: true })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  useEffect(() => {
    document.title = "Painel — Aldeias Acompanha";
  }, []);

  if (query.isPending) return <LoadingState rows={4} />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;

  const rows = query.data;
  const hoje = rows.filter((r) => isToday(r.scheduled_at));
  const atrasados = rows.filter((r) => r.status === "atrasado");
  const ajuda = rows.filter((r) => r.status === "precisa_ajuda");
  const semana = rows.filter((r) => {
    const d = new Date(r.scheduled_at).getTime();
    return d >= Date.now() && d <= Date.now() + 7 * 86400000;
  });

  return (
    <div>
      <PageTitle
        title="Painel"
        description="O que precisa da sua atenção agora."
        action={
          <Button asChild variant="outline">
            <Link to="/agenda">
              <CalendarDays className="mr-2 size-4" /> Ver agenda
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Hoje" value={hoje.length} hint="compromissos do dia" />
        <StatCard label="Próximos 7 dias" value={semana.length} />
        <StatCard label="Atrasados" value={atrasados.length} tone="text-destructive" />
        <StatCard label="Pedidos de ajuda" value={ajuda.length} tone="text-destructive" />
      </div>

      <Group title="Precisam de ajuda" rows={ajuda} empty="Nenhuma família pediu ajuda." />
      <Group title="Atrasados" rows={atrasados} empty="Nenhum compromisso atrasado." />
      <Group title="Hoje" rows={hoje} empty="Nada agendado para hoje." />
    </div>
  );
}

function Group({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {!rows.length ? (
        <EmptyState title={empty} />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const meta = statusMeta(r.status);
            return (
              <Link
                key={r.id}
                to="/familias/$id"
                params={{ id: r.family_id }}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <CommitmentKindIcon kind={r.kind} />
                  <div className="min-w-0">
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.families?.name ?? "Família"} · {formatDateTime(r.scheduled_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    label={PRIORITIES[r.priority]?.label ?? r.priority}
                    tone={PRIORITIES[r.priority]?.tone ?? "bg-muted text-muted-foreground"}
                  />
                  <StatusBadge label={meta.label} tone={meta.tone} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
