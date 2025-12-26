import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full bg-gradient-to-b from-[var(--color-secondary)] to-transparent opacity-60"></div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">

            <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-[var(--color-foreground)]">
              Turn documents into answers you can trust
            </h1>
            <p className="text-[var(--color-foreground-muted)] text-lg">
              Upload PDFs, slides, or notes. Ask natural questions. Get responses with citations and highlights.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/chat" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-dark)] transition-colors">
                Start chatting
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors">
                Sign in
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                </div>
                <span className="text-xs text-[var(--color-foreground-muted)]">Preview</span>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <div className="max-w-[70%] px-3 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
                      Summarize section 3.2 of this PDF
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[80%] px-3 py-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-foreground)]">
                      Section 3.2 discusses the experimental setup...
                      <div className="mt-2 text-xs text-[var(--color-foreground-muted)]">Source: paper.pdf · page 12</div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[70%] px-3 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
                      Highlight key results
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[80%] px-3 py-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-foreground)]">
                      1) Accuracy improved by 8.2% on the benchmark...
                      <div className="mt-2 text-xs text-[var(--color-foreground-muted)]">Source: results.pptx · slide 18</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card-modern">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border)] inline-flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" d="M4 7h16M4 12h16M4 17h10"/></svg>
              </span>
              <h3 className="text-[var(--color-foreground)] font-medium">Multiple formats</h3>
            </div>
            <p className="text-sm text-[var(--color-foreground-muted)]">PDF, Word, slides, spreadsheets and more.</p>
          </div>
          <div className="card-modern">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border)] inline-flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" d="M12 3l6 3-6 3-6-3 6-3z"/></svg>
              </span>
              <h3 className="text-[var(--color-foreground)] font-medium">Citations built-in</h3>
            </div>
            <p className="text-sm text-[var(--color-foreground-muted)]">Every answer links back to the original content.</p>
          </div>
          <div className="card-modern">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border)] inline-flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" d="M9 12l2 2 4-4"/></svg>
              </span>
              <h3 className="text-[var(--color-foreground)] font-medium">Accurate and fast</h3>
            </div>
            <p className="text-sm text-[var(--color-foreground-muted)]">Optimized models for responsive and reliable answers.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-[var(--color-foreground)]">Ready to try it?</h3>
            <p className="text-sm text-[var(--color-foreground-muted)]">Import a file and ask your first question.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/chat" className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-dark)] transition-colors">
              Get started
            </Link>
            <Link href="/login" className="px-5 py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
