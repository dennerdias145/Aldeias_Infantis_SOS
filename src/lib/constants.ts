export const CAMPAIGN_CATEGORIES = [
  "Saúde",
  "Alimentação",
  "Evento comunitário",
  "Infraestrutura",
  "Animais",
  "Educação",
  "Solidariedade",
  "Outros",
] as const;

export const CAMPAIGN_STATUS: Record<string, { label: string; tone: string }> = {
  rascunho: { label: "Rascunho", tone: "bg-muted text-muted-foreground" },
  em_analise: { label: "Em análise", tone: "bg-warning-soft text-warning-foreground" },
  ativa: { label: "Ativa", tone: "bg-primary-soft text-primary-soft-foreground" },
  concluida: { label: "Concluída", tone: "bg-info-soft text-info" },
  cancelada: { label: "Cancelada", tone: "bg-destructive-soft text-destructive" },
  encerrada: { label: "Encerrada", tone: "bg-muted text-muted-foreground" },
};

export const CONTRIBUTION_STATUS: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

export const FOOD_CATEGORIES = [
  "Cesta básica",
  "Arroz",
  "Feijão",
  "Leite",
  "Macarrão",
  "Alimentos não perecíveis",
  "Outros",
] as const;

export const CLOTHES_CATEGORIES = [
  "Infantil",
  "Masculino",
  "Feminino",
  "Bebê",
  "Calçados",
  "Outros",
] as const;

export const DONATION_STATUS: Record<string, { label: string; tone: string }> = {
  disponivel: { label: "Disponível", tone: "bg-primary-soft text-primary-soft-foreground" },
  reservada: { label: "Reservada", tone: "bg-warning-soft text-warning-foreground" },
  concluida: { label: "Concluída", tone: "bg-info-soft text-info" },
  cancelada: { label: "Cancelada", tone: "bg-muted text-muted-foreground" },
  bloqueada: { label: "Bloqueada", tone: "bg-destructive-soft text-destructive" },
};

export const REQUEST_STATUS: Record<string, string> = {
  pending: "Pendente",
  approved: "Aceita",
  rejected: "Recusada",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export const PET_SPECIES = [
  { value: "cachorro", label: "Cachorro" },
  { value: "gato", label: "Gato" },
  { value: "ave", label: "Ave" },
  { value: "outro", label: "Outro" },
] as const;

export const PET_SIZES = ["Pequeno", "Médio", "Grande"] as const;

export const MISSING_STATUS: Record<string, { label: string; tone: string }> = {
  desaparecido: { label: "Desaparecido", tone: "bg-destructive text-destructive-foreground" },
  encontrado: { label: "Encontrado", tone: "bg-primary-soft text-primary-soft-foreground" },
  encerrado: { label: "Encerrado", tone: "bg-muted text-muted-foreground" },
  bloqueado: { label: "Bloqueado", tone: "bg-destructive-soft text-destructive" },
};

export const SERVICE_CATEGORIES = [
  "Eletricista",
  "Encanador",
  "Pedreiro",
  "Pintor",
  "Diarista",
  "Informática",
  "Mecânico",
  "Cabeleireiro",
  "Manicure",
  "Cuidador",
  "Entregador",
  "Outros",
] as const;

export const PROVIDER_STATUS: Record<string, { label: string; tone: string }> = {
  em_analise: { label: "Em análise", tone: "bg-warning-soft text-warning-foreground" },
  ativo: { label: "Ativo", tone: "bg-primary-soft text-primary-soft-foreground" },
  inativo: { label: "Inativo", tone: "bg-muted text-muted-foreground" },
  bloqueado: { label: "Bloqueado", tone: "bg-destructive-soft text-destructive" },
};

export const DEMAND_CATEGORIES = [
  "Iluminação",
  "Infraestrutura",
  "Limpeza",
  "Meio ambiente",
  "Acessibilidade",
  "Trânsito",
  "Segurança percebida",
  "Outros",
] as const;

export const DEMAND_STATUS: Record<string, { label: string; tone: string }> = {
  registrada: { label: "Registrada", tone: "bg-muted text-muted-foreground" },
  em_analise: { label: "Em análise", tone: "bg-warning-soft text-warning-foreground" },
  em_andamento: { label: "Em andamento", tone: "bg-info-soft text-info" },
  resolvida: { label: "Resolvida", tone: "bg-primary-soft text-primary-soft-foreground" },
  arquivada: { label: "Arquivada", tone: "bg-muted text-muted-foreground" },
};

export const REPORT_CATEGORIES = [
  "Iluminação e segurança percebida",
  "Descarte irregular",
  "Situação de risco",
  "Maus-tratos a animais",
  "Vulnerabilidade social",
  "Outros",
] as const;

export const REPORT_STATUS: Record<string, string> = {
  recebido: "Recebido",
  em_analise: "Em análise",
  encaminhado: "Encaminhado",
  encerrado: "Encerrado",
};

export const RELATIONSHIPS = [
  "Esposa",
  "Marido",
  "Filho",
  "Filha",
  "Pai",
  "Mãe",
  "Avó",
  "Avô",
  "Outro",
] as const;

export const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR",
  "PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;
