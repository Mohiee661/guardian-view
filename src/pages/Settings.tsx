import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  return (
    <div className="grid max-w-3xl gap-3">
      <Section title="Workspace" desc="Organization-level preferences for DarkShield.">
        <Field label="Workspace name" defaultValue="Acme Security Operations" />
        <Field label="Primary domain" defaultValue="acme.io" />
      </Section>

      <Section title="Notifications" desc="When to alert your SOC team.">
        <Toggle label="Email on critical findings" defaultChecked />
        <Toggle label="Slack alerts for high severity" defaultChecked />
        <Toggle label="Weekly digest" />
      </Section>

      <Section title="Detection" desc="Tune detection sensitivity.">
        <Field label="Minimum risk score for alerts" defaultValue="70" />
        <Field label="Auto-close findings after (days)" defaultValue="30" />
      </Section>

      <div className="flex justify-end">
        <Button size="sm" className="h-8 text-xs">Save changes</Button>
      </div>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mb-4 text-[11px] text-muted-foreground">{desc}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Input defaultValue={defaultValue} className="h-8 text-xs" />
    </div>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
      <span className="text-xs">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
