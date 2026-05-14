import { type ComponentProps, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { useSetPassword } from "@/entities/auth/api/use-login";
import { getApiErrorMessage } from "@/shared/api/error";
import { LanguageSwitcher } from "@/shared/i18n/LanguageSwitcher";
import { Alert, AlertDescription } from "@/shared/ui/alert";
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(79,70,229,0.28),transparent_32%),radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.16),transparent_28%)]" />
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher />
      </div>
      <Card className="relative w-full max-w-md border-white/15 bg-white/10 p-0 text-white shadow-2xl backdrop-blur-xl">
        <CardHeader className="mb-2 items-center px-8 pt-8 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            {t("setPassword.title")}
          </CardTitle>
          <CardDescription className="mt-2 whitespace-nowrap text-xs text-slate-300 sm:text-sm">
            {t("setPassword.subtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!token ? (
              <Alert variant="destructive" className="rounded-lg">
                <AlertDescription>{t("setPassword.invalidLink")}</AlertDescription>
              </Alert>
            ) : null}

            {setPassword.isError ? (
              <Alert variant="destructive" className="rounded-lg">
                <AlertDescription>
                  {getApiErrorMessage(setPassword.error)}
                </AlertDescription>
              </Alert>
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
              className="mt-2 w-full bg-[#4f46e5] py-3.5 shadow-lg shadow-indigo-950/30 hover:bg-indigo-500"
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
        className="mb-1 ml-1 block text-xs font-bold uppercase text-slate-300"
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
