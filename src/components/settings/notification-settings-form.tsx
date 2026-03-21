"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale-context";
import { updateNotificationPreferences } from "@/actions/notification-preferences";
import { Loader2, MessageCircle, Save, Check, Lock } from "lucide-react";

interface NotificationPrefs {
  whatsappEnabled: boolean;
  smsBookingEnabled: boolean;
  reminderHoursBefore: number;
  reminderHoursBefore2: number;
}

interface Props {
  prefs: NotificationPrefs;
  whatsappAllowed: boolean;
}

export function NotificationSettingsForm({ prefs, whatsappAllowed }: Props) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [whatsappEnabled, setWhatsappEnabled] = useState(prefs.whatsappEnabled);
  const [smsBookingEnabled, setSmsBookingEnabled] = useState(prefs.smsBookingEnabled);
  const [reminderHours, setReminderHours] = useState(prefs.reminderHoursBefore);
  const [reminderHours2, setReminderHours2] = useState(prefs.reminderHoursBefore2);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await updateNotificationPreferences({
        whatsappEnabled,
        smsBookingEnabled,
        reminderHoursBefore: reminderHours,
        reminderHoursBefore2: reminderHours2 > 0 ? reminderHours2 : null,
      });
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="size-4 text-green-600" />
            {t("settings.notif_title" as never)}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("settings.notif_desc" as never)}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {!whatsappAllowed && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <Lock className="size-4 shrink-0" />
              {t("settings.notif_upgrade" as never)}
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                {t("settings.notif_whatsapp" as never)}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("settings.notif_whatsapp_desc" as never)}
              </p>
            </div>
            <Switch
              checked={whatsappEnabled}
              onCheckedChange={setWhatsappEnabled}
              disabled={!whatsappAllowed || pending}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                {t("msg.settings_sms_booking" as never)}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("msg.settings_sms_booking_desc" as never)}
              </p>
            </div>
            <Switch
              checked={smsBookingEnabled}
              onCheckedChange={setSmsBookingEnabled}
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t("settings.notif_reminder_hours" as never)}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("settings.notif_reminder_desc" as never)}
            </p>
            <Input
              type="number"
              min={1}
              max={72}
              value={reminderHours}
              onChange={(e) => { setReminderHours(Number(e.target.value)); setSaved(false); }}
              disabled={!whatsappAllowed || pending}
              className="max-w-[120px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t("msg.settings_reminder2" as never)}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("msg.settings_reminder2_desc" as never)}
            </p>
            <Input
              type="number"
              min={0}
              max={72}
              value={reminderHours2}
              onChange={(e) => { setReminderHours2(Number(e.target.value)); setSaved(false); }}
              disabled={!whatsappAllowed || pending}
              className="max-w-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={pending || !whatsappAllowed}>
          {pending ? (
            <Loader2 className="me-2 size-4 animate-spin" />
          ) : (
            <Save className="me-2 size-4" />
          )}
          {t("settings.save")}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check className="size-4" />
            {t("settings.notif_saved" as never)}
          </span>
        )}
      </div>
    </div>
  );
}
