export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Privacy policy
      </h1>
      <div className="mt-6 space-y-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
        <p>
          We store the account information, meals, foods, weight entries, and
          activity entries you enter so the app can show your history and
          progress.
        </p>
        <p>
          Meal photos you upload are stored so you can review them later and
          are only sent to an AI provider for analysis when you explicitly
          submit them. You can control how long meal images are kept in
          Settings, and you can request a full export or deletion of your
          data at any time.
        </p>
        <p>
          We do not send meal names, images, weight, or other private
          nutrition details to analytics tools. Only anonymous, aggregate
          product-usage events are recorded.
        </p>
        <p>
          If a real AI provider is enabled, only the minimum information
          needed to analyze a meal (the image and any optional note you add)
          is sent to that provider.
        </p>
      </div>
    </main>
  );
}
