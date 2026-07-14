export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Terms of service
      </h1>
      <div className="mt-6 space-y-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
        <p>
          NutriTrail is provided for general wellness tracking by adult
          users (18 years or older). By creating an account you confirm you
          meet this age requirement.
        </p>
        <p>
          The app provides estimates, not medical advice. You are
          responsible for reviewing and correcting any AI-generated or
          externally-sourced nutrition data before relying on it.
        </p>
        <p>
          You may delete your account and associated data at any time from
          Settings. Continued use of the service is subject to these terms
          being updated from time to time.
        </p>
      </div>
    </main>
  );
}
