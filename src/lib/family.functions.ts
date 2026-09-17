import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const codeSchema = z
  .string()
  .trim()
  .min(4)
  .max(16)
  .regex(/^[A-Za-z0-9-]+$/)
  .transform((s) => s.toUpperCase());

const idSchema = z.string().uuid();

type Admin = Awaited<ReturnType<typeof getAdmin>>;

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function resolveFamily(admin: Admin, code: string) {
  const { data, error } = await admin
    .from("families")
    .select("id, name, contact_name, internal_code, responsible_id, situation")
    .eq("access_code", code)
    .maybeSingle();
  if (error) throw new Error("Não foi possível validar o código agora.");
  if (!data) throw new Error("Código não encontrado. Confira com a equipe.");
  if (data.situation === "encerrada") throw new Error("Este acesso não está mais ativo.");
  return data;
}

async function markOverdue(admin: Admin, familyId: string) {
  const today = new Date().toISOString();
  await admin
    .from("commitments")
    .update({ status: "atrasado" })
    .eq("family_id", familyId)
    .in("status", ["pendente", "confirmado"])
    .lt("scheduled_at", today);
}

async function audit(
  admin: Admin,
  familyCode: string,
  action: string,
  entity: string,
  entityId: string | null,
) {
  await admin.from("aldeias_audit_logs").insert({
    actor_label: `familia:${familyCode}`,
    action,
    entity,
    entity_id: entityId,
  });
}

async function notifyTeam(
  admin: Admin,
  familyId: string,
  responsibleId: string | null,
  title: string,
  body: string,
) {
  if (!responsibleId) return;
  await admin.from("aldeias_notifications").insert({
    user_id: responsibleId,
    family_id: familyId,
    title,
    body,
    kind: "info",
  });
}

/** Valida o código de acesso da família e devolve o resumo dela. */
export const familyLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => ({ code: codeSchema.parse(data.code) }))
  .handler(async ({ data }) => {
    const admin = await getAdmin();
    const family = await resolveFamily(admin, data.code);
    await audit(admin, family.internal_code, "family_login", "families", family.id);
    return { id: family.id, name: family.name, contactName: family.contact_name };
  });

/** Compromissos e avisos da família. */
export const familyOverview = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => ({ code: codeSchema.parse(data.code) }))
  .handler(async ({ data }) => {
    const admin = await getAdmin();
    const family = await resolveFamily(admin, data.code);
    await markOverdue(admin, family.id);

    const { data: commitments } = await admin
      .from("commitments")
      .select("id, title, description, guidance, kind, scheduled_at, due_date, status, requires_confirmation")
      .eq("family_id", family.id)
      .neq("status", "cancelado")
      .order("scheduled_at", { ascending: true });

    const { data: notifications } = await admin
      .from("aldeias_notifications")
      .select("id, title, body, created_at")
      .eq("family_id", family.id)
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .limit(10);

    return {
      family: { id: family.id, name: family.name, contactName: family.contact_name },
      commitments: commitments ?? [],
      notifications: notifications ?? [],
    };
  });

/** A família responde um compromisso: consegui ou preciso de ajuda. */
export const familyRespond = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; commitmentId: string; answer: "done" | "help" }) => ({
    code: codeSchema.parse(data.code),
    commitmentId: idSchema.parse(data.commitmentId),
    answer: z.enum(["done", "help"]).parse(data.answer),
  }))
  .handler(async ({ data }) => {
    const admin = await getAdmin();
    const family = await resolveFamily(admin, data.code);

    const { data: commitment } = await admin
      .from("commitments")
      .select("id, title, status, responsible_id, family_id")
      .eq("id", data.commitmentId)
      .eq("family_id", family.id)
      .maybeSingle();
    if (!commitment) throw new Error("Compromisso não encontrado.");

    const status = data.answer === "done" ? "concluido" : "precisa_ajuda";
    await admin.from("commitments").update({ status }).eq("id", commitment.id);
    await admin.from("commitment_updates").insert({
      commitment_id: commitment.id,
      author_kind: "family",
      from_status: commitment.status,
      to_status: status,
      note: data.answer === "done" ? "A família informou que conseguiu." : "A família pediu ajuda.",
    });
    await notifyTeam(
      admin,
      family.id,
      commitment.responsible_id ?? family.responsible_id,
      data.answer === "done" ? "Compromisso concluído pela família" : "Família pediu ajuda",
      `${family.name}: ${commitment.title}`,
    );
    await admin.from("aldeias_notifications").insert({
      family_id: family.id,
      title: data.answer === "done" ? "Recebemos sua resposta" : "Sua equipe foi avisada",
      body:
        data.answer === "done"
          ? `Registramos que você concluiu: ${commitment.title}.`
          : `Você informou que precisa de ajuda com: ${commitment.title}. A equipe recebeu sua mensagem.`,
      kind: data.answer === "done" ? "success" : "warning",
    });
    await audit(
      admin,
      family.internal_code,
      data.answer === "done" ? "commitment_done" : "commitment_help",
      "commitments",
      commitment.id,
    );
    return { status };
  });

/** Conversa vinculada a um compromisso. */
export const familyMessages = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; commitmentId: string }) => ({
    code: codeSchema.parse(data.code),
    commitmentId: idSchema.parse(data.commitmentId),
  }))
  .handler(async ({ data }) => {
    const admin = await getAdmin();
    const family = await resolveFamily(admin, data.code);
    const { data: rows } = await admin
      .from("messages")
      .select("id, sender_kind, body, audio_path, audio_seconds, created_at")
      .eq("family_id", family.id)
      .eq("commitment_id", data.commitmentId)
      .order("created_at", { ascending: true })
      .limit(100);

    const messages = await Promise.all(
      (rows ?? []).map(async (m) => {
        let audioUrl: string | null = null;
        if (m.audio_path) {
          const { data: signed } = await admin.storage
            .from("media")
            .createSignedUrl(m.audio_path, 60 * 60);
          audioUrl = signed?.signedUrl ?? null;
        }
        return { ...m, audio_path: undefined, audioUrl };
      }),
    );
    return { messages };
  });

/** A família envia um recado em texto ou áudio. */
export const familySendMessage = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      code: string;
      commitmentId: string;
      body?: string | undefined;
      audioBase64?: string | undefined;
      seconds?: number | undefined;
    }) => ({
      code: codeSchema.parse(data.code),
      commitmentId: idSchema.parse(data.commitmentId),
      body: z.string().trim().max(1000).optional().parse(data.body || undefined),
      audioBase64: z.string().max(4_000_000).optional().parse(data.audioBase64 || undefined),
      seconds: z.number().int().min(0).max(300).optional().parse(data.seconds),
    }),
  )
  .handler(async ({ data }) => {
    if (!data.body && !data.audioBase64) throw new Error("Escreva ou grave uma mensagem.");
    const admin = await getAdmin();
    const family = await resolveFamily(admin, data.code);

    const { data: commitment } = await admin
      .from("commitments")
      .select("id, title, responsible_id")
      .eq("id", data.commitmentId)
      .eq("family_id", family.id)
      .maybeSingle();
    if (!commitment) throw new Error("Compromisso não encontrado.");

    let audioPath: string | null = null;
    if (data.audioBase64) {
      const raw = data.audioBase64.includes(",")
        ? data.audioBase64.slice(data.audioBase64.indexOf(",") + 1)
        : data.audioBase64;
      const binary = atob(raw);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      if (bytes.length > 3_000_000) throw new Error("O áudio ficou muito grande. Grave um mais curto.");
      audioPath = `familias/${family.id}/${crypto.randomUUID()}.webm`;
      const { error } = await admin.storage
        .from("media")
        .upload(audioPath, bytes, { contentType: "audio/webm" });
      if (error) throw new Error("Não foi possível enviar o áudio.");
    }

    await admin.from("messages").insert({
      family_id: family.id,
      commitment_id: commitment.id,
      sender_kind: "family",
      body: data.body ?? null,
      audio_path: audioPath,
      audio_seconds: data.seconds ?? null,
    });
    await notifyTeam(
      admin,
      family.id,
      commitment.responsible_id ?? family.responsible_id,
      "Nova mensagem da família",
      `${family.name}: ${commitment.title}`,
    );
    await audit(admin, family.internal_code, "family_message", "messages", commitment.id);
    return { ok: true };
  });
