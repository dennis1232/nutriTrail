import { PageHeader } from "@/components/layout/page-header";
import { BarcodeEntry } from "@/components/meal/barcode-entry";

export default function BarcodePage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Scan or enter barcode" />
      <BarcodeEntry />
    </div>
  );
}
