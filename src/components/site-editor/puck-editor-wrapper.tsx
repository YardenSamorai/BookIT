"use client";

import { useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import "./puck-overrides.css";
import { puckConfig } from "@/lib/puck/puck-config";
import {
  PuckBusinessProvider,
  type PuckBusinessData,
} from "@/lib/puck/puck-data-context";
import { savePuckData } from "@/actions/site-editor";
import { getDir } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

function IframeRtlOverride({
  children,
  document: iframeDoc,
  dir,
  lang,
}: {
  children: ReactNode;
  document?: Document;
  dir: string;
  lang: string;
}) {
  useEffect(() => {
    if (!iframeDoc) return;
    iframeDoc.documentElement.setAttribute("dir", dir);
    iframeDoc.documentElement.setAttribute("lang", lang);
  }, [iframeDoc, dir, lang]);

  return <>{children}</>;
}

interface PuckEditorWrapperProps {
  initialData: Data;
  businessData: PuckBusinessData;
}

export function PuckEditorWrapper({
  initialData,
  businessData,
}: PuckEditorWrapperProps) {
  const [saving, setSaving] = useState(false);

  const handlePublish = useCallback(
    async (data: Data) => {
      setSaving(true);
      try {
        await savePuckData(data as unknown as Record<string, unknown>);
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const dir = getDir(businessData.locale);
  const isRtl = dir === "rtl";

  const overrides = useMemo(
    () => ({
      iframe: ({ children, document: iframeDoc }: { children: ReactNode; document?: Document }) => (
        <IframeRtlOverride document={iframeDoc} dir={dir} lang={businessData.locale}>
          {children}
        </IframeRtlOverride>
      ),
      headerActions: ({ children }: { children: ReactNode }) => (
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          {children}
        </div>
      ),
    }),
    [dir, businessData.locale, saving]
  );

  return (
    <PuckBusinessProvider value={businessData}>
      <div className={`puck-wrapper -mx-6 -mt-2 h-[calc(100vh-80px)] ${isRtl ? "puck-rtl" : ""}`} dir={dir}>
        <Puck
          config={puckConfig}
          data={initialData}
          onPublish={handlePublish}
          overrides={overrides}
        />
      </div>
    </PuckBusinessProvider>
  );
}
