import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { t, setLanguage } from '../../src/i18n';
import { getSettings, saveSettings, getRules, saveRule, deleteRule, isOnboardingCompleted } from '../../src/core/storage/storage';
import { completeOnboarding, OnboardingConfig } from '../../src/core/onboarding';
import { getRuleDisplayName } from '../../src/core/rules/labels';
import { getAllVideos, getAllRuleExecutions } from '../../src/database/indexeddb';
import { Settings } from '../../src/types/settings';
import { Rule, RuleExecution } from '../../src/types/rules';
import { VideoRecord } from '../../src/types/video';
import { OnboardingModal } from '../../src/components/OnboardingModal';
import { Sidebar, DashboardTab } from './Sidebar';
import { OverviewTab } from './tabs/OverviewTab';
import { RulesTab } from './tabs/RulesTab';
import { HistoryTab } from './tabs/HistoryTab';
import { SettingsTab } from './tabs/SettingsTab';

interface DashboardData {
  settings: Settings;
  rules: Rule[];
  videos: VideoRecord[];
  executions: RuleExecution[];
  showOnboarding: boolean;
}

async function loadDashboardData(): Promise<DashboardData> {
  const [settings, rules, videos, executions, onboarded] = await Promise.all([
    getSettings(),
    getRules(),
    getAllVideos(),
    getAllRuleExecutions(),
    isOnboardingCompleted(),
  ]);
  return { settings, rules, videos, executions, showOnboarding: !onboarded };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    loadDashboardData()
      .then(setData)
      .catch((err: unknown) => {
        console.error('[YouTube Autopilot] Dashboard load failed:', err);
        setLoadError(true);
      });
  }, []);

  if (loadError) {
    return (
      <div role="alert" className="flex flex-col items-center justify-center min-h-screen gap-3 p-6 text-center text-zinc-400">
        <AlertTriangle className="w-8 h-8 text-amber-400" aria-hidden="true" />
        <p className="text-sm">{t('dashboard.loadError')}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-zinc-400" aria-busy="true">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  const { settings, rules, videos, executions, showOnboarding } = data;

  const updateSettings = async (patch: Partial<Settings>) => {
    const updated = { ...settings, ...patch };
    if (patch.language) setLanguage(patch.language);
    setData({ ...data, settings: updated });
    await saveSettings(updated);
  };

  const handleOnboardingComplete = async (config: OnboardingConfig) => {
    const updated = await completeOnboarding(settings, config);
    setData({ ...data, settings: updated, rules: await getRules(), showOnboarding: false });
  };

  const handleCreateRule = async (rule: Rule) => {
    await saveRule(rule);
    setData({ ...data, rules: [...rules, rule] });
  };

  const handleToggleRule = async (rule: Rule) => {
    const updated = { ...rule, enabled: !rule.enabled };
    await saveRule(updated);
    setData({ ...data, rules: rules.map((r) => (r.id === rule.id ? updated : r)) });
  };

  const handleDeleteRule = async (rule: Rule) => {
    if (!window.confirm(t('dashboard.rules.deleteConfirm', { name: getRuleDisplayName(rule) }))) return;
    await deleteRule(rule.id);
    setData({ ...data, rules: rules.filter((r) => r.id !== rule.id) });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        language={settings.language}
        onLanguageChange={(language) => updateSettings({ language })}
      />

      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8">
        {activeTab === 'overview' && <OverviewTab videos={videos} executions={executions} />}
        {activeTab === 'rules' && (
          <RulesTab
            rules={rules}
            defaultThreshold={settings.defaultThreshold}
            onCreate={handleCreateRule}
            onToggle={handleToggleRule}
            onDelete={handleDeleteRule}
          />
        )}
        {activeTab === 'history' && <HistoryTab videos={videos} />}
        {activeTab === 'settings' && <SettingsTab settings={settings} onChange={updateSettings} />}
      </main>
    </div>
  );
}
