import { t } from '../../i18n';
import { ActionType, Condition, Operator, PERCENT_CONDITION_TYPES, Rule } from '../../types/rules';

/**
 * Пресеты хранят в `name` ключ локализации (`likeCompleted`), пользовательские правила — свободный текст.
 * Единая точка преобразования в отображаемое имя для Dashboard и баннера подтверждения.
 */
export function getRuleDisplayName(rule: Pick<Rule, 'name'>): string {
  return t(`presets.${rule.name}`, undefined, rule.name);
}

export function getActionLabel(action: ActionType | undefined): string {
  if (!action) return '';
  return t(`common.actions.${action}`, undefined, action);
}

const OPERATOR_SYMBOLS: Record<Operator, string> = {
  EQ: '=',
  GT: '>',
  LT: '<',
  GTE: '≥',
  LTE: '≤',
  IN: '∈',
  NOT_IN: '∉',
  IS: '=',
  IS_NOT: '≠',
};

function formatConditionValue(condition: Condition): string {
  const { type, value } = condition;
  if (PERCENT_CONDITION_TYPES.has(type)) return `${String(value)}%`;
  if (type === 'SOURCE') return t(`dashboard.rules.sources.${String(value)}`, undefined, String(value));
  if (typeof value === 'boolean') return value ? t('common.on') : t('common.off');
  return Array.isArray(value) ? value.join(', ') : String(value);
}

/** Человекочитаемое описание всех условий правила: «Источник = Смотреть позже И Просмотр ≥ 80%». */
export function describeConditions(conditions: Condition[]): string {
  return conditions
    .map((c) => {
      const label = t(`dashboard.rules.conditions.${c.type}`, undefined, c.type);
      return `${label} ${OPERATOR_SYMBOLS[c.operator]} ${formatConditionValue(c)}`;
    })
    .join(` ${t('dashboard.rules.and')} `);
}
