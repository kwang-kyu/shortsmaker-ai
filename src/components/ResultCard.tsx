import type { ReactNode } from "react";

interface ResultCardProps {
  title: string;
  copyText: string;
  onCopy: (text: string) => void;
  children: ReactNode;
}

export function ResultCard({
  title,
  copyText,
  onCopy,
  children,
}: ResultCardProps) {
  return (
    <section className="result-card">
      <header className="result-card__head">
        <h3 className="result-card__title">{title}</h3>
        <button
          type="button"
          className="btn-copy"
          onClick={() => onCopy(copyText)}
        >
          복사
        </button>
      </header>
      <div className="result-card__body">{children}</div>
    </section>
  );
}
