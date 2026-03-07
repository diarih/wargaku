import { Search } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          Pencarian Data
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gunakan fitur ini untuk mencari NIK, No KK, atau nama warga dengan
          cepat.
        </p>
      </section>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="size-4" />
            Fitur pencarian lanjutan sedang disiapkan
          </CardTitle>
          <CardDescription>
            Pada iterasi berikutnya, halaman ini akan mendukung query cepat,
            filter wilayah, dan akses langsung ke detail warga/KK.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Sementara ini gunakan menu <strong>Kartu Keluarga</strong> untuk
          menelusuri data penduduk yang sudah masuk.
        </CardContent>
      </Card>
    </div>
  );
}
