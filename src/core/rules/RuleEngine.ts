import { Rule, Condition } from '../../types/rules';
import { VideoRecord } from '../../types/video';

export class RuleEngine {
  public static evaluateRule(rule: Rule, video: VideoRecord & { isSubscribed?: boolean }): boolean {
    if (!rule.enabled) return false;
    if (rule.conditions.length === 0) return false;

    // Все условия правила должны выполняться (AND логика)
    return rule.conditions.every((condition) => this.evaluateCondition(condition, video));
  }

  public static evaluateCondition(condition: Condition, video: VideoRecord & { isSubscribed?: boolean }): boolean {
    const { type, operator, value } = condition;

    switch (type) {
      case 'WATCHED_PERCENT':
        return this.compareNumeric(video.watchedPercent, operator, Number(value));

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
        const isShort = video.duration > 0 && video.duration <= 60;
        return operator === 'IS' ? isShort === Boolean(value) : isShort !== Boolean(value);

      case 'IS_SUBSCRIBED':
        const sub = Boolean(video.isSubscribed);
        return operator === 'IS' ? sub === Boolean(value) : sub !== Boolean(value);

      default:
        return false;
    }
  }

  private static compareNumeric(actual: number, operator: string, target: number): boolean {
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

  private static compareString(actual: string, operator: string, target: unknown): boolean {
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
