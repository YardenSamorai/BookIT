"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { SiteEditorShell } from "./site-editor-shell";
import { LayoutPanelLeft, Sparkles } from "lucide-react";
import type { Data } from "@puckeditor/core";
import type { PuckBusinessData } from "@/lib/puck/puck-data-context";
import type { InferSelectModel } from "drizzle-orm";
import type { businesses, siteConfigs, services, staffMembers, businessHours } from "@/lib/db/schema";

const PuckEditorWrapper = dynamic(
  () => import("./puck-editor-wrapper").then((m) => m.PuckEditorWrapper),
  { ssr: false, loading: () => <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">Loading visual editor...</div> }
);

type Business = InferSelectModel<typeof businesses>;
type SiteConfig = InferSelectModel<typeof siteConfigs>;
type Service = InferSelectModel<typeof services>;
type StaffMember = InferSelectModel<typeof staffMembers>;
type HoursRow = InferSelectModel<typeof businessHours>;

interface SiteEditorSwitchProps {
  business: Business;
  siteConfig: SiteConfig | null;
  services: Service[];
  staff: StaffMember[];
  hours: HoursRow[];
  puckData: Data;
  businessData: PuckBusinessData;
}

export function SiteEditorSwitch({
  business,
  siteConfig,
  services,
  staff,
  hours,
  puckData,
  businessData,
}: SiteEditorSwitchProps) {
  const [mode, setMode] = useState<"classic" | "visual">("classic");

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant={mode === "classic" ? "default" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={() => setMode("classic")}
        >
          <LayoutPanelLeft className="size-3.5" />
          Classic Editor
        </Button>
        <Button
          variant={mode === "visual" ? "default" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={() => setMode("visual")}
        >
          <Sparkles className="size-3.5" />
          Visual Editor
        </Button>
      </div>

      {mode === "classic" ? (
        <SiteEditorShell
          business={business}
          siteConfig={siteConfig}
          services={services}
          staff={staff}
          hours={hours}
        />
      ) : (
        <PuckEditorWrapper
          initialData={puckData}
          businessData={businessData}
        />
      )}
    </div>
  );
}
