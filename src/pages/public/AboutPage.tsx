import { Section, SectionHeading } from '@/components/Section'

export function AboutPage() {
  return (
    <Section>
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="ABOUT"
          title="Moving cars across oceans, one VIN at a time"
        />

        <div className="mt-8 space-y-6">
          <p className="text-lg leading-relaxed">
            Caspian Global Logistics (CGL) is an officially registered LLC
            logistics company built on years of experience in vehicle import and
            strong international partnerships. Our goal is to provide our
            clients with tr…
          </p>

          {/*
            TODO(content): the source page was truncated mid-sentence at
            "provide our clients with tr…" and the rest was never captured.
            The client needs to supply the remaining About copy; drop it in
            below and delete this placeholder block.
          */}
          <div className="border-border bg-gradient-subtle text-muted-foreground rounded-2xl border border-dashed p-6 text-sm">
            <p className="text-foreground font-semibold">
              TODO(content): remaining About copy
            </p>
            <p className="mt-2">
              The original page was captured only as far as “…provide our
              clients with tr…”. Everything after that sentence is still
              outstanding from the client.
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}
