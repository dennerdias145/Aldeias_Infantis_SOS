import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Plus, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AudioRecorder, StoredAudio, type Recorded } from "@/components/audio";
import { CommitmentKindIcon } from "@/components/commitment-kind";
import { PageTitle, SectionHeader, StatusBadge } from "@/components/section";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  COMMITMENT_KINDS,
  FAMILY_SITUATIONS,
  PRIORITIES,
  STATUS_ORDER,
  statusMeta,
} from "@/lib/aldeias";
import { useAuth } from "@/lib/auth";
import { formatDate, formatDateTime, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/familias/$id")({
  head: () => ({
    meta: [
      { title: "Acompanhamento da família — Aldeias Acompanha" },
      {
        name: "description",
        content: "Compromissos, integrantes, mensagens e histórico da família acompanhada.",
      },
      { property: "og:title", content: "Acompanhamento da família — Aldeias Acompanha" },
      {
        property: "og:description",
        content: "Registre compromissos e converse com a família.",
      },
    ],
  }),
  component: FamilyDetail,
});

type Commitment = {
  id: string;
  title: string;
  description: string | null;
  guidance: string | null;
  kind: string;
  scheduled_at: string;
  due_date: string | null;
  priority: string;
  status: string;
  requires_confirmation: boolean;
  notes: string | null;
};

function nowLocalInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function NewCommitmentDialog({ familyId }: { familyId: string }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    guidance: "",
    kind: "acompanhamento",
    scheduled_at: nowLocalInput(),
    due_date: "",
    priority: "media",
    requires_confirmation: true,
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Informe o título do compromisso.");
      const { error } = await supabase.from("commitments").insert({
        family_id: familyId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        guidance: form.guidance.trim() || null,
        kind: form.kind,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        due_date: form.due_date || null,
        priority: form.priority,
        status: "pendente",
        requires_confirmation: form.requires_confirmation,
        responsible_id: user?.id ?? null,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Compromisso criado. A família já pode visualizar.");
      setOpen(false);
      setForm({ ...form, title: "", description: "", guidance: "" });
      void qc.invalidateQueries({ queryKey: ["family-commitments", familyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> Novo compromisso
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo compromisso</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="desc">Descrição para a equipe</Label>
            <Textarea
              id="desc"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="orient">Orientação em linguagem simples (a família vê)</Label>
            <Textarea
              id="orient"
              rows={3}
              placeholder="Ex.: Leve o documento de identidade na consulta das 9h."
              value={form.guidance}
              onChange={(e) => setForm({ ...form, guidance: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMITMENT_KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                       <span className="flex items-center gap-2">
                         <CommitmentKindIcon kind={k.value} className="[&>span]:size-7 [&_svg]:size-4" />
                         {k.label}
                       </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="quando">Data e hora</Label>
              <Input
                id="quando"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prazo">Prazo final (opcional)</Label>
              <Input
                id="prazo"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <Label htmlFor="confirma">Pedir confirmação da família</Label>
            <Switch
              id="confirma"
              checked={form.requires_confirmation}
              onCheckedChange={(v) => setForm({ ...form, requires_confirmation: v })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? "Salvando..." : "Criar compromisso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MessagesPanel({ familyId, commitment }: { familyId: string; commitment: Commitment }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [audio, setAudio] = useState<Recorded | null>(null);

  const key = ["family-messages", commitment.id];
  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_kind, body, audio_path, audio_seconds, created_at")
        .eq("commitment_id", commitment.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!body.trim() && !audio) throw new Error("Escreva ou grave uma mensagem.");
      let audioPath: string | null = null;
      if (audio) {
        audioPath = `equipe/${familyId}/${crypto.randomUUID()}.webm`;
        const { error } = await supabase.storage
          .from("media")
          .upload(audioPath, audio.blob, { contentType: "audio/webm" });
        if (error) throw new Error("Não foi possível enviar o áudio.");
      }
      const { error } = await supabase.from("messages").insert({
        family_id: familyId,
        commitment_id: commitment.id,
        sender_kind: "staff",
        sender_id: user?.id ?? null,
        body: body.trim() || null,
        audio_path: audioPath,
        audio_seconds: audio?.seconds ?? null,
      });
      if (error) throw error;
      await supabase.from("aldeias_notifications").insert({
        family_id: familyId,
        title: "Nova mensagem da equipe",
        body: commitment.title,
        kind: "info",
      });
    },
    onSuccess: () => {
      setBody("");
      setAudio(null);
      void qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <MessageCircle className="size-4" /> Conversa
      </p>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {query.isPending ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : !query.data?.length ? (
          <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
        ) : (
          query.data.map((m) => (
            <div
              key={m.id}
              className={
                m.sender_kind === "staff"
                  ? "ml-8 rounded-xl bg-primary-soft p-3"
                  : "mr-8 rounded-xl bg-card p-3"
              }
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                {m.sender_kind === "staff" ? "Equipe" : "Família"} · {timeAgo(m.created_at)}
              </p>
              {m.body ? <p className="mt-1 text-sm">{m.body}</p> : null}
              {m.audio_path ? <StoredAudio path={m.audio_path} /> : null}
            </div>
          ))
        )}
      </div>
      <div className="mt-3 space-y-2">
        <Textarea
          rows={2}
          placeholder="Escreva um recado para a família"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <AudioRecorder value={audio} onChange={setAudio} />
        <Button size="sm" onClick={() => send.mutate()} disabled={send.isPending}>
          <Send className="size-4" /> {send.isPending ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  );
}

function CommitmentCard({ familyId, item }: { familyId: string; item: Commitment }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const meta = statusMeta(item.status);

  const change = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("commitments")
        .update({ status })
        .eq("id", item.id);
      if (error) throw error;
      await supabase.from("commitment_updates").insert({
        commitment_id: item.id,
        author_kind: "staff",
        author_id: user?.id ?? null,
        from_status: item.status,
        to_status: status,
        note: "Atualizado pela equipe.",
      });
    },
    onSuccess: () => {
      toast.success("Situação atualizada.");
      void qc.invalidateQueries({ queryKey: ["family-commitments", familyId] });
      void qc.invalidateQueries({ queryKey: ["commitment-history", item.id] });
    },
    onError: () => toast.error("Não foi possível atualizar."),
  });

  const history = useQuery({
    queryKey: ["commitment-history", item.id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commitment_updates")
        .select("id, author_kind, from_status, to_status, note, created_at")
        .eq("commitment_id", item.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <CommitmentKindIcon kind={item.kind} showLabel className="flex-col items-start gap-1 text-xs" />
          <div className="min-w-0">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(item.scheduled_at)}
              {item.due_date ? ` · prazo ${formatDate(item.due_date)}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            label={PRIORITIES[item.priority]?.label ?? item.priority}
            tone={PRIORITIES[item.priority]?.tone ?? "bg-muted text-muted-foreground"}
          />
          <StatusBadge label={meta.label} tone={meta.tone} />
        </div>
      </div>

      {item.guidance ? (
        <p className="mt-3 rounded-xl bg-muted/40 p-3 text-sm">{item.guidance}</p>
      ) : null}
      {item.description ? (
        <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select value={item.status} onValueChange={(v) => change.mutate(v)}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {statusMeta(s).label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? "Fechar" : "Conversa e histórico"}
        </Button>
      </div>

      {open ? (
        <>
          <MessagesPanel familyId={familyId} commitment={item} />
          <div className="mt-3 rounded-xl border border-border p-3">
            <p className="mb-2 text-sm font-semibold">Histórico</p>
            {!history.data?.length ? (
              <p className="text-sm text-muted-foreground">Sem registros ainda.</p>
            ) : (
              <ul className="space-y-2">
                {history.data.map((h) => (
                  <li key={h.id} className="text-sm">
                    <span className="font-semibold">
                      {h.author_kind === "family" ? "Família" : "Equipe"}
                    </span>{" "}
                    {h.from_status ? `${statusMeta(h.from_status).label} → ` : ""}
                    {h.to_status ? statusMeta(h.to_status).label : ""}
                    <span className="text-muted-foreground"> · {timeAgo(h.created_at)}</span>
                    {h.note ? <p className="text-muted-foreground">{h.note}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function MembersPanel({ familyId }: { familyId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", relationship: "", birth_date: "" });

  const query = useQuery({
    queryKey: ["family-members", familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("id, name, relationship, birth_date")
        .eq("family_id", familyId)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Informe o nome.");
      const { error } = await supabase.from("family_members").insert({
        family_id: familyId,
        name: form.name.trim(),
        relationship: form.relationship.trim() || null,
        birth_date: form.birth_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ name: "", relationship: "", birth_date: "" });
      void qc.invalidateQueries({ queryKey: ["family-members", familyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      {!query.data?.length ? (
        <EmptyState title="Nenhum integrante cadastrado" />
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {query.data.map((m) => (
            <div key={m.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-semibold">{m.name}</p>
              <p className="text-sm text-muted-foreground">
                {m.relationship ?? "Integrante"}
                {m.birth_date ? ` · ${formatDate(m.birth_date)}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-4">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="mname">Nome</Label>
          <Input
            id="mname"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="mrel">Parentesco</Label>
          <Input
            id="mrel"
            value={form.relationship}
            onChange={(e) => setForm({ ...form, relationship: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="mnasc">Nascimento</Label>
          <Input
            id="mnasc"
            type="date"
            value={form.birth_date}
            onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
          />
        </div>
        <div className="sm:col-span-4">
          <Button size="sm" onClick={() => add.mutate()} disabled={add.isPending}>
            <Plus className="size-4" /> Adicionar integrante
          </Button>
        </div>
      </div>
    </div>
  );
}

function FamilyDetail() {
  const { id } = Route.useParams();

  const family = useQuery({
    queryKey: ["family", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("families")
        .select("id, name, contact_name, internal_code, situation, access_code, notes")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const commitments = useQuery({
    queryKey: ["family-commitments", id],
    queryFn: async () => {
      await supabase.rpc("refresh_overdue_commitments");
      const { data, error } = await supabase
        .from("commitments")
        .select(
          "id, title, description, guidance, kind, scheduled_at, due_date, priority, status, requires_confirmation, notes",
        )
        .eq("family_id", id)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Commitment[];
    },
  });

  if (family.isPending) return <LoadingState rows={3} />;
  if (family.isError) return <ErrorState onRetry={() => void family.refetch()} />;
  if (!family.data) return <EmptyState title="Família não encontrada" />;

  const sit = FAMILY_SITUATIONS[family.data.situation];

  return (
    <div>
      <Link
        to="/familias"
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Todas as famílias
      </Link>

      <PageTitle
        title={family.data.name}
        description={`${family.data.contact_name ?? "Sem pessoa de referência"} · código interno ${family.data.internal_code} · acesso ${family.data.access_code}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge
              label={sit?.label ?? family.data.situation}
              tone={sit?.tone ?? "bg-muted text-muted-foreground"}
            />
            <NewCommitmentDialog familyId={id} />
          </div>
        }
      />

      <Tabs defaultValue="compromissos">
        <TabsList>
          <TabsTrigger value="compromissos">Compromissos</TabsTrigger>
          <TabsTrigger value="integrantes">Integrantes</TabsTrigger>
          <TabsTrigger value="ficha">Ficha</TabsTrigger>
        </TabsList>

        <TabsContent value="compromissos" className="mt-4">
          <SectionHeader title="Compromissos registrados" />
          <div className="mt-3 space-y-3">
            {commitments.isPending ? (
              <LoadingState rows={3} />
            ) : !commitments.data?.length ? (
              <EmptyState
                title="Nenhum compromisso ainda"
                description="Crie o primeiro compromisso para esta família."
              />
            ) : (
              commitments.data.map((c) => <CommitmentCard key={c.id} familyId={id} item={c} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="integrantes" className="mt-4">
          <MembersPanel familyId={id} />
        </TabsContent>

        <TabsContent value="ficha" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">Observações internas</p>
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
              {family.data.notes ?? "Sem observações registradas."}
            </p>
            <p className="mt-4 text-sm font-semibold">Acesso da família</p>
            <p className="text-sm text-muted-foreground">
              A família entra em <span className="font-mono">/familia</span> usando o código{" "}
              <span className="font-mono font-bold">{family.data.access_code}</span>.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
