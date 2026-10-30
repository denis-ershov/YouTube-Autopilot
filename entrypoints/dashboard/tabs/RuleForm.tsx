import { useState, type FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { getActionLabel } from '../../../src/core/rules/labels';
import { t } from '../../../src/i18n';
import { ActionType, Rule } from '../../../src/types/rules';

type PercentCondition = 'WATCHED_PERCENT' | 'TIMELINE_PERCENT';

/** REMOVE_FROM_WATCH_LATER не предлагается: DOM-действие пока не реализовано надёжно (см. PARSING_ARCHITECTURE.md). */
const ACTIONS: ActionType[] = ['LIKE_VIDEO', 'SAVE_VIDEO', 'HIDE_VIDEO'];

interface RuleFormProps {
  defaultThreshold: number;
  onSubmit: (rule: Rule) => void;
  onCancel: () => void;
}

export function RuleForm({ defaultThreshold, onSubmit, onCancel }: RuleFormProps) {
  const [name, setName] = useState('');
  const [threshold, setThreshold] = useState(defaultThreshold);
  const [conditionType, setConditionType] = useState<PercentCondition>('WATCHED_PERCENT');
  const [action, setAction] = useState<ActionType>('LIKE_VIDEO');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const now = Date.now();
    onSubmit({
      id: `rule-${now}`,
      name: trimmed,
      enabled: true,
      conditions: [{ type: conditionType, operator: 'GTE', value: Math.min(100, Math.max(1, threshold)) }],
      actions: [{ type: action }],
      delay: 0,
      createdAt: now,
      updatedAt: now,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card border-brand-500/40 p-5 space-y-4 shadow-xl">
      <h3 className="text-sm font-semibold text-brand-400 flex items-center gap-2">
        <Sparkles className="w-4 h-4" aria-hidden="true" />
        <span>{t('dashboard.rules.newRuleTitle')}</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="rule-name" className="block text-xs font-medium text-zinc-400 mb-1">
            {t('dashboard.rules.ruleName')}
          </label>
          <input
            id="rule-name"
            type="text"
            required
            maxLength={80}
            placeholder={t('dashboard.rules.placeholderName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
          />
        </div>

        <div>
          <label htmlFor="rule-condition" className="block text-xs font-medium text-zinc-400 mb-1">
            {t('dashboard.rules.conditionLabel')}
          </label>
          <select
            id="rule-condition"
            value={conditionType}
            onChange={(e) => setConditionType(e.target.value as PercentCondition)}
            className="field"
          >
            <option value="WATCHED_PERCENT">{t('onboarding.trackModeReal')}</option>
            <option value="TIMELINE_PERCENT">{t('onboarding.trackModePosition')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="rule-threshold" className="block text-xs font-medium text-zinc-400 mb-1">
            {t('dashboard.rules.thresholdLabel')}
          </label>
          <input
            id="rule-threshold"
            type="number"
            min="1"
            max="100"
            required
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="field"
          />
        </div>

        <div>
          <label htmlFor="rule-action" className="block text-xs font-medium text-zinc-400 mb-1">
            {t('dashboard.rules.actionLabel')}
          </label>
          <select
            id="rule-action"
            value={action}
            onChange={(e) => setAction(e.target.value as ActionType)}
            className="field"
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {getActionLabel(a)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">
          {t('common.cancel')}
        </button>
        <button type="submit" className="btn-primary">
          {t('dashboard.rules.save')}
        </button>
      </div>
    </form>
  );
}
