"use client";

import Image from "next/image";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  FileText,
  History,
  MessageSquareText,
  Send,
  Sparkles,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Features } from "@/components/landing/features";

const workflowSteps = [
  {
    icon: FileText,
    title: "Draft in flow",
    copy: "Write in a clean editor with inline suggestions that wait for your approval.",
  },
  {
    icon: MessageSquareText,
    title: "Ask beside the page",
    copy: "Use chat to reshape sections, answer from context, or explore a better angle.",
  },
  {
    icon: Send,
    title: "Publish when ready",
    copy: "Share a polished page with a public link and AI support for readers.",
  },
] as const;

const proofPoints = [
  "Inline edits",
  "Version history",
  "Personal voice",
  "One-click publish",
] as const;

export default function Home() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { data: session } = authClient.useSession();
  const hasSession = !!session?.user;

  const handleBeginClick = () => {
    if (isPending) {
      return;
    }

    startTransition(() => {
      if (hasSession) {
        router.push("/documents");
      } else {
        router.push("/login?redirect=/documents");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#fdf7ff] text-[#101214] dark:bg-[#0d0f0f] dark:text-white">
      <Header
        hasSession={hasSession}
        onBeginClick={handleBeginClick}
        isNavigating={isPending}
      />

      <main>
        <section className="relative overflow-hidden border-b border-black/10 bg-[#fdf7ff] pt-28 dark:border-white/10 dark:bg-[#0d0f0f]">
          <div
            className="absolute inset-0 opacity-30 dark:hidden"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(16,18,20,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(16,18,20,0.08) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
          <div
            className="absolute inset-0 hidden opacity-30 dark:block"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
          <div className="relative mx-auto flex min-h-[82vh] max-w-7xl flex-col px-6 pb-10 md:px-8 lg:px-12">
            <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-[#3c4043] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                <Sparkles className="size-4 text-[#d946ef]" />
                AI writing workspace for drafts, edits, and publishing
              </div>

              <h1 className="text-6xl font-semibold leading-none text-[#101214] md:text-8xl dark:text-white">
                Scribe
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4f565c] md:text-xl dark:text-white/70">
                A focused writing surface with AI edits that understand your
                context, preserve your voice, and move finished work from draft
                to published page without changing tools.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-11 rounded-lg bg-[#7c3aed] px-5 text-white hover:bg-[#6d28d9] dark:bg-[#f0abfc] dark:text-[#22072a] dark:hover:bg-[#f5d0fe]"
                  onClick={handleBeginClick}
                  disabled={isPending}
                >
                  {hasSession ? "Open Scribe" : "Start writing"}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-lg border-black/10 bg-white/80 px-5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  asChild
                >
                  <a href="#workflow">See workflow</a>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {proofPoints.map((point) => (
                  <span
                    key={point}
                    className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-sm text-[#3c4043] dark:border-white/10 dark:bg-white/5 dark:text-white/70"
                  >
                    <Check className="size-3.5 text-[#d946ef]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-12 overflow-hidden rounded-lg border border-black/10 bg-[#101214] p-2 shadow-2xl shadow-black/20 dark:border-white/10 dark:shadow-black/40">
              <div className="flex h-8 items-center gap-2 border-b border-white/10 px-3">
                <span className="size-3 rounded-full bg-[#f472b6]" />
                <span className="size-3 rounded-full bg-[#a78bfa]" />
                <span className="size-3 rounded-full bg-[#d946ef]" />
                <span className="ml-3 text-xs text-white/50">scribe.app/documents</span>
              </div>
              <Image
                src="/images/lightmode.png"
                alt="Scribe writing workspace preview"
                width={1200}
                height={675}
                className="block w-full rounded-md dark:hidden"
                priority
              />
              <Image
                src="/images/darkmode.png"
                alt="Scribe writing workspace preview in dark mode"
                width={1200}
                height={675}
                className="hidden w-full rounded-md dark:block"
                priority
              />
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="border-b border-black/10 bg-white py-20 dark:border-white/10 dark:bg-[#111413]"
        >
          <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-12">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <p className="text-sm font-medium uppercase text-[#d946ef]">
                  The writing loop
                </p>
                <h2 className="mt-3 text-4xl font-semibold leading-tight text-[#101214] md:text-5xl dark:text-white">
                  Draft, revise, and publish from one calm workspace.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-[#596168] dark:text-white/70">
                  Scribe keeps the editor, assistant, versions, and publishing
                  path close together. You stay in the document while the tool
                  handles the busywork around it.
                </p>
              </div>

              <div className="grid gap-4">
                {workflowSteps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.title}
                      className="grid gap-4 rounded-lg border border-black/10 bg-[#fbfcff] p-5 shadow-sm sm:grid-cols-[auto_1fr] dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex size-11 items-center justify-center rounded-lg bg-[#f5e8ff] text-[#7c3aed] dark:bg-[#d946ef]/20 dark:text-[#f0abfc]">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-[#899198] dark:text-white/50">
                            0{index + 1}
                          </span>
                          <h3 className="font-medium text-[#101214] dark:text-white">
                            {step.title}
                          </h3>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#596168] dark:text-white/60">
                          {step.copy}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <Features />

        <section className="bg-[#2e1065] px-6 py-20 text-white md:px-8 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-white/70">
                <History className="size-4 text-[#f9a8d4]" />
                Every edit remains traceable
              </div>
              <h2 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
                Keep your voice. Keep your history. Keep moving.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
                AI suggestions appear where you write, selected edits stay
                reviewable, and versions make it easy to return to a stronger
                draft.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/20">
              <div className="mb-4 flex items-center justify-between text-sm text-white/60">
                <span>Revision stack</span>
                <span>Live</span>
              </div>
              <div className="space-y-3">
                {["Opening tightened", "Voice matched", "Published draft"].map(
                  (item, index) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/10 px-4 py-3"
                    >
                      <span className="text-sm text-white/80">{item}</span>
                      <span className="text-xs text-white/40">
                        v{index + 1}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-20 text-center dark:bg-[#0d0f0f] md:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-4xl font-semibold leading-tight text-[#101214] md:text-5xl dark:text-white">
              Your next draft belongs in Scribe.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#596168] dark:text-white/70">
              Open a blank document, bring in an existing draft, or publish the
              piece that is already close.
            </p>
            <Button
              size="lg"
              className="mt-8 h-11 rounded-lg bg-[#7c3aed] px-5 text-white hover:bg-[#6d28d9] dark:bg-[#f0abfc] dark:text-[#22072a] dark:hover:bg-[#f5d0fe]"
              onClick={handleBeginClick}
              disabled={isPending}
            >
              {hasSession ? "Go to workspace" : "Get started"}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
