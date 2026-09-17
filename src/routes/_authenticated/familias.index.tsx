import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageTitle, StatusBadge } from "@/components/section";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { FAMILY_SITUATIONS } from "@/lib/aldeias";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/familias/")({
  head: () => ({
    meta: [
      { title: "Famílias acompanhadas — Aldeias Acompanha" },
      {
        name: "description",
        content: "Cadastro e busca das famílias acompanhadas pela instituição.",
      },
      { property: "og:title", content: "Famílias acompanhadas — Aldeias Acompanha" },
      { property: "og:description", content: "Cadastre famílias e gere o código de acesso." },
    ],
  }),
  component: FamiliesPage,
});

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function NewFamilyDialog() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    contact_name: "",
    internal_code: "",
    situation: "ativa",
    notes: "",
    access_code: randomCode(),
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Informe o nome da família.");
      const { data, error } = await supabase
        .from("families")
        .insert({
          name: form.name.trim(),
          contact_name: form.contact_name.trim() || null,
          internal_code: form.internal_code.trim() || `FAM-${randomCode()}`,
          situation: form.situation,
          notes: form.notes.trim() || null,
          access_code: form.access_code.toUpperCase(),
          responsible_id: user?.id ?? null,
          created_by: user?.id ?? null,
        })
        .select("id, access_code")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Família cadastrada. Código de acesso: ${data.access_code}`);
      setOpen(false);
      setForm({
        name: "",
        contact_name: "",
        internal_code: "",
        situation: "ativa",
        notes: "",
        access_code: randomCode(),
      });
      void qc.invalidateQueries({ queryKey: ["families"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Nova família
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar família</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="nome">Nome da família</Label>
            <Input
              id="nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contato">Pessoa de referência</Label>
            <Input
              id="contato"
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="interno">Código interno</Label>
              <Input
                id="interno"
                placeholder="Gerado automaticamente"
                value={form.internal_code}
                onChange={(e) => setForm({ ...form, internal_code: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Situação</Label>
              <Select
                value={form.situation}
                onValueChange={(v) => setForm({ ...form, situation: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FAMILY_SITUATIONS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="acesso">Código de acesso da família</Label>
            <div className="flex gap-2">
              <Input
                id="acesso"
                value={form.access_code}
                onChange={(e) => setForm({ ...form, access_code: e.target.value.toUpperCase() })}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm({ ...form, access_code: randomCode() })}
              >
                Gerar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              A família usa este código para entrar em /familia.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="obs">Observações internas</Label>
            <Textarea
              id="obs"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? "Salvando..." : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FamiliesPage() {
  const [term, setTerm] = useState("");
  const [situation, setSituation] = useState("todas");

  const query = useQuery({
    queryKey: ["families"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("families")
        .select("id, name, contact_name, internal_code, situation, access_code, created_at")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (query.data ?? []).filter((f) => {
      const okTerm =
        !t ||
        f.name.toLowerCase().includes(t) ||
        (f.contact_name ?? "").toLowerCase().includes(t) ||
        f.internal_code.toLowerCase().includes(t);
      const okSit = situation === "todas" || f.situation === situation;
      return okTerm && okSit;
    });
  }, [query.data, term, situation]);

  return (
    <div>
      <PageTitle
        title="Famílias"
        description="Cadastro, situação e código de acesso das famílias acompanhadas."
        action={<NewFamilyDialog />}
      />

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="busca">Buscar</Label>
          <Input
            id="busca"
            placeholder="Nome, referência ou código interno"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Situação</Label>
          <Select value={situation} onValueChange={setSituation}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {Object.entries(FAMILY_SITUATIONS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        {query.isPending ? (
          <LoadingState rows={4} />
        ) : query.isError ? (
          <ErrorState onRetry={() => void query.refetch()} />
        ) : !rows.length ? (
          <EmptyState
            title="Nenhuma família encontrada"
            description="Cadastre a primeira família para começar o acompanhamento."
            icon={<Users className="mx-auto size-8" />}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((f) => {
              const sit = FAMILY_SITUATIONS[f.situation];
              return (
                <Link
                  key={f.id}
                  to="/familias/$id"
                  params={{ id: f.id }}
                  className="rounded-2xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{f.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {f.contact_name ?? "Sem pessoa de referência"} · {f.internal_code}
                      </p>
                    </div>
                    <StatusBadge
                      label={sit?.label ?? f.situation}
                      tone={sit?.tone ?? "bg-muted text-muted-foreground"}
                    />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Código de acesso <span className="font-mono font-bold">{f.access_code}</span> ·
                    desde {formatDate(f.created_at)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
