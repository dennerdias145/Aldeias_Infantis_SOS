import logoAsset from "@/assets/logo-aldeias-infantis-sos.png.asset.json";
import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Aldeias Infantis SOS"
      className={cn("block h-auto w-full", className)}
    />
  );
}