"use client";
import { useId, type ComponentProps, type ReactNode } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Ask = { title: string; description: ReactNode; confirm: string; destructive?: boolean };

// EXP-06: consequential actions ask first. The confirm button submits the form by id, so the
// same server action runs; without JS the trigger stays a plain submit button.
export function ConfirmSubmit({ formId, name, value, ask, children, ...button }: {
  formId: string; name?: string; value?: string; ask: Ask; children: ReactNode;
} & Omit<ComponentProps<typeof Button>, "form" | "name" | "value">) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button type="button" {...button}>{children}</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{ask.title}</AlertDialogTitle>
          <AlertDialogDescription>{ask.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <button type="submit" form={formId} name={name} value={value}
              className={ask.destructive ? "bg-destructive text-white hover:bg-destructive/90" : undefined}>
              {ask.confirm}
            </button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// A whole small form (hidden fields plus optional inputs) guarded by a confirmation.
export function ConfirmForm({ action, fields, ask, children, extra, className, ...button }: {
  action: (f: FormData) => Promise<void>; fields: Record<string, string>; ask: Ask; children: ReactNode; extra?: ReactNode; className?: string;
} & Omit<ComponentProps<typeof Button>, "form" | "name" | "value" | "className">) {
  const id = useId();
  return (
    <form id={id} action={action} className={className}>
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {extra}
      <ConfirmSubmit formId={id} ask={ask} {...button}>{children}</ConfirmSubmit>
    </form>
  );
}
