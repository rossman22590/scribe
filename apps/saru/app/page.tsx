'use client';

import Image from 'next/image';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Cormorant_Garamond, Instrument_Sans } from 'next/font/google';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpenText,
  Check,
  ChevronRight,
  FileClock,
  FileText,
  History,
  Keyboard,
  Layers3,
  MessageSquareText,
  PenLine,
  Send,
  Sparkles,
  Wand2,
} from 'lucide-react';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { Features } from '@/components/landing/features';

const editorialSerif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-editorial-serif',
});

const editorialSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-editorial-sans',
});

const navItems = [
  { href: '#story', label: 'Story' },
  { href: '#features', label: 'Studio' },
  { href: '#proof', label: 'Proof' },
] as const;

const heroProof = [
  'Context-aware edits',
  'Voice-preserving revisions',
  'Publish-ready pages',
] as const;

const workflowSteps = [
  {
    icon: PenLine,
    eyebrow: '01 / Draft',
    title: 'Start with a page that stays out of the way.',
    copy: 'A quiet editor, inline completions, and a sidecar assistant keep the work in one place while the sentence is still warm.',
  },
  {
    icon: Wand2,
    eyebrow: '02 / Refine',
    title: 'Shape selected passages without losing your voice.',
    copy: 'Highlight the rough edge, ask for a sharper angle, and approve only the language that earns its place.',
  },
  {
    icon: Send,
    eyebrow: '03 / Publish',
    title: 'Ship a finished document with history behind it.',
    copy: 'Versions, share links, and reader-ready presentation turn a private draft into something you can stand behind.',
  },
] as const;

const studioNotes = [
  { icon: BookOpenText, label: 'Tone lock', value: '91%' },
  { icon: Keyboard, label: 'Draft depth', value: '4 passes' },
  { icon: FileClock, label: 'History', value: 'traceable' },
] as const;

const marqueeWords = [
  'draft',
  'tighten',
  'ask',
  'revise',
  'compare',
  'publish',
  'share',
  'return',
] as const;

function ProductStage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotateX: 6 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="group relative"
    >
      <div className="absolute -inset-3 rounded-lg border border-[#d8b46b]/20 bg-[#d8b46b]/5 blur-xl transition duration-700 group-hover:bg-[#d8b46b]/10" />
      <div className="relative overflow-hidden rounded-lg border border-white/15 bg-[#0b0a09] shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <div className="flex h-11 items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 text-xs uppercase tracking-[0.22em] text-[#efe5d2]/50">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#d9563f]" />
            <span className="size-2 rounded-full bg-[#d8b46b]" />
            <span className="size-2 rounded-full bg-[#2f7c75]" />
          </span>
          <span>live workspace</span>
        </div>

        <div className="relative bg-[#050504]">
          <Image
            src="/images/darkmode.png"
            alt="Scribe document editor with chat assistant"
            width={1600}
            height={960}
            className="block w-full opacity-90 saturate-[0.85] transition duration-700 group-hover:scale-[1.015] group-hover:opacity-100"
            priority
          />

          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.75, duration: 0.55 }}
            className="absolute left-4 top-[27%] hidden max-w-[270px] rounded-lg border border-[#d8b46b]/35 bg-[#16120f]/90 p-3 shadow-2xl shadow-black/40 backdrop-blur md:block"
          >
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#d8b46b]">
              <Sparkles className="size-3.5" />
              Inline suggestion
            </div>
            <p className="text-sm leading-6 text-[#f7efe3]/85">
              tighten the opening, keep the cadence, make the claim land
              <span className="scribe-caret ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-[#d8b46b]" />
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.55 }}
            className="absolute bottom-4 right-4 hidden w-[270px] rounded-lg border border-white/15 bg-[#f4eadb]/95 p-4 text-[#17120f] shadow-2xl shadow-black/35 md:block"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[#8a513d]">
              <span>revision stack</span>
              <span>v4</span>
            </div>
            <div className="mt-3 space-y-2">
              {['Sharper thesis', 'Voice matched', 'Ready to publish'].map(
                (item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 border-t border-[#17120f]/10 pt-2 text-sm"
                  >
                    <Check className="size-3.5 text-[#2f7c75]" />
                    {item}
                  </div>
                ),
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function StudioStrip() {
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-[#0b0a09] py-4 text-[#f4eadb]">
      <div className="scribe-marquee flex w-max items-center gap-8 text-sm uppercase tracking-[0.28em] text-[#f4eadb]/45">
        {[...marqueeWords, ...marqueeWords, ...marqueeWords].map(
          (word, index) => (
            <span key={`${word}-${index}`} className="flex items-center gap-8">
              <span>{word}</span>
              <span className="size-1 rounded-full bg-[#d8b46b]" />
            </span>
          ),
        )}
      </div>
    </div>
  );
}

function StorySection() {
  return (
    <section
      id="story"
      className="relative overflow-hidden bg-[#f4eadb] py-20 text-[#17120f] md:py-28"
    >
      <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(to_right,#17120f_1px,transparent_1px),linear-gradient(to_bottom,#17120f_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="relative mx-auto max-w-7xl px-6 md:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9e3f30]">
              The visual story
            </p>
            <h2
              className="mt-5 max-w-xl text-5xl font-semibold leading-[0.9] tracking-normal md:text-7xl"
              style={{ fontFamily: 'var(--font-editorial-serif)' }}
            >
              From raw thought to finished page.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-[#4f4038]">
              Scribe is built around the real rhythm of writing: capture the
              rough idea, let AI pressure-test the language, then publish with
              the trail of decisions intact.
            </p>
          </div>

          <div className="space-y-4">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.article
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.55, delay: index * 0.08 }}
                  className="group grid gap-6 rounded-lg border border-[#17120f]/12 bg-[#fff8ed]/82 p-5 shadow-[0_18px_50px_rgba(42,28,18,0.08)] transition duration-500 hover:-translate-y-1 hover:border-[#9e3f30]/35 hover:bg-[#fffaf2] md:grid-cols-[auto_1fr]"
                >
                  <div className="flex size-12 items-center justify-center rounded-lg border border-[#17120f]/10 bg-[#17120f] text-[#f4eadb] transition duration-500 group-hover:bg-[#9e3f30]">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9e3f30]">
                      {step.eyebrow}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold leading-tight text-[#17120f]">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5b4a41]">
                      {step.copy}
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofSection() {
  return (
    <section
      id="proof"
      className="relative overflow-hidden bg-[#0b0a09] px-6 py-20 text-[#f4eadb] md:px-8 md:py-28 lg:px-12"
    >
      <div className="absolute inset-0 scribe-luxury-grid opacity-55" />
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#d8b46b]">
            Proof in public
          </p>
          <h2
            className="mt-5 text-5xl font-semibold leading-[0.92] tracking-normal md:text-7xl"
            style={{ fontFamily: 'var(--font-editorial-serif)' }}
          >
            Let the room speak.
          </h2>
          <p className="mt-6 max-w-md text-base leading-8 text-[#f4eadb]/68">
            Real feedback belongs inside the landing story. The Senja wall now
            sits on the home page, framed as the moment where trust catches up
            to the product.
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#14110f]/82 p-3 shadow-[0_24px_90px_rgba(0,0,0,0.35)] md:p-5">
          <Script
            src="https://widget.senja.io/widget/698903f7-82e1-43c9-a1e4-507b33742e0a/platform.js"
            type="text/javascript"
            strategy="afterInteractive"
          />
          <div
            className="senja-embed"
            data-id="698903f7-82e1-43c9-a1e4-507b33742e0a"
            data-mode="shadow"
            data-lazyload="false"
            style={{ display: 'block', width: '100%' }}
          />
        </div>
      </div>
    </section>
  );
}

function ClosingCta({
  hasSession,
  isPending,
  onBeginClick,
}: {
  hasSession: boolean;
  isPending: boolean;
  onBeginClick: () => void;
}) {
  return (
    <section className="relative overflow-hidden bg-[#f4eadb] px-6 py-20 text-[#17120f] md:px-8 md:py-28 lg:px-12">
      <div className="absolute inset-x-0 top-0 h-px bg-[#17120f]/15" />
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9e3f30]">
            Open the studio
          </p>
          <h2
            className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.9] tracking-normal md:text-7xl"
            style={{ fontFamily: 'var(--font-editorial-serif)' }}
          >
            Your next draft deserves a better room.
          </h2>
        </div>

        <div className="space-y-6">
          <p className="text-base leading-8 text-[#5b4a41]">
            Bring the messy paragraph, the polished essay, or the blank page.
            Scribe keeps the editor, AI, versions, and publishing path in one
            focused surface.
          </p>
          <Button
            size="lg"
            className="group h-12 rounded-lg bg-[#17120f] px-6 text-[#f4eadb] shadow-[0_16px_40px_rgba(23,18,15,0.25)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#9e3f30]"
            onClick={onBeginClick}
            disabled={isPending}
          >
            {hasSession ? 'Enter Scribe' : 'Start writing'}
            <ArrowRight className="ml-1 size-4 transition duration-300 group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}

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
        router.push('/documents');
      } else {
        router.push('/login?redirect=/documents');
      }
    });
  };

  return (
    <div
      className={`${editorialSans.variable} ${editorialSerif.variable} min-h-screen bg-[#0b0a09] text-[#f4eadb] [font-family:var(--font-editorial-sans)]`}
    >
      <Header
        hasSession={hasSession}
        onBeginClick={handleBeginClick}
        isNavigating={isPending}
        variant="editorial"
        navItems={navItems}
      />

      <main>
        <section className="scribe-grain relative overflow-hidden bg-[#0b0a09] pt-24 text-[#f4eadb] sm:pt-28">
          <div className="absolute inset-0 scribe-luxury-grid opacity-70" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0b0a09] to-transparent" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 pb-10 md:px-8 lg:min-h-[86svh] lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl"
            >
              <div className="mb-6 inline-flex items-center gap-2 border border-[#d8b46b]/25 bg-[#f4eadb]/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#d8b46b]">
                <Sparkles className="size-3.5" />
                AI writing workspace
              </div>

              <h1
                className="text-[clamp(5rem,19vw,13.5rem)] font-semibold leading-[0.72] tracking-normal text-[#f4eadb]"
                style={{ fontFamily: 'var(--font-editorial-serif)' }}
              >
                Scribe
              </h1>

              <p className="mt-8 max-w-xl text-[clamp(1.45rem,3vw,2.9rem)] leading-[1.02] text-[#f4eadb]">
                A private writing room where rough drafts become precise,
                publishable work.
              </p>

              <p className="mt-6 max-w-xl text-base leading-8 text-[#f4eadb]/65">
                Write in a calm document, ask AI beside the page, review every
                revision, and move the finished piece into the world without
                changing tools.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="scribe-shimmer group h-12 overflow-hidden rounded-lg bg-[#f4eadb] px-6 text-[#17120f] shadow-[0_20px_70px_rgba(216,180,107,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-white"
                  onClick={handleBeginClick}
                  disabled={isPending}
                >
                  {hasSession ? 'Open workspace' : 'Start writing'}
                  <ArrowRight className="ml-1 size-4 transition duration-300 group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-lg border-white/15 bg-white/[0.03] px-6 text-[#f4eadb] transition duration-300 hover:-translate-y-0.5 hover:border-[#d8b46b]/45 hover:bg-[#d8b46b]/10 hover:text-[#f4eadb]"
                  asChild
                >
                  <a href="#story">
                    See the story
                    <ChevronRight className="ml-1 size-4" />
                  </a>
                </Button>
              </div>

              <div className="mt-8 hidden grid-cols-3 gap-3 sm:grid">
                {heroProof.map((point) => (
                  <div
                    key={point}
                    className="border-t border-white/15 pt-3 text-xs uppercase tracking-[0.16em] text-[#f4eadb]/55"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </motion.div>

            <ProductStage />
          </div>
        </section>

        <StudioStrip />

        <section className="bg-[#0b0a09] px-6 py-12 text-[#f4eadb] md:px-8 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
            {studioNotes.map((note, index) => (
              <motion.div
                key={note.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="group rounded-lg border border-white/10 bg-white/[0.035] p-5 transition duration-500 hover:-translate-y-1 hover:border-[#d8b46b]/35 hover:bg-white/[0.06]"
              >
                <div className="mb-8 flex items-center justify-between text-[#f4eadb]/45">
                  <note.icon className="size-5" />
                  <span className="text-xs uppercase tracking-[0.24em]">
                    0{index + 1}
                  </span>
                </div>
                <p className="text-sm uppercase tracking-[0.22em] text-[#d8b46b]">
                  {note.label}
                </p>
                <p
                  className="mt-3 text-4xl font-semibold text-[#f4eadb]"
                  style={{ fontFamily: 'var(--font-editorial-serif)' }}
                >
                  {note.value}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <StorySection />
        <Features />
        <ProofSection />
        <section className="bg-[#14110f] px-6 py-16 text-[#f4eadb] md:px-8 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-4">
            {[
              { icon: FileText, label: 'Editor', text: 'clean page' },
              {
                icon: MessageSquareText,
                label: 'Assistant',
                text: 'context ready',
              },
              { icon: History, label: 'Versions', text: 'reviewable' },
              { icon: Layers3, label: 'Publishing', text: 'one motion' },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="group flex items-center gap-4 border-t border-white/12 pt-5 transition duration-300 hover:border-[#d8b46b]/50"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#d8b46b] transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-[#d8b46b] group-hover:text-[#14110f]">
                    <Icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#f4eadb]">
                      {item.label}
                    </span>
                    <span className="text-sm text-[#f4eadb]/50">
                      {item.text}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
        <ClosingCta
          hasSession={hasSession}
          isPending={isPending}
          onBeginClick={handleBeginClick}
        />
      </main>

      <Footer variant="editorial" />
    </div>
  );
}
