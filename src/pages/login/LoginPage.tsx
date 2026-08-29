import { type ComponentProps, useState } from "react";
import { AlertCircle, LockKeyhole, LogIn, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { useLogin } from "@/entities/auth/api/use-login";
import { queryClient } from "@/shared/api/query-client";
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

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const error = loginMutation.isError
    ? getApiErrorMessage(loginMutation.error, t("login.failed"))
    : null;

  const handleSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = (
    event,
  ) => {
    event.preventDefault();

    loginMutation.mutate(
      { username, password },
      {
        onSuccess: (currentUser) => {
          queryClient.setQueryData(["auth", "me"], currentUser);
          toast.success(t("login.success"));
          navigate(currentUser.first_accessible_route ?? "/", { replace: true });
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, t("login.failed")));
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
            {t("login.description")}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <div className="mb-5 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
            <LanguageRow />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-white/15 bg-[#0f172a] px-3.5 py-2.5 text-xs font-semibold text-slate-200">
                <AlertCircle className="size-4 shrink-0 text-red-400" aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : null}

            <div>
              <Label
                htmlFor="username"
                className="mb-1 ml-1 block text-xs font-medium text-slate-300"
              >
                {t("login.username")}
              </Label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <Input
                  id="username"
                  className="border-white/15 bg-white/10 pl-10 text-white placeholder:text-slate-400"
                  placeholder={t("login.usernamePlaceholder")}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="password"
                className="mb-1 ml-1 block text-xs font-medium text-slate-300"
              >
                {t("login.password")}
              </Label>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  className="border-white/15 bg-white/10 pl-10 text-white placeholder:text-slate-400"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="mt-2 w-full bg-sky-600 py-3.5 shadow-none hover:bg-sky-500"
            >
              <LogIn aria-hidden="true" />
              {loginMutation.isPending ? t("login.loading") : t("login.submit")}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              {t("login.copyright")}
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
