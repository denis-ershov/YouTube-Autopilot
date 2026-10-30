import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

interface ChoiceCardProps {
  selected: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  description?: string;
  badge?: ReactNode;
  /** radio — выбор одного варианта из группы, checkbox — независимый переключатель. */
  variant?: 'radio' | 'checkbox';
}

/**
 * Карточка выбора варианта: режимы отслеживания, режимы автоматизации, шаги онбординга.
 * Нативная кнопка — фокус, Enter/Space и aria-состояние без дополнительного кода.
 */
export function ChoiceCard({
  selected,
  onSelect,
  icon,
  title,
  description,
  badge,
  variant = 'radio',
}: ChoiceCardProps) {
  const ariaState = variant === 'radio' ? { role: 'radio', 'aria-checked': selected } : { 'aria-pressed': selected };

  return (
    <button
      type="button"
      onClick={onSelect}
      {...ariaState}
      className={`w-full min-h-[44px] p-4 rounded-xl border text-start transition-colors duration-200 flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
        selected
          ? 'bg-brand-600/10 border-brand-500/50'
          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <span
        className={`p-2 rounded-lg shrink-0 ${selected ? 'bg-brand-500/20 text-brand-400' : 'bg-zinc-800 text-zinc-400'}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-100">{title}</span>
          {badge}
        </span>
        {description && <span className="block text-[11px] text-zinc-400 mt-1 leading-relaxed">{description}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`w-5 h-5 shrink-0 border flex items-center justify-center ${
          variant === 'radio' ? 'rounded-full' : 'rounded-md'
        } ${selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-zinc-700'}`}
      >
        {selected && <Check className="w-3 h-3" />}
      </span>
    </button>
  );
}
