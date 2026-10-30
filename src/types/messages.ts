import { ActionType, RuleExecution } from './rules';

/**
 * Типы сообщений, которые реально обрабатывает Background Service Worker.
 * Любой новый тип обязан иметь обработчик в `entrypoints/background.ts`
 * и описание в `docs/API_ARCHITECTURE.md`.
 */
export type ExtensionMessageType =
  | 'VIDEO_STARTED'
  | 'PROGRESS_UPDATE'
  | 'ACTION_EXECUTED_LOG'
  | 'CHECK_ACTION_EXECUTED'
  | 'GET_VIDEO_RECORD'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'GET_RULES'
  | 'SAVE_RULE'
  | 'DELETE_RULE';

export interface ExtensionMessage<T = unknown> {
  type: ExtensionMessageType;
  payload?: T;
}

export interface VideoStartedPayload {
  videoId: string;
  url: string;
  title: string;
  channelName?: string;
  duration: number;
}

export interface ProgressUpdatePayload {
  videoId: string;
  watchedSeconds: number;
  watchedPercent: number;
  realWatchedSeconds?: number;
  realWatchedPercent?: number;
  maxPositionSeconds?: number;
  maxTimelinePercent?: number;
  intervals: [number, number][];
}

export interface CheckActionExecutedPayload {
  videoId: string;
  action: ActionType;
}

export interface ActionExecutedLogPayload extends CheckActionExecutedPayload {
  ruleId: string;
  status: RuleExecution['status'];
  error?: string;
}
