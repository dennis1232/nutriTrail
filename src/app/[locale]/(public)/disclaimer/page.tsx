export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        General wellness disclaimer
      </h1>
      <div className="mt-6 space-y-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
        <p>
          NutriTrail is intended for general wellness and informational
          purposes only. It is designed to help adult users log meals and
          activity and observe patterns over time.
        </p>
        <p>
          Nothing in this application constitutes medical advice, a
          diagnosis, or a treatment plan. Calorie and macronutrient targets
          shown during onboarding are rough estimates based on standard,
          publicly documented formulas — they are not personalized medical
          guidance.
        </p>
        <p>
          Estimates produced from meal photos are approximate and may be
          inaccurate. You are always shown the detected foods and quantities
          before anything is saved, and you are responsible for correcting
          them.
        </p>
        <p>
          If you have a medical condition, an eating disorder, or specific
          nutritional needs, please consult a licensed physician or
          registered dietitian before making decisions based on this app.
        </p>
        <p>This application is intended for adult users (18+) only.</p>
      </div>
    </main>
  );
}
