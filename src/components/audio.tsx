import { Mic, Play, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { seconds as fmtSeconds } from "@/lib/format";
import { cn } from "@/lib/utils";

export type Recorded = { blob: Blob; seconds: number; url: string };

/** Gravador de áudio simples e acessível: gravar, ouvir, excluir. */
export function AudioRecorder({
  onChange,
  value,
  big = false,
}: {
  value: Recorded | null;
  onChange: (v: Recorded | null) => void;
  big?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        onChange({ blob, seconds: elapsedRef.current, url: URL.createObjectURL(blob) });
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setElapsed(0);
      elapsedRef.current = 0;
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
        if (elapsedRef.current >= 120) stop();
      }, 1000);
    } catch {
      toast.error("Não conseguimos usar o microfone. Verifique a permissão do navegador.");
    }
  }

  const elapsedRef = useRef(0);

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <audio controls src={value.url} className="h-10 flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(null)}
          aria-label="Excluir áudio gravado"
        >
          <Trash2 className="size-5" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant={recording ? "destructive" : "outline"}
      onClick={() => (recording ? stop() : void start())}
      className={cn("w-full gap-2", big && "h-16 rounded-2xl text-base font-bold")}
    >
      {recording ? <Square className="size-5" /> : <Mic className="size-5" />}
      <span>{recording ? `Gravando ${fmtSeconds(elapsed)} — tocar para parar` : "Gravar áudio"}</span>
    </Button>
  );
}

/** Reproduz um áudio guardado no armazenamento privado (equipe). */
export function StoredAudio({ path, label = "Ouvir áudio" }: { path: string; label?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60);
    setLoading(false);
    if (data?.signedUrl) setUrl(data.signedUrl);
    else toast.error("Não foi possível carregar o áudio.");
  }

  if (url) return <audio controls src={url} className="h-10 w-full max-w-xs" />;
  return (
    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void load()}>
      <Play className="size-4" />
      {loading ? "Carregando..." : label}
    </Button>
  );
}
