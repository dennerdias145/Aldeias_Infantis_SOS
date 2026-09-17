import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { CommitmentKindIcon } from "@/components/commitment-kind";
import { PageTitle, StatusBadge } from "@/components/section";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { PRIORITIES, STATUS_ORDER, statusMeta } from "@/lib/aldeias";
import { addDays, formatLongDate, formatTime, isToday, startOfDay, startOfWeek, toInputDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda global — Aldeias Acompanha" },
      { name: "description", content: "Todos os compromissos por dia, semana ou mês, com filtros." },
      { property: "og:title", content: "Agenda global — Aldeias Acompanha" },
      { property: "og:description", content: "Visualize e filtre os compromissos das famílias." },
    ],
  }),
  component: Agenda,
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

function Agenda() {
  const [view, setView] = useState<"dia" | "semana" | "mes">("semana");
  const [mode, setMode] = useState<"lista" | "calendario">("calendario");
  const [anchor, setAnchor] = useState(() => toInputDate(new Date()));
  const [status, setStatus] = useState("todos");
  const [familyId, setFamilyId] = useState("todas");

  const base = useMemo(() => startOfDay(new Date(`${anchor}T12:00:00`)), [anchor]);

  const range = useMemo(() => {
    if (view === "dia") return { from: base, to: addDays(base, 1) };
    if (view === "semana") {
      const from = startOfWeek(base);
      return { from, to: addDays(from, 7) };
    }
    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    if (mode === "calendario") {
      const from = startOfWeek(first);
      return { from, to: addDays(from, 42) };
    }
    return { from: first, to: new Date(base.getFullYear(), base.getMonth() + 1, 1) };
  }, [base, view, mode]);

  const families = useQuery({
    queryKey: ["families-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("families").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const query = useQuery({
    queryKey: ["agenda", range.from.toISOString(), range.to.toISOString(), status, familyId],
    queryFn: async () => {
      await supabase.rpc("refresh_overdue_commitments");
      let q = supabase
        .from("commitments")
        .select("id, title, scheduled_at, status, priority, kind, family_id, families(name)")
        .gte("scheduled_at", range.from.toISOString())
        .lt("scheduled_at", range.to.toISOString())
        .order("scheduled_at", { ascending: true });
      if (status !== "todos") q = q.eq("status", status);
      if (familyId !== "todas") q = q.eq("family_id", familyId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const byDay = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of query.data ?? []) {
      const key = toInputDate(new Date(r.scheduled_at));
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return map;
  }, [query.data]);

  const grouped = useMemo(() => [...byDay.entries()], [byDay]);


  return (
    <div>
      <PageTitle title="Agenda global" description="Compromissos por dia, semana ou mês." />

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="data">Data de referência</Label>
          <Input id="data" type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Visualização</Label>
          <Select value={view} onValueChange={(v) => setView(v as typeof view)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dia">Dia</SelectItem>
              <SelectItem value="semana">Semana</SelectItem>
              <SelectItem value="mes">Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Situação</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusMeta(s).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Família</Label>
          <Select value={familyId} onValueChange={setFamilyId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {(families.data ?? []).map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setAnchor(toInputDate(addDays(new Date(`${anchor}T12:00:00`), view === "mes" ? -30 : view === "semana" ? -7 : -1)))
          }
        >
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => setAnchor(toInputDate(new Date()))}>
          Hoje
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setAnchor(toInputDate(addDays(new Date(`${anchor}T12:00:00`), view === "mes" ? 30 : view === "semana" ? 7 : 1)))
          }
        >
          Próximo
        </Button>

        <div className="ml-auto inline-flex rounded-lg border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setMode("calendario")}
            className={`rounded-md px-3 py-1 text-sm font-semibold ${mode === "calendario" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Calendário
          </button>
          <button
            type="button"
            onClick={() => setMode("lista")}
            className={`rounded-md px-3 py-1 text-sm font-semibold ${mode === "lista" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Lista
          </button>
        </div>
      </div>

      <div className="mt-6">
        {query.isPending ? (
          <LoadingState rows={3} />
        ) : query.isError ? (
          <ErrorState onRetry={() => void query.refetch()} />
        ) : mode === "calendario" ? (
          view === "mes" ? (
            <MonthGrid start={range.from} base={base} byDay={byDay} />
          ) : (
            <TimeGrid
              days={
                view === "dia"
                  ? [range.from]
                  : Array.from({ length: 7 }, (_, i) => addDays(range.from, i))
              }
              byDay={byDay}
            />
          )
        ) : !grouped.length ? (
          <EmptyState title="Nenhum compromisso no período" description="Ajuste os filtros ou a data." />
        ) : (
          <div className="space-y-6">
            {grouped.map(([day, rows]) => (
              <section key={day}>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  {formatLongDate(day)}
                </h2>
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
                             <p className="font-semibold">
                               <span className="mr-2 text-muted-foreground">{formatTime(r.scheduled_at)}</span>
                               {r.title}
                             </p>
                             <p className="text-sm text-muted-foreground">{r.families?.name ?? "Família"}</p>
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
              </section>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function EventChip({ row }: { row: Row }) {
  const meta = statusMeta(row.status);
  return (
    <Link
      to="/familias/$id"
      params={{ id: row.family_id }}
      title={`${formatTime(row.scheduled_at)} — ${row.title} (${row.families?.name ?? "Família"})`}
      className={`block truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium ${meta.tone} hover:opacity-80`}
    >
      <span className="mr-1 opacity-70">{formatTime(row.scheduled_at)}</span>
      {row.title}
    </Link>
  );
}

function MonthGrid({
  start,
  base,
  byDay,
}: {
  start: Date;
  base: Date;
  byDay: Map<string, Row[]>;
}) {
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {WEEKDAYS.map((d) => (
          <div key={d} className="p-2 text-center text-xs font-bold uppercase text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const key = toInputDate(d);
          const rows = byDay.get(key) ?? [];
          const outside = d.getMonth() !== base.getMonth();
          return (
            <div
              key={key}
              className={`min-h-24 space-y-1 border-b border-r border-border p-1.5 ${outside ? "bg-muted/20" : ""}`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  isToday(d)
                    ? "bg-primary text-primary-foreground"
                    : outside
                      ? "text-muted-foreground/60"
                      : "text-foreground"
                }`}
              >
                {d.getDate()}
              </div>
              {rows.slice(0, 3).map((r) => (
                <EventChip key={r.id} row={r} />
              ))}
              {rows.length > 3 ? (
                <p className="px-1 text-[11px] text-muted-foreground">+{rows.length - 3} mais</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeGrid({ days, byDay }: { days: Date[]; byDay: Map<string, Row[]> }) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 06h às 21h
  const rowHeight = 56;
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <div className="min-w-[640px]">
        <div
          className="grid border-b border-border bg-muted/40"
          style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div />
          {days.map((d) => (
            <div key={toInputDate(d)} className="p-2 text-center">
              <p className="text-xs font-bold uppercase text-muted-foreground">{WEEKDAYS[d.getDay()]}</p>
              <p
                className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                  isToday(d) ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {d.getDate()}
              </p>
            </div>
          ))}
        </div>
        <div
          className="relative grid"
          style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div>
            {hours.map((h) => (
              <div
                key={h}
                className="border-b border-border pr-2 text-right text-[11px] text-muted-foreground"
                style={{ height: rowHeight }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {days.map((d) => {
            const rows = byDay.get(toInputDate(d)) ?? [];
            return (
              <div key={toInputDate(d)} className="relative border-l border-border">
                {hours.map((h) => (
                  <div key={h} className="border-b border-border" style={{ height: rowHeight }} />
                ))}
                {rows.map((r) => {
                  const dt = new Date(r.scheduled_at);
                  const minutes = dt.getHours() * 60 + dt.getMinutes();
                  const top = ((minutes - hours[0]! * 60) / 60) * rowHeight;
                  const clamped = Math.min(Math.max(top, 0), hours.length * rowHeight - 28);
                  return (
                    <div
                      key={r.id}
                      className="absolute left-1 right-1"
                      style={{ top: clamped }}
                    >
                      <EventChip row={r} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

