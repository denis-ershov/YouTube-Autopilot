import type { ReactNode } from 'react';
import { Clock, CheckCircle2, Sparkles, Heart } from 'lucide-react';
import { PageHeader } from '../../../src/components/PageHeader';
import { formatSeconds, t } from '../../../src/i18n';
import { RuleExecution } from '../../../src/types/rules';
import { COMPLETION_PERCENT, VideoRecord } from '../../../src/types/video';

interface OverviewTabProps {
  videos: VideoRecord[];
  executions: RuleExecution[];
}

function StatCard({ label, value, icon }: { label: string; value: ReactNode; icon: ReactNode }) {
  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between gap-2 text-zinc-400 text-xs">
        <span>{label}</span>
        <span aria-hidden="true">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
    </div>
  );
}

export function OverviewTab({ videos, executions }: OverviewTabProps) {
  const totalWatchedSec = videos.reduce((sum, v) => sum + (v.watchedSeconds || 0), 0);
  const completedCount = videos.filter((v) => (v.watchedPercent || 0) >= COMPLETION_PERCENT).length;
  const successful = executions.filter((e) => e.status === 'success');
  const likesCount = successful.filter((e) => e.action === 'LIKE_VIDEO').length;

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader title={t('dashboard.overview.statsTitle')} subtitle={t('dashboard.overview.subtitle')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('dashboard.overview.totalWatched')}
          value={formatSeconds(totalWatchedSec)}
          icon={<Clock className="w-4 h-4 text-brand-400" />}
        />
        <StatCard
          label={t('dashboard.overview.completedVideos')}
          value={completedCount}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          label={t('dashboard.overview.actionsExecuted')}
          value={successful.length}
          icon={<Sparkles className="w-4 h-4 text-amber-400" />}
        />
        <StatCard
          label={t('dashboard.overview.likesGiven')}
          value={likesCount}
          icon={<Heart className="w-4 h-4 text-rose-400" />}
        />
      </div>
    </div>
  );
}
