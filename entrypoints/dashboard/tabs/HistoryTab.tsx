import { useState } from 'react';
import { Filter, Heart } from 'lucide-react';
import { PageHeader } from '../../../src/components/PageHeader';
import { formatSeconds, t } from '../../../src/i18n';
import { COMPLETION_PERCENT, VideoRecord } from '../../../src/types/video';

type HistoryFilter = 'all' | 'completed' | 'liked' | 'saved';

const FILTERS: Record<HistoryFilter, (v: VideoRecord) => boolean> = {
  all: () => true,
  completed: (v) => (v.watchedPercent || 0) >= COMPLETION_PERCENT,
  liked: (v) => Boolean(v.liked),
  saved: (v) => Boolean(v.saved),
};

const FILTER_LABELS: Record<HistoryFilter, string> = {
  all: 'dashboard.history.allHistory',
  completed: 'dashboard.history.completed',
  liked: 'dashboard.history.liked',
  saved: 'dashboard.history.saved',
};

function VideoCard({ video }: { video: VideoRecord }) {
  return (
    <article className="card flex items-center justify-between gap-4 hover:border-zinc-700 transition-colors duration-200">
      <div className="space-y-1 min-w-0">
        <h3 className="text-xs font-semibold text-zinc-100 line-clamp-1">{video.title}</h3>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
          <span>{video.channelName || t('dashboard.history.creatorDefault')}</span>
          <span aria-hidden="true">•</span>
          <span>
            {t('dashboard.history.duration')}: {formatSeconds(video.duration)}
          </span>
          {video.liked && (
            <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded text-[10px]">
              <Heart className="w-3 h-3" aria-hidden="true" />
              {t('dashboard.history.liked')}
            </span>
          )}
        </div>
      </div>

      <div className="text-end space-y-1 shrink-0">
        <span className="text-xs font-bold text-brand-400">{video.watchedPercent}%</span>
        <p className="text-[10px] text-zinc-500">
          {t('dashboard.history.real')}: {formatSeconds(video.realWatchedSeconds ?? video.watchedSeconds)}
        </p>
      </div>
    </article>
  );
}

export function HistoryTab({ videos }: { videos: VideoRecord[] }) {
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const filtered = videos.filter(FILTERS[filter]);

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={t('dashboard.nav.history')}
        subtitle={t('dashboard.history.subtitle')}
        actions={
          <>
            <Filter className="w-4 h-4 text-zinc-500" aria-hidden="true" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as HistoryFilter)}
              aria-label={t('dashboard.nav.history')}
              className="field w-auto"
            >
              {(Object.keys(FILTER_LABELS) as HistoryFilter[]).map((key) => (
                <option key={key} value={key}>
                  {t(FILTER_LABELS[key], { percent: COMPLETION_PERCENT })}
                </option>
              ))}
            </select>
          </>
        }
      />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
            {t('dashboard.history.empty')}
          </div>
        ) : (
          filtered.map((video) => <VideoCard key={video.id} video={video} />)
        )}
      </div>
    </div>
  );
}
