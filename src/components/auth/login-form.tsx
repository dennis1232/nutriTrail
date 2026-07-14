"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

import { loginSchema, type LoginInput } from "@/server/validation/auth";
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
import { Separator } from "@/components/ui/separator";
import { useRouter } from "@/i18n/navigation";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isMagicLinkPending, startMagicLinkTransition] = useTransition();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setFormError(t("error_invalid_credentials"));
        return;
      }

      router.push("/today");
      router.refresh();
    });
  }

  function onMagicLinkSubmit() {
    startMagicLinkTransition(async () => {
      await signIn("nodemailer", { email: magicLinkEmail, redirect: false });
      setMagicLinkSent(true);
    });
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isPending}>
            {t("submit_login")}
          </Button>
        </form>
      </Form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-zinc-500">
          {t("or_continue_with")}
        </span>
        <Separator className="flex-1" />
      </div>

      <div className="space-y-3">
        <Input
          type="email"
          placeholder={t("email")}
          value={magicLinkEmail}
          onChange={(event) => setMagicLinkEmail(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={!magicLinkEmail || isMagicLinkPending}
          onClick={onMagicLinkSubmit}
        >
          {t("magic_link_button")}
        </Button>
        {magicLinkSent ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("magic_link_sent", { email: magicLinkEmail })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
