import { Rule, Condition, Operator } from '../../types/rules';
import { VideoRecord } from '../../types/video';

/** Видео с признаками, известными только в момент просмотра (не хранятся в IndexedDB). */
export type RuleVideoContext = VideoRecord & { isSubscribed?: boolean; isShort?: boolean };

export class RuleEngine {
  public static evaluateRule(rule: Rule, video: RuleVideoContext): boolean {
    if (!rule.enabled) return false;
    if (rule.conditions.length === 0) return false;

    // Все условия правила должны выполняться (AND логика)
    return rule.conditions.every((condition) => this.evaluateCondition(condition, video));
  }

  public static evaluateCondition(condition: Condition, video: RuleVideoContext): boolean {
    const { type, operator, value } = condition;

    switch (type) {
      case 'WATCHED_PERCENT':
        return this.compareNumeric(video.watchedPercent, operator, Number(value));

      case 'TIMELINE_PERCENT':
        return this.compareNumeric(video.maxTimelinePercent ?? video.watchedPercent, operator, Number(value));

      case 'REAL_WATCHED_PERCENT':
        return this.compareNumeric(video.realWatchedPercent ?? video.watchedPercent, operator, Number(value));

      case 'WATCHED_SECONDS':
        return this.compareNumeric(video.watchedSeconds, operator, Number(value));

      case 'VIDEO_DURATION':
        return this.compareNumeric(video.duration, operator, Number(value));

      case 'CHANNEL':
        if (!video.channelName && !video.channelId) return false;
        return this.compareString(video.channelName || video.channelId || '', operator, value);

      case 'SOURCE':
        return this.compareString(video.source || '', operator, value);

      case 'IS_SHORT':
        return this.compareBoolean(Boolean(video.isShort), operator, value);

      case 'IS_SUBSCRIBED':
        return this.compareBoolean(Boolean(video.isSubscribed), operator, value);

      default:
        return false;
    }
  }

  private static compareBoolean(actual: boolean, operator: Operator, target: unknown): boolean {
    if (operator === 'IS') return actual === Boolean(target);
    if (operator === 'IS_NOT') return actual !== Boolean(target);
    return false;
  }

  private static compareNumeric(actual: number, operator: Operator, target: number): boolean {
    switch (operator) {
      case 'EQ':
        return actual === target;
      case 'GT':
        return actual > target;
      case 'LT':
        return actual < target;
      case 'GTE':
        return actual >= target;
      case 'LTE':
        return actual <= target;
      default:
        return false;
    }
  }

  private static compareString(actual: string, operator: Operator, target: unknown): boolean {
    const actualLower = actual.toLowerCase();

    if (operator === 'EQ') {
      return actualLower === String(target).toLowerCase();
    }
    if (operator === 'IN' && Array.isArray(target)) {
      return target.some((t) => String(t).toLowerCase() === actualLower);
    }
    if (operator === 'NOT_IN' && Array.isArray(target)) {
      return !target.some((t) => String(t).toLowerCase() === actualLower);
    }

    return false;
  }
}
