import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { VideoRecord } from '../types/video';
import { ActionType, RuleExecution } from '../types/rules';

interface YouTubeAutopilotDB extends DBSchema {
  videos: {
    key: string;
    value: VideoRecord;
    indexes: {
      'by-updatedAt': number;
      'by-channelId': string;
    };
  };
  rule_executions: {
    key: string;
    value: RuleExecution;
    indexes: {
      'by-videoId': string;
      'by-ruleId': string;
      'by-executedAt': number;
    };
  };
}

const DB_NAME = 'youtube-autopilot-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<YouTubeAutopilotDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<YouTubeAutopilotDB>> {
  if (!dbPromise) {
    dbPromise = openDB<YouTubeAutopilotDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store: videos
        if (!db.objectStoreNames.contains('videos')) {
          const videoStore = db.createObjectStore('videos', { keyPath: 'id' });
          videoStore.createIndex('by-updatedAt', 'updatedAt');
          videoStore.createIndex('by-channelId', 'channelId');
        }

        // Store: rule_executions
        if (!db.objectStoreNames.contains('rule_executions')) {
          const execStore = db.createObjectStore('rule_executions', { keyPath: 'id' });
          execStore.createIndex('by-videoId', 'videoId');
          execStore.createIndex('by-ruleId', 'ruleId');
          execStore.createIndex('by-executedAt', 'executedAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveVideoRecord(video: VideoRecord): Promise<void> {
  const db = await getDB();
  await db.put('videos', video);
}

export async function getVideoRecord(id: string): Promise<VideoRecord | undefined> {
  const db = await getDB();
  return db.get('videos', id);
}

/** Все видео, отсортированные от последних просмотренных к старым. */
export async function getAllVideos(): Promise<VideoRecord[]> {
  const db = await getDB();
  const videos = await db.getAllFromIndex('videos', 'by-updatedAt');
  return videos.reverse();
}

export async function saveRuleExecution(exec: RuleExecution): Promise<void> {
  const db = await getDB();
  await db.put('rule_executions', exec);
}

/** Было ли действие успешно выполнено для видео любым правилом (идемпотентность на уровне видео). */
export async function isActionExecuted(videoId: string, action: ActionType): Promise<boolean> {
  const db = await getDB();
  const executions = await db.getAllFromIndex('rule_executions', 'by-videoId', videoId);
  return executions.some((e) => e.action === action && e.status === 'success');
}

export async function getAllRuleExecutions(): Promise<RuleExecution[]> {
  const db = await getDB();
  return db.getAll('rule_executions');
}
