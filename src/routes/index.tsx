import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { HeartHandshake } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aldeias Acompanha — acesso" },
      {
        name: "description",
        content:
          "Entre com sua conta da equipe ou, se você é família acompanhada, use seu código de acesso.",
      },
      { property: "og:title", content: "Aldeias Acompanha — acesso" },
      {
        property: "og:description",
        content: "Acesso da equipe e das famílias acompanhadas pela instituição.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

const emailSchema = z.string().trim().email("Informe um e-mail válido").max(255);

function Landing() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/painel", replace: true });
  }, [loading, session, navigate]);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(form.get("email"));
    const password = z.string().min(1).safeParse(form.get("password"));
    if (!email.success || !password.success) {
      toast.error("Informe e-mail e senha.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.data,
      password: password.data,
    });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível entrar. Confira os dados e tente novamente.");
      return;
    }
    void navigate({ to: "/painel", replace: true });
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <BrandLogo className="max-w-[17rem] rounded-md shadow-card" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Aldeias Acompanha</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhamento de compromissos entre a equipe e as famílias.
            </p>
          </div>
        </div>

        <Button
          asChild
          size="lg"
          className="h-16 w-full rounded-lg bg-success text-lg font-bold text-success-foreground shadow-raised hover:bg-success/90"
        >
          <Link to="/familia">
            <HeartHandshake className="size-6" />
            Sou família — entrar com meu código
          </Link>
        </Button>


        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Equipe
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold">Entrar como equipe</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Área de profissionais, coordenação e administração.
          </p>

          <form className="mt-5 space-y-4" onSubmit={signIn}>
            <div className="space-y-1.5">
              <Label htmlFor="login-email">E-mail institucional</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">Senha</Label>
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-12 text-base"
              />
            </div>
            <Button type="submit" className="h-12 w-full text-base" disabled={busy}>
              Entrar
            </Button>
          </form>

        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          O cadastro da equipe é feito pela administração da instituição.
        </p>
      </div>
    </div>
  );
}
