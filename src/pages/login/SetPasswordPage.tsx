import { type ComponentProps, useState } from "react";
import { AlertCircle, LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { useSetPassword } from "@/entities/auth/api/use-login";
import { getApiErrorMessage } from "@/shared/api/error";
import { LanguageRow } from "@/shared/i18n/LanguageSwitcher";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { TivrixMark } from "@/shared/ui/tivrix-mark";

export function SetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const setPassword = useSetPassword();
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordsMismatch = Boolean(confirmPassword) && password !== confirmPassword;

  const handleSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = (
    event,
  ) => {
    event.preventDefault();
    if (!token || password.length < 4 || password !== confirmPassword) {
      return;
    }

    setPassword.mutate(
      { token, password },
      {
        onSuccess: () => {
          toast.success(t("setPassword.success"));
          navigate("/login", { replace: true });
        },
      },
    );
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f172a] p-4">
      <Card className="w-full max-w-sm border-white/15 bg-[#111827] p-0 text-white shadow-sm">
        <CardHeader className="mb-2 items-center px-8 pt-8 text-center">
          <div className="flex w-full items-center justify-center gap-3">
            <TivrixMark className="size-12 shrink-0" />
            <CardTitle className="text-3xl font-black tracking-tight text-white">
              Tivrix
            </CardTitle>
          </div>
          <CardDescription className="mt-2 text-sm text-slate-300">
            {t("setPassword.subtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <div className="mb-5 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
            <LanguageRow />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!token ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-white/15 bg-[#0f172a] px-3.5 py-2.5 text-xs font-semibold text-slate-200">
                <AlertCircle className="size-4 shrink-0 text-red-400" aria-hidden="true" />
                <span>{t("setPassword.invalidLink")}</span>
              </div>
            ) : null}

            {setPassword.isError ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-white/15 bg-[#0f172a] px-3.5 py-2.5 text-xs font-semibold text-slate-200">
                <AlertCircle className="size-4 shrink-0 text-red-400" aria-hidden="true" />
                <span>{getApiErrorMessage(setPassword.error)}</span>
              </div>
            ) : null}

            <PasswordField
              id="password"
              label={t("setPassword.newPassword")}
              value={password}
              onChange={setPasswordValue}
            />
            <PasswordField
              id="confirm-password"
              label={t("setPassword.confirmPassword")}
              value={confirmPassword}
              onChange={setConfirmPassword}
            />

            {passwordsMismatch ? (
              <div className="text-sm font-semibold text-red-200">
                {t("setPassword.mismatch")}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={
                !token ||
                password.length < 4 ||
                password !== confirmPassword ||
                setPassword.isPending
              }
              className="mt-2 w-full bg-sky-600 py-3.5 shadow-none hover:bg-sky-500"
            >
              <LockKeyhole aria-hidden="true" />
              {setPassword.isPending ? t("setPassword.saving") : t("setPassword.save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label
        htmlFor={id}
        className="mb-1 ml-1 block text-xs font-medium text-slate-300"
      >
        {label}
      </Label>
      <div className="relative">
        <LockKeyhole
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <Input
          id={id}
          className="border-white/15 bg-white/10 pl-10 text-white placeholder:text-slate-400"
          type="password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          minLength={4}
          required
        />
      </div>
    </div>
  );
}
