import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, HelpCircle, LogOut, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AudioRecorder, type Recorded } from "@/components/audio";
import { BrandLogo } from "@/components/brand-logo";
import { CommitmentKindIcon } from "@/components/commitment-kind";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  familyLogin,
  familyMessages,
  familyOverview,
  familyRespond,
  familySendMessage,
} from "@/lib/family.functions";
import { formatDateTime, formatLongDate, timeAgo } from "@/lib/format";
import { statusMeta } from "@/lib/aldeias";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "aldeias.family.code";

export const Route = createFileRoute("/familia")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Área da família — Aldeias Acompanha" },
      {
        name: "description",
        content: "Entre com o código da sua família para ver seus compromissos, ouvir orientações e responder.",
      },
      { property: "og:title", content: "Área da família — Aldeias Acompanha" },
      { property: "og:description", content: "Veja seus compromissos e fale com a equipe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FamilyPortal,
});

function toBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler o áudio."));
    reader.readAsDataURL(blob);
  });
}

function FamilyPortal() {
  const [code, setCode] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setCode(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  function exit() {
    window.localStorage.removeItem(STORAGE_KEY);
    setCode(null);
    setOpenId(null);
  }

  if (!code) return <CodeForm onDone={(c) => setCode(c)} />;
  if (openId)
    return <CommitmentDetail code={code} commitmentId={openId} onBack={() => setOpenId(null)} />;
  return <FamilyHome code={code} onOpen={setOpenId} onExit={exit} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 pb-16 pt-6 text-[17px] leading-relaxed">{children}</div>
    </div>
  );
}

function CodeForm({ onDone }: { onDone: (code: string) => void }) {
  const [value, setValue] = useState("");
  const login = useServerFn(familyLogin);
  const mutation = useMutation({
    mutationFn: (c: string) => login({ data: { code: c } }),
    onSuccess: (_res, c) => {
      window.localStorage.setItem(STORAGE_KEY, c.trim().toUpperCase());
      onDone(c.trim().toUpperCase());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Shell>
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <BrandLogo className="mt-6 max-w-[15rem] rounded-md shadow-card" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Área da família</h1>
      <p className="mt-2 text-muted-foreground">
        Digite o código que a equipe da instituição entregou para você.
      </p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim().length < 4) {
            toast.error("Digite o código completo.");
            return;
          }
          mutation.mutate(value);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="codigo" className="text-base">
            Seu código de acesso
          </Label>
          <Input
            id="codigo"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder="EX: ALD-2451"
            autoComplete="one-time-code"
            className="h-16 rounded-2xl text-center text-2xl font-bold tracking-widest"
          />
        </div>
        <Button type="submit" className="h-16 w-full rounded-2xl text-lg" disabled={mutation.isPending}>
          {mutation.isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Não tem o código? Fale com a profissional que acompanha a sua família.
      </p>
    </Shell>
  );
}

function FamilyHome({
  code,
  onOpen,
  onExit,
}: {
  code: string;
  onOpen: (id: string) => void;
  onExit: () => void;
}) {
  const overview = useServerFn(familyOverview);
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["family-overview", code],
    queryFn: () => overview({ data: { code } }),
    retry: false,
  });

  useEffect(() => {
    if (isError) toast.error((error as Error).message);
  }, [isError, error]);

  if (isError)
    return (
      <Shell>
        <EmptyState
          title="Não conseguimos abrir seus dados"
          description={(error as Error).message}
          action={
            <Button onClick={onExit} className="h-12 rounded-2xl">
              Usar outro código
            </Button>
          }
        />
      </Shell>
    );

  if (isPending)
    return (
      <Shell>
        <LoadingState />
      </Shell>
    );

  const open = data.commitments.filter((c) => c.status !== "concluido" && c.status !== "cancelado");
  const done = data.commitments.filter((c) => c.status === "concluido");

  return (
    <Shell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Olá,</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {data.family.contactName ?? data.family.name}
          </h1>
        </div>
        <Button variant="ghost" size="icon" aria-label="Sair" onClick={onExit}>
          <LogOut className="size-5" />
        </Button>
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-bold">O que você precisa fazer</h2>
        {!open.length ? (
          <EmptyState title="Tudo em dia" description="Nenhum compromisso aberto no momento." />
        ) : (
          open.map((c) => {
            const meta = statusMeta(c.status);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onOpen(c.id)}
                className="w-full rounded-2xl border border-border bg-card p-5 text-left shadow-card transition-colors hover:border-primary/40"
              >
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <span className={cn("size-2 rounded-full", meta.dot)} />
                  {meta.familyLabel}
                </span>
                <span className="mt-3 flex items-center gap-3">
                  <CommitmentKindIcon kind={c.kind} />
                  <span>
                    <span className="block text-lg font-bold">{c.title}</span>
                    <span className="block text-sm text-muted-foreground">
                      {formatLongDate(c.scheduled_at)} às {formatDateTime(c.scheduled_at).split("às")[1]?.trim()}
                    </span>
                  </span>
                </span>
              </button>
            );
          })
        )}
      </section>

      {data.notifications.length ? (
        <section className="mt-8 space-y-2">
          <h2 className="text-lg font-bold">Avisos</h2>
          {data.notifications.map((n) => (
            <div key={n.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-semibold">{n.title}</p>
              {n.body ? <p className="text-sm text-muted-foreground">{n.body}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
            </div>
          ))}
        </section>
      ) : null}

      {done.length ? (
        <section className="mt-8 space-y-2">
          <h2 className="text-lg font-bold">Já concluídos</h2>
          {done.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onOpen(c.id)}
              className="flex w-full items-center gap-2 rounded-2xl border border-border bg-card p-4 text-left"
            >
              <CommitmentKindIcon kind={c.kind} className="[&>span]:size-8 [&_svg]:size-4" />
              <span className="font-semibold">{c.title}</span>
            </button>
          ))}
        </section>
      ) : null}
    </Shell>
  );
}

function CommitmentDetail({
  code,
  commitmentId,
  onBack,
}: {
  code: string;
  commitmentId: string;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const overview = useServerFn(familyOverview);
  const listMessages = useServerFn(familyMessages);
  const respond = useServerFn(familyRespond);
  const send = useServerFn(familySendMessage);

  const [text, setText] = useState("");
  const [audio, setAudio] = useState<Recorded | null>(null);

  const { data } = useQuery({
    queryKey: ["family-overview", code],
    queryFn: () => overview({ data: { code } }),
    retry: false,
  });
  const messages = useQuery({
    queryKey: ["family-messages", code, commitmentId],
    queryFn: () => listMessages({ data: { code, commitmentId } }),
    retry: false,
  });

  const commitment = data?.commitments.find((c) => c.id === commitmentId);

  const answer = useMutation({
    mutationFn: (a: "done" | "help") => respond({ data: { code, commitmentId, answer: a } }),
    onSuccess: (_r, a) => {
      toast.success(a === "done" ? "Obrigado! Registramos sua resposta." : "A equipe foi avisada.");
      void queryClient.invalidateQueries({ queryKey: ["family-overview", code] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMsg = useMutation({
    mutationFn: async () => {
      const audioBase64 = audio ? await toBase64(audio.blob) : undefined;
      return send({
        data: {
          code,
          commitmentId,
          body: text.trim() || undefined,
          audioBase64,
          seconds: audio?.seconds,
        },
      });
    },
    onSuccess: () => {
      setText("");
      setAudio(null);
      toast.success("Mensagem enviada.");
      void queryClient.invalidateQueries({ queryKey: ["family-messages", code, commitmentId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Shell>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Voltar
      </button>

      {!commitment ? (
        <LoadingState rows={1} />
      ) : (
        <>
          <div className="mt-6 flex items-center gap-3">
            <CommitmentKindIcon kind={commitment.kind} />
            <h1 className="text-2xl font-bold tracking-tight">{commitment.title}</h1>
          </div>
          <p className="mt-1 text-muted-foreground">{formatDateTime(commitment.scheduled_at)}</p>
          {commitment.description ? <p className="mt-4">{commitment.description}</p> : null}
          {commitment.guidance ? (
            <div className="mt-4 rounded-2xl bg-primary-soft/60 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-primary-soft-foreground">
                Orientação
              </p>
              <p className="mt-1">{commitment.guidance}</p>
            </div>
          ) : null}

          <div className="mt-8 grid gap-3">
            <Button
              className="h-16 rounded-2xl text-lg"
              disabled={answer.isPending}
              onClick={() => answer.mutate("done")}
            >
              <CheckCircle2 className="mr-2 size-6" /> Já consegui
            </Button>
            <Button
              variant="outline"
              className="h-16 rounded-2xl border-destructive/40 text-lg text-destructive"
              disabled={answer.isPending}
              onClick={() => answer.mutate("help")}
            >
              <HelpCircle className="mr-2 size-6" /> Preciso de ajuda
            </Button>
          </div>
        </>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-bold">Conversa com a equipe</h2>
        <div className="mt-3 space-y-2">
          {!messages.data?.messages.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
          ) : (
            messages.data.messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "rounded-2xl p-4",
                  m.sender_kind === "family"
                    ? "ml-6 bg-primary-soft/60"
                    : "mr-6 border border-border bg-card",
                )}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {m.sender_kind === "family" ? "Você" : "Equipe"} · {timeAgo(m.created_at)}
                </p>
                {m.body ? <p className="mt-1">{m.body}</p> : null}
                {m.audioUrl ? (
                  <audio controls src={m.audioUrl} className="mt-2 w-full">
                    <track kind="captions" />
                  </audio>
                ) : null}
              </div>
            ))
          )}
        </div>

        <div className="mt-5 space-y-3">
          <Label htmlFor="mensagem" className="text-base">
            Escreva ou grave um recado
          </Label>
          <Textarea
            id="mensagem"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={1000}
            className="rounded-2xl text-base"
            placeholder="Conte para a equipe como está indo."
          />
          <AudioRecorder value={audio} onChange={setAudio} big />
          <Button
            className="h-14 w-full rounded-2xl text-base"
            disabled={sendMsg.isPending}
            onClick={() => sendMsg.mutate()}
          >
            <Send className="mr-2 size-5" /> Enviar
          </Button>
        </div>
      </section>
    </Shell>
  );
}
