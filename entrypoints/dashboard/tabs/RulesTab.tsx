import { useState } from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../src/components/PageHeader';
import { describeConditions, getActionLabel, getRuleDisplayName } from '../../../src/core/rules/labels';
import { AVAILABLE_PRESET_RULES } from '../../../src/core/storage/storage';
import { t } from '../../../src/i18n';
import { Rule } from '../../../src/types/rules';
import { RuleForm } from './RuleForm';

interface RulesTabProps {
  rules: Rule[];
  defaultThreshold: number;
  onCreate: (rule: Rule) => void;
  onToggle: (rule: Rule) => void;
  onDelete: (rule: Rule) => void;
}

function RuleCard({ rule, onToggle, onDelete }: { rule: Rule; onToggle: () => void; onDelete: () => void }) {
  const name = getRuleDisplayName(rule);
  return (
    <article className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:border-zinc-700 transition-colors duration-200">
      <div className="space-y-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-sm text-zinc-100">{name}</h3>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              rule.enabled
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {rule.enabled ? t('common.active') : t('common.disabled')}
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          <span className="text-brand-400 font-medium">{t('dashboard.rules.when')}</span>{' '}
          {describeConditions(rule.conditions)}{' '}
          <span className="text-brand-400 font-medium">{t('dashboard.rules.then')}</span>{' '}
          {rule.actions.map((a) => getActionLabel(a.type)).join(', ')}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button type="button" onClick={onToggle} className={rule.enabled ? 'btn-secondary' : 'btn-primary'}>
          {rule.enabled ? t('dashboard.rules.disable') : t('dashboard.rules.enable')}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="btn-ghost px-3 hover:text-rose-400 hover:bg-rose-500/10"
          aria-label={`${t('common.delete')}: ${name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}

export function RulesTab({ rules, defaultThreshold, onCreate, onToggle, onDelete }: RulesTabProps) {
  const [isCreating, setIsCreating] = useState(false);

  const addPreset = (preset: Rule) => {
    const now = Date.now();
    onCreate({ ...preset, id: `rule-${now}`, name: getRuleDisplayName(preset), createdAt: now, updatedAt: now });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={t('dashboard.rules.title')}
        subtitle={t('dashboard.rules.subtitle')}
        actions={
          <button type="button" onClick={() => setIsCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>{t('dashboard.rules.create')}</span>
          </button>
        }
      />

      <section className="card bg-zinc-900/80 space-y-3" aria-labelledby="presets-title">
        <h3 id="presets-title" className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" aria-hidden="true" />
          <span>{t('dashboard.rules.presets')}</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_PRESET_RULES.map((preset) => (
            <button key={preset.id} type="button" onClick={() => addPreset(preset)} className="btn-secondary">
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              {getRuleDisplayName(preset)}
            </button>
          ))}
        </div>
      </section>

      {isCreating && (
        <RuleForm
          defaultThreshold={defaultThreshold}
          onCancel={() => setIsCreating(false)}
          onSubmit={(rule) => {
            onCreate(rule);
            setIsCreating(false);
          }}
        />
      )}

      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
            {t('dashboard.rules.empty')}
          </div>
        ) : (
          rules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} onToggle={() => onToggle(rule)} onDelete={() => onDelete(rule)} />
          ))
        )}
      </div>
    </div>
  );
}
