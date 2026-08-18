import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Sliders,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Heart,
  Globe,
  Sparkles,
  Bookmark,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { t, formatSeconds, setLanguage } from '../../src/i18n';
import { getSettings, saveSettings, getRules, saveRule, deleteRule, DEFAULT_PRESET_RULES } from '../../src/core/storage/storage';
import { getAllVideos } from '../../src/database/indexeddb';
import { Settings as SettingsType, LanguageCode, WatchTrackingMode, AutomationMode } from '../../src/types/settings';
import { Rule, ActionType } from '../../src/types/rules';
import { VideoRecord } from '../../src/types/video';
import { OnboardingModal } from '../../src/components/OnboardingModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'history' | 'watchLater' | 'settings'>('overview');
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Фильтр истории
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'liked' | 'saved'>('all');

  // Фильтр Watch Later
  const [watchLaterRange, setWatchLaterRange] = useState<string>('all');

  // Состояние создания правила
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleThreshold, setNewRuleThreshold] = useState(90);
  const [newRuleAction, setNewRuleAction] = useState<ActionType>('LIKE_VIDEO');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const s = await getSettings();
    const r = await getRules();
    const v = await getAllVideos();
    setSettings(s);
    setRules(r);
    setVideos(v);

    if (s?.language) {
      setLanguage(s.language);
    }

    // Проверить статус Onboarding
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['onboardingCompleted'], (res) => {
        if (!res.onboardingCompleted) {
          setShowOnboarding(true);
        }
      });
    }
    setLoading(false);
  };

  const handleOnboardingComplete = async (config: { threshold: number; mode: AutomationMode; automations: string[] }) => {
    if (!settings) return;
    const updated = {
      ...settings,
      defaultThreshold: config.threshold,
      automationMode: config.mode,
    };
    await saveSettings(updated);
    setSettings(updated);

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ onboardingCompleted: true });
    }
    setShowOnboarding(false);
  };

  const handleUpdateSettings = async (updated: Partial<SettingsType>) => {
    if (!settings) return;
    const newSettings = { ...settings, ...updated };
    if (updated.language) {
      setLanguage(updated.language);
    }
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleToggleRule = async (rule: Rule) => {
    const updated = { ...rule, enabled: !rule.enabled };
    await saveRule(updated);
    setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
  };

  const handleDeleteRule = async (ruleId: string) => {
    await deleteRule(ruleId);
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  const handleAddPresetRule = async (preset: Rule) => {
    await saveRule(preset);
    const r = await getRules();
    setRules(r);
  };

  const handleCreateRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const created: Rule = {
      id: `rule-${Date.now()}`,
      name: newRuleName,
      enabled: true,
      conditions: [
        {
          type: 'WATCHED_PERCENT',
          operator: 'GTE',
          value: newRuleThreshold,
        },
      ],
      actions: [
        {
          type: newRuleAction,
        },
      ],
      delay: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveRule(created);
    setRules((prev) => [...prev, created]);
    setNewRuleName('');
    setIsCreatingRule(false);
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-400">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  // Расчет статистики
  const totalWatchedSec = videos.reduce((sum, v) => sum + (v.watchedSeconds || 0), 0);
  const completedCount = videos.filter((v) => (v.watchedPercent || 0) >= 90).length;

  // Фильтрованные видео
  const filteredVideos = videos.filter((v) => {
    if (historyFilter === 'completed') return (v.watchedPercent || 0) >= 90;
    if (historyFilter === 'liked') return v.liked;
    if (historyFilter === 'saved') return v.saved;
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      {/* Onboarding Modal */}
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-zinc-900/60 border-b md:border-b-0 md:border-r border-zinc-800 p-4 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center space-x-3 px-2 py-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-xl shadow-lg shadow-brand-900/30">
              🤖
            </div>
            <div>
              <h1 className="text-base font-semibold text-zinc-100">{t('app.title')}</h1>
              <p className="text-xs text-zinc-400">{t('app.version')}</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('dashboard.nav.overview')}</span>
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'rules'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{t('dashboard.nav.rules')}</span>
            </button>

            <button
              onClick={() => setActiveTab('watchLater')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'watchLater'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>{t('dashboard.nav.watchLater')}</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <HistoryIcon className="w-4 h-4" />
              <span>{t('dashboard.nav.history')}</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>{t('dashboard.nav.settings')}</span>
            </button>
          </nav>
        </div>

        {/* Footer Language Selector */}
        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between px-2">
          <div className="flex items-center space-x-2 text-xs text-zinc-400">
            <Globe className="w-4 h-4 text-zinc-400" />
            <span>{t('dashboard.settings.language')}</span>
          </div>
          <select
            value={settings.language}
            onChange={(e) => handleUpdateSettings({ language: e.target.value as LanguageCode })}
            className="bg-zinc-800 border border-zinc-700 text-xs rounded-md px-2 py-1 text-zinc-200 focus:outline-none focus:border-brand-500"
          >
            <option value="auto">{t('dashboard.settings.langAuto')}</option>
            <option value="ru">{t('dashboard.settings.langRu')}</option>
            <option value="en">{t('dashboard.settings.langEn')}</option>
          </select>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-5xl">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">{t('dashboard.overview.statsTitle')}</h2>
              <p className="text-xs text-zinc-400 mt-1">{t('dashboard.overview.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>{t('dashboard.overview.totalWatched')}</span>
                  <Clock className="w-4 h-4 text-brand-400" />
                </div>
                <p className="text-2xl font-bold text-zinc-100">{formatSeconds(totalWatchedSec)}</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>{t('dashboard.overview.completedVideos')}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-zinc-100">{completedCount}</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>{t('dashboard.overview.actionsExecuted')}</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-zinc-100">{rules.length * 2}</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>{t('dashboard.overview.likesGiven')}</span>
                  <Heart className="w-4 h-4 text-rose-400" />
                </div>
                <p className="text-2xl font-bold text-zinc-100">{completedCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* RULES TAB */}
        {activeTab === 'rules' && (
          <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">{t('dashboard.rules.title')}</h2>
                <p className="text-xs text-zinc-400 mt-1">{t('dashboard.rules.subtitle')}</p>
              </div>
              <button
                onClick={() => setIsCreatingRule(true)}
                className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition-all shadow-lg shadow-brand-900/20"
              >
                <Plus className="w-4 h-4" />
                <span>{t('dashboard.rules.create')}</span>
              </button>
            </div>

            {/* Presets Bar */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl space-y-3">
              <span className="text-xs font-semibold text-zinc-300 flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>{t('dashboard.rules.presets')}</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_PRESET_RULES.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleAddPresetRule(preset)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Create Rule Form Modal */}
            {isCreatingRule && (
              <form
                onSubmit={handleCreateRuleSubmit}
                className="bg-zinc-900 border border-brand-500/40 p-5 rounded-xl space-y-4 shadow-xl"
              >
                <h3 className="text-sm font-semibold text-brand-400 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('dashboard.rules.newRuleTitle')}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">{t('dashboard.rules.ruleName')}</label>
                    <input
                      type="text"
                      required
                      placeholder={t('dashboard.rules.placeholderName')}
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">{t('dashboard.rules.thresholdLabel')}</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newRuleThreshold}
                      onChange={(e) => setNewRuleThreshold(Number(e.target.value))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">{t('dashboard.rules.actionLabel')}</label>
                    <select
                      value={newRuleAction}
                      onChange={(e) => setNewRuleAction(e.target.value as ActionType)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-brand-500"
                    >
                      <option value="LIKE_VIDEO">{t('common.actions.LIKE_VIDEO')}</option>
                      <option value="REMOVE_FROM_WATCH_LATER">{t('common.actions.REMOVE_FROM_WATCH_LATER')}</option>
                      <option value="SAVE_VIDEO">{t('common.actions.SAVE_VIDEO')}</option>
                      <option value="HIDE_VIDEO">{t('common.actions.HIDE_VIDEO')}</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingRule(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    {t('dashboard.rules.save')}
                  </button>
                </div>
              </form>
            )}

            {/* Rules Cards List */}
            <div className="space-y-3">
              {rules.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                  {t('dashboard.rules.empty')}
                </div>
              ) : (
                rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-zinc-100">{rule.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            rule.enabled
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {rule.enabled ? t('common.active') : t('common.disabled')}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        <span className="text-brand-400 font-medium">{t('dashboard.rules.when')}</span> {t('dashboard.rules.watchedCondition', { threshold: String(rule.conditions[0]?.value ?? '') })} <span className="text-brand-400 font-medium">{t('dashboard.rules.then')}</span>{' '}
                        {t(`common.actions.${rule.actions[0]?.type}` as any) || rule.actions[0]?.type}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleToggleRule(rule)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                          rule.enabled
                            ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                            : 'bg-brand-600/20 text-brand-400 border-brand-500/30 hover:bg-brand-600/30'
                        }`}
                      >
                        {rule.enabled ? t('dashboard.rules.disable') : t('dashboard.rules.enable')}
                      </button>

                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* WATCH LATER MANAGER TAB */}
        {activeTab === 'watchLater' && (
          <div className="space-y-6 max-w-5xl">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">{t('dashboard.nav.watchLater')}</h2>
              <p className="text-xs text-zinc-400 mt-1">{t('dashboard.watchLater.subtitle')}</p>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start space-x-3 text-amber-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('dashboard.watchLater.warningTitle')}</p>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  {t('dashboard.watchLater.warningDesc')}
                </p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">{t('dashboard.watchLater.filterRange')}</span>
                <select
                  value={watchLaterRange}
                  onChange={(e) => setWatchLaterRange(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 rounded-lg px-3 py-1.5"
                >
                  <option value="all">{t('dashboard.watchLater.allVideos')}</option>
                  <option value="25">{t('dashboard.watchLater.range25')}</option>
                  <option value="50">{t('dashboard.watchLater.range50')}</option>
                  <option value="75">{t('dashboard.watchLater.range75')}</option>
                  <option value="90">{t('dashboard.watchLater.range90')}</option>
                  <option value="100">{t('dashboard.watchLater.range100')}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">{t('dashboard.nav.history')}</h2>
                <p className="text-xs text-zinc-400 mt-1">{t('dashboard.history.subtitle')}</p>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-zinc-500" />
                <select
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value as any)}
                  className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 rounded-lg px-3 py-1.5"
                >
                  <option value="all">{t('dashboard.history.allHistory')}</option>
                  <option value="completed">{t('dashboard.history.completed')}</option>
                  <option value="liked">{t('dashboard.history.liked')}</option>
                  <option value="saved">{t('dashboard.history.saved')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredVideos.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                  {t('dashboard.history.empty')}
                </div>
              ) : (
                filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-all"
                  >
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-zinc-100">{video.title}</h3>
                      <p className="text-[11px] text-zinc-400">
                        {video.channelName || t('dashboard.history.creatorDefault')} • {t('dashboard.history.duration')}: {formatSeconds(video.duration)}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-xs font-bold text-brand-400">{video.watchedPercent}%</span>
                      <p className="text-[10px] text-zinc-500">{t('dashboard.history.real')}: {formatSeconds(video.watchedSeconds)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">{t('dashboard.settings.title')}</h2>
              <p className="text-xs text-zinc-400 mt-1">{t('dashboard.settings.subtitle')}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-6">
              {/* Watch Tracking Mode */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-200 block">
                  {t('dashboard.settings.watchMode')}
                </label>
                <select
                  value={settings.watchMode}
                  onChange={(e) => handleUpdateSettings({ watchMode: e.target.value as WatchTrackingMode })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-brand-500"
                >
                  <option value="real">{t('dashboard.settings.watchModeReal')}</option>
                  <option value="position">{t('dashboard.settings.watchModePosition')}</option>
                  <option value="hybrid">{t('dashboard.settings.watchModeHybrid')}</option>
                </select>
              </div>

              {/* Automation Mode */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-200 block">
                  {t('dashboard.settings.automationMode')}
                </label>
                <select
                  value={settings.automationMode}
                  onChange={(e) => handleUpdateSettings({ automationMode: e.target.value as AutomationMode })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-brand-500"
                >
                  <option value="approval">{t('dashboard.settings.modeApproval')}</option>
                  <option value="automatic">{t('dashboard.settings.modeAuto')}</option>
                  <option value="disabled">{t('dashboard.settings.modeDisabled')}</option>
                </select>
              </div>

              {/* Language Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-200 block">
                  {t('dashboard.settings.language')}
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleUpdateSettings({ language: e.target.value as LanguageCode })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-brand-500"
                >
                  <option value="auto">{t('dashboard.settings.langAuto')}</option>
                  <option value="ru">{t('dashboard.settings.langRu')}</option>
                  <option value="en">{t('dashboard.settings.langEn')}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
