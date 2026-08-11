import { Rule, Action } from '../../types/rules';
import { VideoRecord } from '../../types/video';
import { Settings } from '../../types/settings';
import { isRuleActionExecuted, saveRuleExecution } from '../../database/indexeddb';

export interface ActionPlanItem {
  rule: Rule;
  action: Action;
  video: VideoRecord;
}

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
        const alreadyExecuted = await isRuleActionExecuted(video.id, rule.id, action.type);
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

  public async recordExecutionSuccess(ruleId: string, videoId: string, actionType: any): Promise<void> {
    this.activeCooldowns.set(actionType, Date.now());
    await saveRuleExecution({
      id: `${videoId}_${ruleId}_${actionType}_${Date.now()}`,
      ruleId,
      videoId,
      action: actionType,
      executedAt: Date.now(),
      status: 'success',
    });
  }

  public async recordExecutionFailure(ruleId: string, videoId: string, actionType: any, error: string): Promise<void> {
    await saveRuleExecution({
      id: `${videoId}_${ruleId}_${actionType}_${Date.now()}`,
      ruleId,
      videoId,
      action: actionType,
      executedAt: Date.now(),
      status: 'failed',
      errorMessage: error,
    });
  }
}
