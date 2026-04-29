type SectionHeadingProps = {
  title: string;
  description?: string;
  as?: "h2" | "h3";
};

export function SectionHeading({
  title,
  description,
  as = "h2",
}: SectionHeadingProps) {
  const Heading = as;

  return (
    <div className="space-y-1">
      <Heading className="text-base leading-snug font-medium">{title}</Heading>
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
    </div>
  );
}
