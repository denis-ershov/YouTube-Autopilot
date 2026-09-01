export type ConditionType =
  | 'WATCHED_PERCENT'
  | 'TIMELINE_PERCENT'
  | 'REAL_WATCHED_PERCENT'
  | 'WATCHED_SECONDS'
  | 'VIDEO_DURATION'
  | 'CHANNEL'
  | 'SOURCE'
  | 'IS_SHORT'
  | 'IS_SUBSCRIBED';

export type Operator =
  | 'EQ'     // =
  | 'GT'     // >
  | 'LT'     // <
  | 'GTE'    // >=
  | 'LTE'    // <=
  | 'IN'     // входит в массив
  | 'NOT_IN' // не входит
  | 'IS'     // boolean равенство
  | 'IS_NOT';

export interface Condition {
  type: ConditionType;
  operator: Operator;
  value: unknown;
}

export type ActionType =
  | 'LIKE_VIDEO'
  | 'UNLIKE_VIDEO'
  | 'SAVE_VIDEO'
  | 'REMOVE_FROM_WATCH_LATER'
  | 'HIDE_VIDEO';

export interface Action {
  type: ActionType;
  options?: Record<string, unknown>;
}

export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: Condition[];
  actions: Action[];
  delay?: number; // задержка в секундах перед выполнением
  maxRetries?: number;
  createdAt: number;
  updatedAt: number;
}

export interface RuleExecution {
  id: string;
  ruleId: string;
  videoId: string;
  action: ActionType;
  executedAt: number;
  status: 'success' | 'failed' | 'skipped';
  errorMessage?: string;
}
