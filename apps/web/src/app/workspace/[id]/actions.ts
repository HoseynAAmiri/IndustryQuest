"use server";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { addLink, postMessage, submit, toggleMilestone } from "@/server/workspace";

const s = (f: FormData, k: string) => String(f.get(k) ?? "");
const at = (f: FormData, tab: string) => `/workspace/${s(f, "enrollmentId")}${tab && `?tab=${tab}`}`;

export async function messageAction(f: FormData) {
  const u = await requireUser();
  await act(at(f, "discussion"), () => postMessage(getDb(), u, { enrollmentId: s(f, "enrollmentId"), body: s(f, "body") }));
}

export async function milestoneAction(f: FormData) {
  const u = await requireUser();
  await act(at(f, ""), () => toggleMilestone(getDb(), u, s(f, "milestoneId")));
}

export async function linkAction(f: FormData) {
  const u = await requireUser();
  await act(at(f, "files"), () => addLink(getDb(), u, { enrollmentId: s(f, "enrollmentId"), name: s(f, "name"), url: s(f, "url") }), { info: "Link added." });
}

export async function submitAction(f: FormData) {
  const u = await requireUser();
  await act(at(f, "submissions"), () => submit(getDb(), u, {
    enrollmentId: s(f, "enrollmentId"), clientKey: s(f, "clientKey"), fileIds: f.getAll("fileIds").map(String),
    contributionStatement: s(f, "contribution"), reflection: s(f, "reflection"),
  }), { to: at(f, ""), info: "Submitted. Your mentor has been asked to review it within five business days." });
}
