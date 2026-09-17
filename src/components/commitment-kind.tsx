import {
  CalendarCheck2,
  ClipboardList,
  FileText,
  GraduationCap,
  HeartPulse,
  MapPinHouse,
  Route,
  School,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

import { COMMITMENT_KINDS } from "@/lib/aldeias";
import { cn } from "@/lib/utils";

const KIND_ICONS: Record<string, LucideIcon> = {
  acompanhamento: ClipboardList,
  consulta: Stethoscope,
  matricula: School,
  documentacao: FileText,
  saude: HeartPulse,
  educacao: GraduationCap,
  visita: MapPinHouse,
  encaminhamento: Route,
  reuniao: Users,
  outro: CalendarCheck2,
};

export function commitmentKindMeta(kind: string) {
  const item = COMMITMENT_KINDS.find((option) => option.value === kind);
  return {
    label: item?.label ?? "Compromisso",
    Icon: KIND_ICONS[kind] ?? CalendarCheck2,
  };
}

export function CommitmentKindIcon({
  kind,
  showLabel = false,
  className,
}: {
  kind: string;
  showLabel?: boolean;
  className?: string;
}) {
  const { Icon, label } = commitmentKindMeta(kind);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary",
        className,
      )}
      title={label}
      aria-label={`Tipo: ${label}`}
    >
      <span className="grid size-9 place-items-center rounded-lg bg-primary-soft">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      {showLabel ? <span>{label}</span> : null}
    </span>
  );
}