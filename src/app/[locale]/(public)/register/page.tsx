import { getTranslations } from "next-intl/server";

import { RegisterForm } from "@/components/auth/register-form";
import { Link } from "@/i18n/navigation";

export default async function RegisterPage() {
  const t = await getTranslations("auth");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {t("register_title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("register_subtitle")}
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {t("have_account")}{" "}
          <Link href="/login" className="font-medium underline">
            {t("submit_login")}
          </Link>
        </p>
      </div>
    </main>
  );
}
