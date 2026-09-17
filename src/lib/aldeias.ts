export const COMMITMENT_STATUS: Record<
  string,
  { label: string; tone: string; dot: string; familyLabel: string }
> = {
  pendente: {
    label: "Pendente",
    tone: "bg-warning-soft text-warning-foreground",
    dot: "bg-warning",
    familyLabel: "Para fazer",
  },
  confirmado: {
    label: "Confirmado",
    tone: "bg-info-soft text-info",
    dot: "bg-info",
    familyLabel: "Combinado",
  },
  concluido: {
    label: "Concluído",
    tone: "bg-primary-soft text-primary-soft-foreground",
    dot: "bg-primary",
    familyLabel: "Feito",
  },
  atrasado: {
    label: "Atrasado",
    tone: "bg-destructive-soft text-destructive",
    dot: "bg-destructive",
    familyLabel: "Passou do prazo",
  },
  reagendado: {
    label: "Reagendado",
    tone: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
    familyLabel: "Remarcado",
  },
  cancelado: {
    label: "Cancelado",
    tone: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
    familyLabel: "Cancelado",
  },
  precisa_ajuda: {
    label: "Precisa de ajuda",
    tone: "bg-destructive text-destructive-foreground",
    dot: "bg-destructive",
    familyLabel: "Você pediu ajuda",
  },
};

export const STATUS_ORDER = [
  "pendente",
  "confirmado",
  "concluido",
  "atrasado",
  "reagendado",
  "cancelado",
  "precisa_ajuda",
] as const;

export const OPEN_STATUSES = ["pendente", "confirmado", "atrasado", "precisa_ajuda"] as const;

export const PRIORITIES: Record<string, { label: string; tone: string }> = {
  baixa: { label: "Baixa", tone: "bg-muted text-muted-foreground" },
  media: { label: "Média", tone: "bg-info-soft text-info" },
  alta: { label: "Alta", tone: "bg-destructive-soft text-destructive" },
};

export const COMMITMENT_KINDS = [
  { value: "acompanhamento", label: "Acompanhamento" },
  { value: "consulta", label: "Consulta" },
  { value: "matricula", label: "Matrícula" },
  { value: "documentacao", label: "Documentação" },
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "visita", label: "Visita" },
  { value: "encaminhamento", label: "Encaminhamento" },
  { value: "reuniao", label: "Reunião" },
  { value: "outro", label: "Outro" },
] as const;

export const FAMILY_SITUATIONS: Record<string, { label: string; tone: string }> = {
  ativa: { label: "Ativa", tone: "bg-primary-soft text-primary-soft-foreground" },
  intensivo: { label: "Acompanhamento intensivo", tone: "bg-warning-soft text-warning-foreground" },
  suspensa: { label: "Suspensa", tone: "bg-muted text-muted-foreground" },
  encerrada: { label: "Encerrada", tone: "bg-muted text-muted-foreground" },
};

export const STAFF_ROLES: Record<string, string> = {
  admin: "Administrador",
  professional: "Profissional",
  coordination: "Coordenação",
};

export function statusMeta(status: string) {
  return (
    COMMITMENT_STATUS[status] ?? {
      label: status,
      tone: "bg-muted text-muted-foreground",
      dot: "bg-muted-foreground",
      familyLabel: status,
    }
  );
}
