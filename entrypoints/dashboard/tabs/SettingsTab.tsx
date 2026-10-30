import { Timer, FastForward, Zap, Shield, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { ChoiceCard } from '../../../src/components/ChoiceCard';
import { PageHeader } from '../../../src/components/PageHeader';
import { t } from '../../../src/i18n';
import { AutomationMode, Settings, WatchTrackingMode } from '../../../src/types/settings';

interface SettingsTabProps {
  settings: Settings;
  onChange: (updated: Partial<Settings>) => void;
}

const ICON = 'w-5 h-5';

const WATCH_MODES: { mode: WatchTrackingMode; icon: ReactNode; titleKey: string; descKey: string }[] = [
  {
    mode: 'real',
    icon: <Timer className={ICON} />,
    titleKey: 'dashboard.settings.watchModeReal',
    descKey: 'dashboard.settings.watchModeRealDesc',
  },
  {
    mode: 'position',
    icon: <FastForward className={ICON} />,
    titleKey: 'dashboard.settings.watchModePosition',
    descKey: 'dashboard.settings.watchModePositionDesc',
  },
  {
    mode: 'hybrid',
    icon: <Zap className={ICON} />,
    titleKey: 'dashboard.settings.watchModeHybrid',
    descKey: 'dashboard.settings.watchModeHybridDesc',
  },
];

const AUTOMATION_MODES: { mode: AutomationMode; icon: ReactNode; titleKey: string; descKey: string }[] = [
  {
    mode: 'approval',
    icon: <Shield className={ICON} />,
    titleKey: 'dashboard.settings.modeApproval',
    descKey: 'onboarding.approvalDesc',
  },
  {
    mode: 'automatic',
    icon: <Sparkles className={ICON} />,
    titleKey: 'dashboard.settings.modeAuto',
    descKey: 'onboarding.autoDesc',
  },
];

export function SettingsTab({ settings, onChange }: SettingsTabProps) {
  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader title={t('dashboard.settings.title')} subtitle={t('dashboard.settings.subtitle')} />

      <section className="space-y-3" aria-labelledby="watch-mode-title">
        <div>
          <h3 id="watch-mode-title" className="text-sm font-semibold text-zinc-200">
            {t('dashboard.settings.watchMode')}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">{t('dashboard.settings.watchModeSubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-labelledby="watch-mode-title">
          {WATCH_MODES.map(({ mode, icon, titleKey, descKey }) => (
            <ChoiceCard
              key={mode}
              selected={settings.watchMode === mode}
              onSelect={() => onChange({ watchMode: mode })}
              icon={icon}
              title={t(titleKey)}
              description={t(descKey)}
              badge={
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                  {t(`popup.watchModeBadge.${mode}`)}
                </span>
              }
            />
          ))}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="automation-mode-title">
        <h3 id="automation-mode-title" className="text-sm font-semibold text-zinc-200">
          {t('dashboard.settings.automationMode')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="radiogroup" aria-labelledby="automation-mode-title">
          {AUTOMATION_MODES.map(({ mode, icon, titleKey, descKey }) => (
            <ChoiceCard
              key={mode}
              selected={settings.automationMode === mode}
              onSelect={() => onChange({ automationMode: mode })}
              icon={icon}
              title={t(titleKey)}
              description={t(descKey)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
