import { PageHeader } from "@/components/layout/page-header";
import { FoodSearch } from "@/components/meal/food-search";

export default function SearchFoodPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Search food database" />
      <FoodSearch />
    </div>
  );
}
