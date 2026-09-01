import { Rule, Action, ActionType } from '../../types/rules';
import { VideoRecord } from '../../types/video';
import { Settings } from '../../types/settings';
import { isRuleActionExecuted as dbIsRuleActionExecuted, saveRuleExecution as dbSaveRuleExecution } from '../../database/indexeddb';
import { safeSendMessage } from '../utils/runtime';

export interface ActionPlanItem {
  rule: Rule;
  action: Action;
  video: VideoRecord;
}

/**
 * Сервис проверки и планирования выполнения правил автоматизации.
 * Проверяет кулдауны, идемпотентность и направляет логи через background.
 */
export class ActionEngine {
  private activeCooldowns: Map<string, number> = new Map(); // Key: actionType, Value: timestamp

  public async filterExecutableActions(
    rules: Rule[],
    video: VideoRecord,
    settings: Settings
  ): Promise<ActionPlanItem[]> {
    if (!settings.enabled || settings.automationMode === 'disabled') {
      return [];
    }

    const plan: ActionPlanItem[] = [];

    for (const rule of rules) {
      if (!rule.enabled) continue;

      for (const action of rule.actions) {
        // 1. Проверка идемпотентности
        const alreadyExecuted = await this.checkActionExecuted(video.id, rule.id, action.type);
        if (alreadyExecuted) {
          continue;
        }

        // 2. Проверка кулдауна (минимум 5 секунд между одинаковыми действиями)
        const lastExecutedAt = this.activeCooldowns.get(action.type) || 0;
        if (Date.now() - lastExecutedAt < 5000) {
          continue;
        }

        plan.push({ rule, action, video });
      }
    }

    return plan;
  }

  private async checkActionExecuted(videoId: string, ruleId: string, actionType: ActionType): Promise<boolean> {
    const res = await safeSendMessage({
      type: 'CHECK_RULE_EXECUTED',
      payload: { videoId, ruleId, action: actionType },
    });
    if (res && typeof res.executed === 'boolean') {
      return res.executed;
    }

    try {
      return await dbIsRuleActionExecuted(videoId, ruleId, actionType);
    } catch {
      return false;
    }
  }

  public async recordExecutionSuccess(ruleId: string, videoId: string, actionType: ActionType): Promise<void> {
    this.activeCooldowns.set(actionType, Date.now());

    const res = await safeSendMessage({
      type: 'ACTION_EXECUTED_LOG',
      payload: {
        ruleId,
        videoId,
        action: actionType,
        status: 'success',
      },
    });
    if (res?.success) return;

    try {
      await dbSaveRuleExecution({
        id: `${videoId}_${ruleId}_${actionType}_${Date.now()}`,
        ruleId,
        videoId,
        action: actionType,
        executedAt: Date.now(),
        status: 'success',
      });
    } catch (e) {
      console.error('[YouTube Autopilot] Could not record execution success:', e);
    }
  }

  public async recordExecutionFailure(
    ruleId: string,
    videoId: string,
    actionType: ActionType,
    error: string
  ): Promise<void> {
    const res = await safeSendMessage({
      type: 'ACTION_EXECUTED_LOG',
      payload: {
        ruleId,
        videoId,
        action: actionType,
        status: 'failed',
        error,
      },
    });
    if (res?.success) return;

    try {
      await dbSaveRuleExecution({
        id: `${videoId}_${ruleId}_${actionType}_${Date.now()}`,
        ruleId,
        videoId,
        action: actionType,
        executedAt: Date.now(),
        status: 'failed',
        errorMessage: error,
      });
    } catch (e) {
      console.error('[YouTube Autopilot] Could not record execution failure:', e);
    }
  }
}
