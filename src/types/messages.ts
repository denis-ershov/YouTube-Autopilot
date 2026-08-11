import { VideoRecord } from './video';
import { Settings } from './settings';
import { Rule, ActionType } from './rules';

export type ExtensionMessageType =
  | 'VIDEO_STARTED'
  | 'PROGRESS_UPDATE'
  | 'EVALUATE_RULES'
  | 'EXECUTE_ACTION'
  | 'ACTION_EXECUTED_LOG'
  | 'GET_CURRENT_VIDEO_STATUS'
  | 'CURRENT_VIDEO_STATUS_RESPONSE'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'GET_RULES'
  | 'SAVE_RULE'
  | 'DELETE_RULE'
  | 'APPROVE_ACTION'
  | 'REJECT_ACTION'
  | 'SHOW_APPROVAL_MODAL';

export interface ExtensionMessage<T = unknown> {
  type: ExtensionMessageType;
  payload?: T;
}

export interface VideoStartedPayload {
  videoId: string;
  url: string;
  title: string;
  channelId?: string;
  channelName?: string;
  duration: number;
}

export interface ProgressUpdatePayload {
  videoId: string;
  watchedSeconds: number;
  watchedPercent: number;
  intervals: [number, number][];
}

export interface ExecuteActionPayload {
  ruleId: string;
  videoId: string;
  action: ActionType;
}

export interface ApprovalPayload {
  approvalId: string;
  ruleName: string;
  videoTitle: string;
  action: ActionType;
  videoId: string;
}
