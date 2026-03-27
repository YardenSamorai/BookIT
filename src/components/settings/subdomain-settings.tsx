"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Loader2,
  Send,
  X,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { requestSubdomain, cancelSubdomainRequest } from "@/actions/subdomain";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  currentSubdomain: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | null;
  rejectReason: string | null;
  slug: string;
}

const APP_DOMAIN = (process.env.NEXT_PUBLIC_APP_DOMAIN || "bookit.co.il").replace(/^www\./, "");

export function SubdomainSettings({ currentSubdomain, status, rejectReason, slug }: Props) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [subdomain, setSubdomain] = useState(currentSubdomain ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleRequest() {
    if (!subdomain.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await requestSubdomain(subdomain);
      if (!result.success) {
        setError(result.error ?? "unknown_error");
      } else {
        router.refresh();
      }
    });
  }

  function handleCancel() {
    startTransition(async () => {
      await cancelSubdomainRequest();
      setSubdomain("");
      setError(null);
      router.refresh();
    });
  }

  const errorMessages: Record<string, string> = {
    subdomain_too_short: t("subdomain.error_too_short" as never),
    subdomain_too_long: t("subdomain.error_too_long" as never),
    subdomain_invalid_chars: t("subdomain.error_invalid" as never),
    subdomain_reserved: t("subdomain.error_reserved" as never),
    subdomain_taken: t("subdomain.error_taken" as never),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="size-4 text-blue-600" />
          {t("subdomain.title" as never)}
        </CardTitle>
        <CardDescription>
          {t("subdomain.desc" as never)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current public URL */}
        <div className="rounded-lg border bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">
            {t("subdomain.current_url" as never)}
          </p>
          <p className="mt-1 text-sm font-mono text-slate-700" dir="ltr">
            {APP_DOMAIN}/b/{slug}
          </p>
        </div>

        {/* Status display */}
        {status === "APPROVED" && currentSubdomain && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">
                {t("subdomain.approved" as never)}
              </span>
            </div>
            <p className="mt-1 text-sm font-mono text-emerald-700" dir="ltr">
              {currentSubdomain}.{APP_DOMAIN}
            </p>
          </div>
        )}

        {status === "PENDING" && currentSubdomain && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  {t("subdomain.pending" as never)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={pending}
                className="text-xs text-amber-700 hover:bg-amber-100"
              >
                <X className="mr-1 size-3" />
                {t("subdomain.cancel_request" as never)}
              </Button>
            </div>
            <p className="mt-1 text-sm font-mono text-amber-700" dir="ltr">
              {currentSubdomain}.{APP_DOMAIN}
            </p>
          </div>
        )}

        {status === "REJECTED" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2">
              <XCircle className="size-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                {t("subdomain.rejected" as never)}
              </span>
            </div>
            {rejectReason && (
              <p className="mt-2 text-xs text-red-700 whitespace-pre-line">
                {rejectReason}
              </p>
            )}
          </div>
        )}

        {/* Request form (show if no approved subdomain) */}
        {status !== "APPROVED" && status !== "PENDING" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {t("subdomain.choose" as never)}
              </label>
              <div className="flex items-center gap-2" dir="ltr">
                <Input
                  value={subdomain}
                  onChange={(e) => {
                    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    setError(null);
                  }}
                  placeholder="my-business"
                  disabled={pending}
                  className="max-w-[200px] font-mono"
                />
                <span className="text-sm text-slate-500">.{APP_DOMAIN}</span>
              </div>
              {error && (
                <p className="mt-1 text-xs text-red-600">
                  {errorMessages[error] || error}
                </p>
              )}
            </div>

            <Button
              onClick={handleRequest}
              disabled={pending || !subdomain.trim()}
              size="sm"
            >
              {pending ? (
                <Loader2 className="mr-1 size-3.5 animate-spin" />
              ) : (
                <Send className="mr-1 size-3.5" />
              )}
              {t("subdomain.submit_request" as never)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
