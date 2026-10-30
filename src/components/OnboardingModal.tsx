import { useState } from 'react';
import { Sparkles, Shield, Heart, ArrowRight, FastForward, Timer } from 'lucide-react';
import { AutomationMode, WatchTrackingMode } from '../types/settings';
import { OnboardingAutomation, OnboardingConfig } from '../core/onboarding';
import { t } from '../i18n';
import { Logo } from './Logo';
import { ChoiceCard } from './ChoiceCard';

interface OnboardingModalProps {
  onComplete: (config: OnboardingConfig) => void;
}

const TOTAL_STEPS = 4;
const ICON = 'w-4 h-4';

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [threshold, setThreshold] = useState(90);
  const [watchMode, setWatchMode] = useState<WatchTrackingMode>('position');
  const [automationMode, setAutomationMode] = useState<AutomationMode>('approval');
  const [automations, setAutomations] = useState<OnboardingAutomation[]>(['like']);

  const toggleAutomation = (id: OnboardingAutomation) => {
    setAutomations((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      onComplete({ threshold, automationMode, automations, watchMode });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg max-h-full overflow-y-auto rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 pb-2 border-b border-zinc-800">
          <span className="font-semibold text-brand-400 shrink-0">
            {t('onboarding.step', { step, total: TOTAL_STEPS })}
          </span>
          <span className="text-end">{t('onboarding.header')}</span>
        </div>

        {step === 1 && (
          <div className="space-y-4 text-center py-4">
            <Logo size={64} className="mx-auto" />
            <h2 id="onboarding-title" className="text-xl font-bold text-zinc-100">
              {t('onboarding.welcomeTitle')}
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">{t('onboarding.welcomeDesc')}</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 id="onboarding-title" className="text-base font-bold text-zinc-100">
              {t('onboarding.automateTitle')}
            </h2>
            <div className="space-y-2.5">
              <ChoiceCard
                variant="checkbox"
                selected={automations.includes('like')}
                onSelect={() => toggleAutomation('like')}
                icon={<Heart className={ICON} />}
                title={t('onboarding.autoLikeDesc')}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 id="onboarding-title" className="text-base font-bold text-zinc-100">
                {t('onboarding.thresholdTitle')}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">{t('onboarding.thresholdDesc')}</p>
            </div>

            <div className="bg-zinc-800/60 p-4 rounded-xl border border-zinc-700/50 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="onboarding-threshold" className="text-zinc-400">
                  {t('onboarding.thresholdLabel')}
                </label>
                <span className="font-bold text-brand-400 text-sm">{threshold}%</span>
              </div>
              <input
                id="onboarding-threshold"
                type="range"
                min="50"
                max="100"
                step="5"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>

            <div className="space-y-2 pt-1" role="radiogroup" aria-label={t('onboarding.trackModeTitle')}>
              <p className="text-xs font-semibold text-zinc-300">{t('onboarding.trackModeTitle')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ChoiceCard
                  selected={watchMode === 'position'}
                  onSelect={() => setWatchMode('position')}
                  icon={<FastForward className={ICON} />}
                  title={t('onboarding.trackModePosition')}
                  description={t('onboarding.trackModePositionDesc')}
                />
                <ChoiceCard
                  selected={watchMode === 'real'}
                  onSelect={() => setWatchMode('real')}
                  icon={<Timer className={ICON} />}
                  title={t('onboarding.trackModeReal')}
                  description={t('onboarding.trackModeRealDesc')}
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 id="onboarding-title" className="text-base font-bold text-zinc-100">
              {t('onboarding.modeTitle')}
            </h2>
            <div className="space-y-2.5" role="radiogroup" aria-labelledby="onboarding-title">
              <ChoiceCard
                selected={automationMode === 'approval'}
                onSelect={() => setAutomationMode('approval')}
                icon={<Shield className={ICON} />}
                title={t('onboarding.approvalTitle')}
                description={t('onboarding.approvalDesc')}
              />
              <ChoiceCard
                selected={automationMode === 'automatic'}
                onSelect={() => setAutomationMode('automatic')}
                icon={<Sparkles className={ICON} />}
                title={t('onboarding.autoTitle')}
                description={t('onboarding.autoDesc')}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="min-h-[44px] text-xs text-zinc-400 hover:text-zinc-200 px-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {t('common.back')}
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="min-h-[44px] flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-5 rounded-xl text-xs font-semibold shadow-lg shadow-brand-900/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <span>{step === TOTAL_STEPS ? t('common.finish') : t('common.continue')}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
