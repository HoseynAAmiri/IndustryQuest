import Link from "next/link";
import { useId, type ComponentProps, type ReactNode } from "react";
import { ArrowLeft, CircleAlert, Info } from "lucide-react";
import { Alert as ShAlert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export { Button } from "@/components/ui/button";

// Radix Select can't hold an empty value, so "nothing chosen" travels as this and parses back to "".
export const NONE = "none";

function Labelled({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Field({ label, hint, name, ...props }: { label: string; hint?: string; name: string } & ComponentProps<"input">) {
  const id = useId();
  return (
    <Labelled id={id} label={label} hint={hint}>
      <Input id={id} name={name} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
    </Labelled>
  );
}

export function TextArea({ label, hint, name, ...props }: { label: string; hint?: string; name: string } & ComponentProps<"textarea">) {
  const id = useId();
  return (
    <Labelled id={id} label={label} hint={hint}>
      <Textarea id={id} name={name} rows={4} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
    </Labelled>
  );
}

export function SelectField({ label, hint, name, defaultValue, options, placeholder = "Choose" }: {
  label: string; hint?: string; name: string; defaultValue?: string | number;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  const id = useId();
  return (
    <Labelled id={id} label={label} hint={hint}>
      <Select name={name} defaultValue={defaultValue === undefined || defaultValue === "" ? undefined : String(defaultValue)}>
        <SelectTrigger id={id} className="w-full" aria-describedby={hint ? `${id}-hint` : undefined}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </Labelled>
  );
}

export function CheckField({ label, name, value, defaultChecked }: { label: string; name: string; value?: string; defaultChecked?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} name={name} value={value} defaultChecked={defaultChecked} />
      <Label htmlFor={id} className="font-normal">{label}</Label>
    </div>
  );
}

export function Alert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" }) {
  if (!children) return null;
  return (
    <ShAlert variant={tone === "error" ? "destructive" : "default"} role={tone === "error" ? "alert" : "status"}
      className={tone === "info" ? "border-primary/30 bg-accent text-accent-foreground" : undefined}>
      {tone === "error" ? <CircleAlert /> : <Info />}
      <AlertDescription className={tone === "info" ? "text-accent-foreground" : undefined}>{children}</AlertDescription>
    </ShAlert>
  );
}

export function Page({ title, description, children, back, actions, narrow }: {
  title: string; description?: ReactNode; children: ReactNode; back?: { href: string; label: string };
  actions?: ReactNode; narrow?: boolean;
}) {
  return (
    <div className={`mx-auto w-full px-4 py-8 sm:py-10 ${narrow ? "max-w-md" : "max-w-6xl"}`}>
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {back.label}
        </Link>
      )}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

// Messages travel through the URL after a server-action redirect, so forms work without client JS.
export async function messages(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const p = await searchParams;
  return { error: typeof p.error === "string" ? p.error : undefined, info: typeof p.info === "string" ? p.info : undefined };
}

const LISTING = {
  draft: ["Draft", "outline"], in_review: ["In staff review", "secondary"], changes_requested: ["Changes requested", "destructive"],
  published: ["Published", "default"], paused: ["Paused", "secondary"], closed: ["Closed", "outline"], archived: ["Archived", "outline"],
} as const;

export function ListingBadge({ state }: { state: keyof typeof LISTING }) {
  const [label, variant] = LISTING[state];
  return <Badge variant={variant}>{label}</Badge>;
}

export const ENROLLMENT = {
  applied: ["Applied", "secondary"], declined: ["Not selected", "outline"], withdrawn: ["Withdrawn", "outline"],
  offered: ["Offer waiting", "default"], offer_declined: ["Offer declined", "outline"], offer_expired: ["Offer expired", "outline"],
  active: ["In progress", "default"], submitted: ["Submitted for review", "secondary"], revision_requested: ["Revision requested", "destructive"],
  completed: ["Completed", "default"], closed_incomplete: ["Closed", "outline"],
} as const;

export function EnrollmentBadge({ state }: { state: keyof typeof ENROLLMENT }) {
  const [label, variant] = ENROLLMENT[state];
  return <Badge variant={variant}>{label}</Badge>;
}

// EXP-05: dates always carry their timezone.
export function when(d: Date | null | undefined, timeZone = "UTC", withTime = false) {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone,
    ...(withTime && { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }),
  }).format(d) + (withTime ? "" : timeZone === "UTC" ? " (UTC)" : "");
}
