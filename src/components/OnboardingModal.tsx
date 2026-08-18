import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Shield, Heart, ArrowRight } from 'lucide-react';
import { AutomationMode } from '../types/settings';
import { t } from '../i18n';

interface OnboardingModalProps {
  onComplete: (config: { threshold: number; mode: AutomationMode; automations: string[] }) => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [threshold, setThreshold] = useState(90);
  const [mode, setMode] = useState<AutomationMode>('approval');
  const [automations, setAutomations] = useState<string[]>(['like', 'watchLater', 'realWatch']);

  const toggleAutomation = (id: string) => {
    setAutomations((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onComplete({ threshold, mode, automations });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-800">
          <span className="font-semibold text-brand-400">
            {t('onboarding.step', { step, total: 4 })}
          </span>
          <span>{t('onboarding.header')}</span>
        </div>

        {/* STEP 1: Welcome */}
        {step === 1 && (
          <div className="space-y-4 text-center py-4">
            <div className="w-14 h-14 bg-brand-600/20 border border-brand-500/30 rounded-2xl flex items-center justify-center mx-auto text-3xl">
              🤖
            </div>
            <h2 className="text-xl font-bold text-zinc-100">{t('onboarding.welcomeTitle')}</h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              {t('onboarding.welcomeDesc')}
            </p>
          </div>
        )}

        {/* STEP 2: What to automate */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-zinc-100">{t('onboarding.automateTitle')}</h2>
            <div className="space-y-2.5">
              <label
                onClick={() => toggleAutomation('like')}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  automations.includes('like')
                    ? 'bg-brand-600/10 border-brand-500/40 text-zinc-100'
                    : 'bg-zinc-800/40 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>{t('onboarding.autoLikeDesc')}</span>
                </div>
                <input type="checkbox" checked={automations.includes('like')} readOnly className="rounded" />
              </label>

              <label
                onClick={() => toggleAutomation('watchLater')}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  automations.includes('watchLater')
                    ? 'bg-brand-600/10 border-brand-500/40 text-zinc-100'
                    : 'bg-zinc-800/40 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{t('onboarding.watchLaterDesc')}</span>
                </div>
                <input type="checkbox" checked={automations.includes('watchLater')} readOnly className="rounded" />
              </label>

              <label
                onClick={() => toggleAutomation('realWatch')}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  automations.includes('realWatch')
                    ? 'bg-brand-600/10 border-brand-500/40 text-zinc-100'
                    : 'bg-zinc-800/40 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{t('onboarding.realWatchDesc')}</span>
                </div>
                <input type="checkbox" checked={automations.includes('realWatch')} readOnly className="rounded" />
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: Completion Threshold */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-zinc-100">{t('onboarding.thresholdTitle')}</h2>
            <p className="text-xs text-zinc-400">{t('onboarding.thresholdDesc')}</p>
            
            <div className="bg-zinc-800/60 p-4 rounded-xl border border-zinc-700/50 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">{t('onboarding.thresholdLabel')}</span>
                <span className="font-bold text-brand-400 text-sm">{threshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Automation Mode */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-zinc-100">{t('onboarding.modeTitle')}</h2>
            <div className="space-y-2.5">
              <label
                onClick={() => setMode('approval')}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  mode === 'approval'
                    ? 'bg-brand-600/10 border-brand-500/40 text-zinc-100'
                    : 'bg-zinc-800/40 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-zinc-100">{t('onboarding.approvalTitle')}</p>
                    <p className="text-[11px] text-zinc-400">{t('onboarding.approvalDesc')}</p>
                  </div>
                </div>
                <input type="radio" checked={mode === 'approval'} readOnly />
              </label>

              <label
                onClick={() => setMode('automatic')}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  mode === 'automatic'
                    ? 'bg-brand-600/10 border-brand-500/40 text-zinc-100'
                    : 'bg-zinc-800/40 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  <div>
                    <p className="font-semibold text-zinc-100">{t('onboarding.autoTitle')}</p>
                    <p className="text-[11px] text-zinc-400">{t('onboarding.autoDesc')}</p>
                  </div>
                </div>
                <input type="radio" checked={mode === 'automatic'} readOnly />
              </label>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5"
            >
              {t('common.back')}
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-brand-900/30 transition-all"
          >
            <span>{step === 4 ? t('common.finish') : t('common.continue')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
