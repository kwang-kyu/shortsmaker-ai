interface OptionChipsProps<T extends string | number> {
  label: string;
  options: { value: T; label: string; description?: string }[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
}

export function OptionChips<T extends string | number>({
  label,
  options,
  value,
  onChange,
  columns = 3,
}: OptionChipsProps<T>) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className={`chip-grid chip-grid--${columns}`}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              className={`chip-option${active ? " chip-option--active" : ""}`}
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
            >
              <span className="chip-option__label">{opt.label}</span>
              {opt.description ? (
                <span className="chip-option__desc">{opt.description}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
