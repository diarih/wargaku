import Image from "next/image";
import Link from "next/link";

import { cn } from "~/lib/utils";

type AppLogoProps = {
  href?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-8 w-auto",
  md: "h-10 w-auto",
  lg: "h-14 w-auto",
} as const;

export function AppLogo({
  href,
  className,
  imageClassName,
  priority = false,
  size = "md",
}: AppLogoProps) {
  const image = (
    <Image
      src="/wargaku-logo.PNG"
      alt="WargaKu"
      width={270}
      height={196}
      priority={priority}
      className={cn(sizeClasses[size], imageClassName)}
    />
  );

  if (!href) {
    return <div className={className}>{image}</div>;
  }

  return (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      {image}
    </Link>
  );
}
