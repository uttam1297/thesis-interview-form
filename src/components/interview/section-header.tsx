interface SectionHeaderProps {
  /** Human-facing section label, e.g. "Data and AI" — never "Section 3". */
  section: string;
}

export function SectionHeader({ section }: SectionHeaderProps) {
  return (
    <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
      {section}
    </p>
  );
}
