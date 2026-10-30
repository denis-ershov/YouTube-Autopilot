import { Rule, Action, ActionType } from '../../types/rules';
import { VideoRecord } from '../../types/video';
import { Settings } from '../../types/settings';
import { RuleEngine, RuleVideoContext } from '../rules/RuleEngine';
import { safeSendMessage } from '../utils/runtime';

export interface ActionPlanItem {
  rule: Rule;
  action: Action;
  video: VideoRecord;
}

const COOLDOWN_MS = 5000;

function actionKey(videoId: string, action: ActionType): string {
  return `${videoId}:${action}`;
}

/**
 * Планировщик действий автоматизации в Content Script.
 *
 * Гарантии:
 * - условия правила проверяются до любых IPC-запросов (дешёвая проверка первой);
 * - одно действие на одно видео выполняется не более одного раза, даже если его требуют несколько правил;
 * - действие в ожидании (задержка/подтверждение) не планируется повторно;
 * - отклонённое пользователем или окончательно упавшее действие не повторяется до перезагрузки вкладки.
 *
 * Запись в IndexedDB делает только Background: у Content Script своя IndexedDB origin youtube.com.
 */
export class ActionEngine {
  private cooldowns = new Map<ActionType, number>();
  private pending = new Set<string>();
  private handled = new Set<string>();

  public async planActions(rules: Rule[], video: RuleVideoContext, settings: Settings): Promise<ActionPlanItem[]> {
    if (!settings.enabled || settings.automationMode === 'disabled') {
      return [];
    }

    const plan: ActionPlanItem[] = [];

    for (const rule of rules) {
      if (!RuleEngine.evaluateRule(rule, video)) continue;

      for (const action of rule.actions) {
        const key = actionKey(video.id, action.type);
        if (this.pending.has(key) || this.handled.has(key)) continue;
        if (Date.now() - (this.cooldowns.get(action.type) ?? 0) < COOLDOWN_MS) continue;

        // Резервируем ключ до await, чтобы параллельная оценка не запланировала дубль
        this.pending.add(key);
        if (await this.isAlreadyExecuted(video.id, action.type)) {
          this.pending.delete(key);
          this.handled.add(key);
          continue;
        }
        plan.push({ rule, action, video });
      }
    }

    return plan;
  }

  /** Пользователь отказался от действия (или баннер закрылся по таймауту). */
  public dismiss(item: ActionPlanItem): void {
    this.settle(item);
  }

  public async recordSuccess(item: ActionPlanItem): Promise<void> {
    this.cooldowns.set(item.action.type, Date.now());
    this.settle(item);
    await this.log(item, 'success');
  }

  public async recordFailure(item: ActionPlanItem, error: string): Promise<void> {
    this.settle(item);
    await this.log(item, 'failed', error);
  }

  private settle(item: ActionPlanItem): void {
    const key = actionKey(item.video.id, item.action.type);
    this.pending.delete(key);
    this.handled.add(key);
  }

  private async isAlreadyExecuted(videoId: string, action: ActionType): Promise<boolean> {
    const res = await safeSendMessage<{ success: boolean; executed?: boolean }>({
      type: 'CHECK_ACTION_EXECUTED',
      payload: { videoId, action },
    });
    return res?.executed === true;
  }

  private async log(item: ActionPlanItem, status: 'success' | 'failed', error?: string): Promise<void> {
    await safeSendMessage({
      type: 'ACTION_EXECUTED_LOG',
      payload: {
        ruleId: item.rule.id,
        videoId: item.video.id,
        action: item.action.type,
        status,
        error,
      },
    });
  }
}
