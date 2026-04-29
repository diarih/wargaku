import { Card, CardContent, CardHeader } from "~/components/ui/card";

import { SectionHeading } from "~/components/dashboard/section-heading";

type DetailGroupRow = {
  label: string;
  value: string;
};

type DetailGroupProps = {
  title: string;
  description?: string;
  rows: DetailGroupRow[];
  headingLevel?: "h2" | "h3";
};

export function DetailGroup({
  title,
  description,
  rows,
  headingLevel = "h2",
}: DetailGroupProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <SectionHeading
          title={title}
          description={description}
          as={headingLevel}
        />
      </CardHeader>
      <CardContent>
        <dl>
          {rows.map((row, index) => (
            <div
              key={`${row.label}-${index}`}
              className="flex flex-col gap-1 border-b py-3 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
            >
              <dt className="text-muted-foreground text-sm">{row.label}</dt>
              <dd className="text-sm font-medium sm:max-w-[60%] sm:text-right">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
