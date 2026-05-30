'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  BookMarked,
  BrainCircuit,
  CheckCircle2,
  FileStack,
  Highlighter,
  MessageSquareText,
  SendHorizontal,
} from 'lucide-react';

const features: Array<{
  icon: LucideIcon;
  title: string;
  copy: string;
  demo: 'inline' | 'selection' | 'voice' | 'context' | 'versions' | 'publish';
}> = [
  {
    icon: Highlighter,
    title: 'Inline precision',
    copy: 'Suggestions appear inside the sentence, close enough to accept without breaking focus.',
    demo: 'inline',
  },
  {
    icon: MessageSquareText,
    title: 'Selection edits',
    copy: 'Turn a highlighted section into a sharper claim, a cleaner transition, or a stronger close.',
    demo: 'selection',
  },
  {
    icon: BrainCircuit,
    title: 'Voice memory',
    copy: 'Scribe keeps recurring tone, structure, and phrasing patterns from drifting generic.',
    demo: 'voice',
  },
  {
    icon: BookMarked,
    title: 'Document context',
    copy: 'The assistant reads the active draft before it offers edits, summaries, or next moves.',
    demo: 'context',
  },
  {
    icon: FileStack,
    title: 'Version confidence',
    copy: 'Every meaningful pass stays reviewable, so revision feels reversible instead of risky.',
    demo: 'versions',
  },
  {
    icon: SendHorizontal,
    title: 'Publish path',
    copy: 'Move from private workspace to clean public page when the draft is ready to meet readers.',
    demo: 'publish',
  },
];

function FeatureDemo({ type }: { type: (typeof features)[number]['demo'] }) {
  if (type === 'inline') {
    return (
      <div className="space-y-4 text-sm">
        <p className="leading-7 text-[#f4eadb]/82">
          The argument finally has shape
          <span className="text-[#d8b46b]">
            {' '}
            when the opening claim arrives first
          </span>
          <span className="scribe-caret ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-[#d8b46b]" />
        </p>
        <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-[#f4eadb]/48">
          <CheckCircle2 className="size-3.5 text-[#2f7c75]" />
          ready to apply
        </div>
      </div>
    );
  }

  if (type === 'selection') {
    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-md border border-[#d8b46b]/25 bg-[#d8b46b]/10 px-3 py-2 text-[#e8c87d]">
          make this braver, keep it exact
        </div>
        <div className="space-y-2 text-xs leading-5">
          <p className="text-[#d9563f]/80 line-through">
            This point could maybe be stronger.
          </p>
          <p className="text-[#f4eadb]/82">
            The point is strong enough to lead the section.
          </p>
        </div>
      </div>
    );
  }

  if (type === 'voice') {
    return (
      <div className="space-y-3">
        {[
          ['Cadence', '91%'],
          ['Warmth', '76%'],
          ['Directness', '84%'],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-xs text-[#f4eadb]/50">
              <span>{label}</span>
              <span>{value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-[#2f7c75]"
                style={{ width: value }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'context') {
    return (
      <div className="grid grid-cols-2 gap-2 text-xs">
        {['Draft', 'Sources', 'Notes', 'Goal'].map((label, index) => (
          <div
            key={label}
            className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-[#f4eadb]/60"
          >
            <div className="mb-4 h-1.5 w-8 rounded-full bg-[#d8b46b]/70" />
            {label}
            <span className="mt-2 block text-[10px] uppercase tracking-[0.18em] text-[#f4eadb]/28">
              linked 0{index + 1}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'versions') {
    return (
      <div className="space-y-2 text-xs">
        {['v4 final pass', 'v3 thesis', 'v2 shorter intro'].map((label) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-[#f4eadb]/62"
          >
            <span>{label}</span>
            <span className="size-1.5 rounded-full bg-[#d8b46b]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-white/10 bg-[#f4eadb] p-3 text-[#17120f]">
      <div className="mb-3 h-2 w-2/3 rounded-full bg-[#17120f]/20" />
      <div className="space-y-2">
        <div className="h-2 rounded-full bg-[#17120f]/10" />
        <div className="h-2 w-5/6 rounded-full bg-[#17120f]/10" />
      </div>
      <div className="mt-4 inline-flex rounded-md bg-[#17120f] px-2 py-1 text-xs text-[#f4eadb]">
        published
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-[#14110f] py-20 text-[#f4eadb] md:py-28"
      aria-labelledby="features-heading"
    >
      <div className="absolute inset-0 scribe-luxury-grid opacity-40" />
      <div className="relative mx-auto max-w-7xl px-6 md:px-8 lg:px-12">
        <div className="grid gap-8 md:grid-cols-[0.78fr_1.22fr] md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#d8b46b]">
              The studio
            </p>
            <h2
              id="features-heading"
              className="mt-5 text-5xl font-semibold leading-[0.9] tracking-normal md:text-7xl"
              style={{ fontFamily: 'var(--font-editorial-serif)' }}
            >
              Controls with a point of view.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-[#f4eadb]/64 md:ml-auto">
            Every surface is tuned for the repeated moves that make writing
            better: accept, reject, compare, restore, and publish without losing
            the thread.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="group flex min-h-[320px] flex-col rounded-lg border border-white/10 bg-white/[0.035] p-5 transition duration-500 hover:-translate-y-1 hover:border-[#d8b46b]/35 hover:bg-white/[0.06]"
              >
                <div className="flex size-11 items-center justify-center rounded-lg border border-white/10 bg-[#0b0a09] text-[#d8b46b] transition duration-500 group-hover:bg-[#d8b46b] group-hover:text-[#17120f]">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-[#f4eadb]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#f4eadb]/56">
                  {feature.copy}
                </p>
                <div className="mt-auto pt-8">
                  <FeatureDemo type={feature.demo} />
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
