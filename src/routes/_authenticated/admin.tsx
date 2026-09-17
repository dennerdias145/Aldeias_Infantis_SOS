import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PageTitle, SectionHeader, StatusBadge } from "@/components/section";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { STAFF_ROLES } from "@/lib/aldeias";
import { useAuth } from "@/lib/auth";
import { formatDateTime, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Aldeias Acompanha" },
      {
        name: "description",
        content: "Equipe, papéis de acesso e registros de auditoria da instituição.",
      },
      { property: "og:title", content: "Administração — Aldeias Acompanha" },
      { property: "og:description", content: "Gerencie a equipe e acompanhe a auditoria." },
    ],
  }),
  component: AdminPage,
});

const ROLE_KEYS = ["admin", "coordination", "professional"] as const;

function StaffTab() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();

  const query = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("staff_profiles")
        .select("id, full_name, email, job_title, active, created_at")
        .order("full_name");
      if (error) throw error;
      const { data: roles } = await supabase.from("staff_roles").select("user_id, role");
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as string),
      }));
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({ id, role, on }: { id: string; role: string; on: boolean }) => {
      if (on) {
        const { error } = await supabase
          .from("staff_roles")
          .insert({ user_id: id, role: role as "admin" | "professional" | "coordination" });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("staff_roles")
          .delete()
          .eq("user_id", id)
          .eq("role", role as "admin" | "professional" | "coordination");
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Papéis atualizados.");
      void qc.invalidateQueries({ queryKey: ["staff-list"] });
    },
    onError: () => toast.error("Sem permissão para alterar papéis."),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("staff_profiles").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Situação atualizada.");
      void qc.invalidateQueries({ queryKey: ["staff-list"] });
    },
    onError: () => toast.error("Sem permissão para alterar."),
  });

  if (query.isPending) return <LoadingState rows={3} />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  if (!query.data.length) return <EmptyState title="Nenhum profissional cadastrado" />;

  return (
    <div className="space-y-3">
      {!isAdmin ? (
        <p className="text-sm text-muted-foreground">
          Somente administradores podem alterar papéis e situação.
        </p>
      ) : null}
      {query.data.map((s) => (
        <div key={s.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-bold">{s.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {s.email ?? "sem e-mail"} · {s.job_title ?? "Sem cargo"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Cadastrado em {formatDateTime(s.created_at)}
              </p>
            </div>
            <StatusBadge
              label={s.active ? "Ativo" : "Inativo"}
              tone={
                s.active
                  ? "bg-primary-soft text-primary-soft-foreground"
                  : "bg-muted text-muted-foreground"
              }
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            {ROLE_KEYS.map((role) => (
              <label key={role} className="flex items-center gap-2 text-sm font-semibold">
                <Switch
                  checked={s.roles.includes(role)}
                  disabled={!isAdmin || toggleRole.isPending}
                  onCheckedChange={(on) => toggleRole.mutate({ id: s.id, role, on })}
                />
                {STAFF_ROLES[role]}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm font-semibold">
              <Switch
                checked={s.active}
                disabled={!isAdmin || toggleActive.isPending}
                onCheckedChange={(active) => toggleActive.mutate({ id: s.id, active })}
              />
              Acesso ativo
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditTab() {
  const query = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aldeias_audit_logs")
        .select("id, actor_label, action, entity, entity_id, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (query.isPending) return <LoadingState rows={4} />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  if (!query.data.length)
    return (
      <EmptyState
        title="Sem registros de auditoria"
        description="As ações da equipe e das famílias aparecerão aqui."
      />
    );

  return (
    <ul className="space-y-2">
      {query.data.map((l) => (
        <li key={l.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="font-semibold">
            {l.action} · <span className="text-muted-foreground">{l.entity}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {l.actor_label ?? "sistema"} · {timeAgo(l.created_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function AdminPage() {
  return (
    <div>
      <PageTitle
        title="Administração"
        description="Equipe, papéis de acesso e auditoria das ações registradas."
      />

      <Tabs defaultValue="equipe">
        <TabsList>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
        </TabsList>
        <TabsContent value="equipe" className="mt-4">
          <SectionHeader
            title="Profissionais"
            action={
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="size-4" /> LGPD: acessos registrados
              </span>
            }
          />
          <div className="mt-3">
            <StaffTab />
          </div>
        </TabsContent>
        <TabsContent value="auditoria" className="mt-4">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
