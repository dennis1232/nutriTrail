"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createCustomFoodSchema,
  type CreateCustomFoodInput,
} from "@/server/validation/meal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MealItemsForm, type DraftMealItem } from "@/components/meal/meal-items-form";

export function CustomFoodForm() {
  const [cart, setCart] = useState<DraftMealItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CreateCustomFoodInput>({
    resolver: zodResolver(createCustomFoodSchema),
    defaultValues: {
      name: "",
      brand: "",
      caloriesPer100g: 0,
      proteinPer100g: 0,
      carbohydratesPer100g: 0,
      fatPer100g: 0,
      servingSizeGrams: 100,
      servingUnit: "g",
    },
  });

  function onAddToMeal(values: CreateCustomFoodInput) {
    setFormError(null);
    startTransition(async () => {
      const { createCustomFood } = await import("@/server/actions/meal-actions");
      const result = await createCustomFood(values);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      setCart((prev) => [
        ...prev,
        {
          key: `${result.data.foodId}-${Date.now()}`,
          foodId: result.data.foodId,
          displayName: values.name,
          caloriesPer100g: values.caloriesPer100g,
          proteinPer100g: values.proteinPer100g,
          carbohydratesPer100g: values.carbohydratesPer100g,
          fatPer100g: values.fatPer100g,
          baseGrams: values.servingSizeGrams ?? 100,
          unit: values.servingUnit ?? "g",
          quantity: 1,
        },
      ]);
      form.reset();
    });
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onAddToMeal)} className="space-y-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Food name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="caloriesPer100g"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calories / 100g</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="proteinPer100g"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Protein / 100g</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="carbohydratesPer100g"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carbs / 100g</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fatPer100g"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fat / 100g</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}
          <Button type="submit" variant="outline" className="w-full" disabled={isPending}>
            Add to meal
          </Button>
        </form>
      </Form>

      <MealItemsForm
        items={cart}
        onItemsChange={setCart}
        defaultName="Custom meal"
        sourceType="MANUAL"
      />
    </div>
  );
}
