import { PageHeader } from "@/components/layout/page-header";
import { AiPhotoAnalyzer } from "@/components/meal/ai-photo-analyzer";

export default function AiPhotoPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Analyze meal photo" />
      <AiPhotoAnalyzer />
    </div>
  );
}
