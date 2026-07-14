import { PageHeader } from "@/components/layout/page-header";
import { CustomFoodForm } from "@/components/meal/custom-food-form";

export default function ManualFoodPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Create custom food" />
      <CustomFoodForm />
    </div>
  );
}
