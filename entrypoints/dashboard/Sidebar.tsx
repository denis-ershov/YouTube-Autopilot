import type { ComponentType } from 'react';
import { LayoutDashboard, Sliders, History, Settings, Globe } from 'lucide-react';
import { Logo } from '../../src/components/Logo';
import { t } from '../../src/i18n';
import { LanguageCode } from '../../src/types/settings';
import { getExtensionVersion } from '../../src/core/utils/runtime';

export type DashboardTab = 'overview' | 'rules' | 'history' | 'settings';

const NAV_ITEMS: { id: DashboardTab; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'overview', icon: LayoutDashboard },
  { id: 'rules', icon: Sliders },
  { id: 'history', icon: History },
  { id: 'settings', icon: Settings },
];

const LANGUAGES: { code: LanguageCode; labelKey: string }[] = [
  { code: 'auto', labelKey: 'dashboard.settings.langAuto' },
  { code: 'ru', labelKey: 'dashboard.settings.langRu' },
  { code: 'en', labelKey: 'dashboard.settings.langEn' },
];

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
}

export function Sidebar({ activeTab, onTabChange, language, onLanguageChange }: SidebarProps) {
  const version = getExtensionVersion();
  return (
    <aside className="w-full md:w-64 bg-zinc-900/70 border-b md:border-b-0 md:border-e border-zinc-800 p-4 flex flex-col gap-6 shrink-0 md:min-h-screen">
      <div className="flex items-center gap-3 px-2 pt-2">
        <Logo size={36} />
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-zinc-100">{t('app.title')}</h1>
          {version && <p className="text-[11px] text-zinc-400">{t('app.version', { version })}</p>}
        </div>
      </div>

      <nav className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-1 gap-1" aria-label={t('app.title')}>
        {NAV_ITEMS.map(({ id, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              aria-current={active ? 'page' : undefined}
              className={`focus-ring min-h-11 w-full flex items-center gap-3 px-3 rounded-lg text-xs font-medium transition-colors duration-200 ${
                active
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{t(`dashboard.nav.${id}`)}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-3.5 border-t border-zinc-800/80 md:mt-auto">
        <div className="flex items-center gap-1.5 px-1 mb-2 text-xs text-zinc-400 font-medium">
          <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span id="language-label">{t('dashboard.settings.language')}</span>
        </div>
        <div
          role="radiogroup"
          aria-labelledby="language-label"
          className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-[11px] font-medium"
        >
          {LANGUAGES.map(({ code, labelKey }) => {
            const active = language === code;
            return (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onLanguageChange(code)}
                className={`focus-ring min-h-11 px-1 rounded-md text-center truncate transition-colors duration-200 ${
                  active
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
