import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const signedCache = new Map<string, string>();

/** Renderiza uma imagem guardada no armazenamento privado do app. */
export function MediaImage({
  path,
  alt,
  className,
  fallbackClassName,
}: {
  path?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [url, setUrl] = useState<string | null>(path ? (signedCache.get(path) ?? null) : null);

  useEffect(() => {
    let active = true;
    if (!path) {
      setUrl(null);
      return;
    }
    if (path.startsWith("http")) {
      setUrl(path);
      return;
    }
    const cached = signedCache.get(path);
    if (cached) {
      setUrl(cached);
      return;
    }
    void supabase.storage
      .from("media")
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (!active || !data?.signedUrl) return;
        signedCache.set(path, data.signedUrl);
        setUrl(data.signedUrl);
      });
    return () => {
      active = false;
    };
  }, [path]);

  if (!url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          fallbackClassName ?? className,
        )}
        aria-hidden="true"
      >
        <ImageIcon className="size-6" />
      </div>
    );
  }
  return <img src={url} alt={alt} loading="lazy" className={className} />;
}

/** Campo de upload de uma foto para o armazenamento privado. */
export function MediaUpload({
  value,
  onChange,
  label = "Foto",
}: {
  value: string | null;
  onChange: (path: string | null) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem precisa ter no máximo 10 MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Envie um arquivo de imagem.");
      return;
    }
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setBusy(false);
      toast.error("Sessão expirada. Entre novamente.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${uid}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível enviar a imagem.");
      return;
    }
    onChange(path);
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-border">
          <MediaImage path={value} alt={label} className="h-40 w-full object-cover" />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-2 top-2 size-8"
            onClick={() => onChange(null)}
            aria-label="Remover imagem"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
          {busy ? "Enviando..." : "Escolher imagem (até 10 MB)"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
