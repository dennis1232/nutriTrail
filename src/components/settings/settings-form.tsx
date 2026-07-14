"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import {
  Activity,
  Download,
  Flame,
  Globe,
  LogOut,
  Ruler,
  Trash2,
  UserRound,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateTargetsAction,
  updatePreferencesAction,
  deleteAccountAction,
  exportUserDataAction,
} from "@/server/actions/settings-actions";
import { useRouter } from "@/i18n/navigation";

type SettingsFormProps = {
  email: string;
  name: string;
  preferredLocale: "en" | "he";
  unitSystem: "METRIC" | "IMPERIAL";
  includeActivityCalories: boolean;
  targets: {
    dailyCalorieTarget: number;
    proteinTargetGrams: number;
    carbohydrateTargetGrams: number;
    fatTargetGrams: number;
  };
};

export function SettingsForm(props: SettingsFormProps) {
  const router = useRouter();
  const [targets, setTargets] = useState(props.targets);
  const [locale, setLocale] = useState(props.preferredLocale);
  const [units, setUnits] = useState(props.unitSystem);
  const [includeActivity, setIncludeActivity] = useState(
    props.includeActivityCalories,
  );
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function saveTargets() {
    startTransition(async () => {
      const result = await updateTargetsAction(targets);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Targets updated");
      router.refresh();
    });
  }

  function savePreferences() {
    startTransition(async () => {
      const result = await updatePreferencesAction({
        preferredLocale: locale,
        unitSystem: units,
        includeActivityCalories: includeActivity,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Preferences updated");
      router.replace("/settings", { locale });
      router.refresh();
    });
  }

  function onExport() {
    startTransition(async () => {
      const result = await exportUserDataAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const blob = new Blob([result.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nutritrail-export.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function onDeleteAccount() {
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      await signOut({ redirect: false });
      router.push("/");
    });
  }

  return (
    <div className="space-y-4">
      <SettingsCard>
        <SettingsRow icon={UserRound} title={props.name || "Profile"}>
          <p className="text-sm text-zinc-500">{props.email}</p>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard>
        <SettingsRow icon={Flame} title="Nutrition targets">
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Calories</Label>
              <Input
                type="number"
                value={targets.dailyCalorieTarget}
                onChange={(e) =>
                  setTargets({ ...targets, dailyCalorieTarget: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Protein (g)</Label>
              <Input
                type="number"
                value={targets.proteinTargetGrams}
                onChange={(e) =>
                  setTargets({ ...targets, proteinTargetGrams: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Carbs (g)</Label>
              <Input
                type="number"
                value={targets.carbohydrateTargetGrams}
                onChange={(e) =>
                  setTargets({
                    ...targets,
                    carbohydrateTargetGrams: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fat (g)</Label>
              <Input
                type="number"
                value={targets.fatTargetGrams}
                onChange={(e) =>
                  setTargets({ ...targets, fatTargetGrams: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <Button size="sm" className="mt-3" onClick={saveTargets} disabled={isPending}>
            Save targets
          </Button>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard>
        <SettingsRow icon={Globe} title="Language">
          <Select
            value={locale}
            onValueChange={(v) => v && setLocale(v as "en" | "he")}
            items={{ en: "English", he: "עברית" }}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="he">עברית</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow icon={Ruler} title="Units">
          <Select
            value={units}
            onValueChange={(v) => v && setUnits(v as "METRIC" | "IMPERIAL")}
            items={{ METRIC: "Metric", IMPERIAL: "Imperial" }}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="METRIC">Metric</SelectItem>
              <SelectItem value="IMPERIAL">Imperial</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow icon={Activity} title="Activity calories">
          <label className="mt-1 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={includeActivity}
              onChange={(e) => setIncludeActivity(e.target.checked)}
            />
            Add activity calories back into my daily budget
          </label>
        </SettingsRow>
        <div className="px-4 pb-4">
          <Button size="sm" onClick={savePreferences} disabled={isPending}>
            Save preferences
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard>
        <button
          type="button"
          onClick={onExport}
          disabled={isPending}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-start text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
        >
          <Download className="size-4.5 text-zinc-400" />
          Export my data
        </button>
        <SettingsDivider />
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-start text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
        >
          <LogOut className="size-4.5 text-zinc-400" />
          Log out
        </button>
      </SettingsCard>

      <SettingsCard>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-start text-sm font-medium text-destructive hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
          >
            <Trash2 className="size-4.5" />
            Delete account
          </button>
        ) : (
          <div className="space-y-2 p-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This permanently deletes your account and all logged data. This
              cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={onDeleteAccount}
                disabled={isPending}
              >
                Yes, delete everything
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </SettingsCard>
    </div>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </div>
  );
}

function SettingsDivider() {
  return <div className="mx-4 h-px bg-zinc-100 dark:bg-zinc-800" />;
}

function SettingsRow({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Icon className="size-4.5 text-zinc-600 dark:text-zinc-300" />
        </div>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {children ? <div className="mt-1 ps-12">{children}</div> : null}
    </div>
  );
}
