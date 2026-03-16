import Image from "next/image";

import { cn } from "~/lib/utils";

type InitialsAvatarProps = {
  seed: string | null | undefined;
  alt: string;
  src: string;
  className?: string;
};

export function InitialsAvatar({
  seed,
  alt,
  src,
  className,
}: InitialsAvatarProps) {
  return (
    <div
      className={cn(
        "bg-muted relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/70 shadow-sm",
        className,
      )}
      aria-label={seed?.trim() ?? alt}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="48px"
        unoptimized
        className="object-cover"
      />
    </div>
  );
}
