'use client';

import { useState, useEffect } from 'react';
import { Save, Key, Check, Cpu, Eye, EyeOff, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { AIProvider, PROVIDER_CONFIGS } from '@/lib/types';

interface SavedKeys {
  claude: string;
  openai: string;
  manus: string;
}

interface ModelSelection {
  provider: AIProvider;
  model: string;
}

interface PromptPair {
  system: string;
  user: string;
}

interface Prompts {
  promise: PromptPair;
  problem: PromptPair;
  usp: PromptPair;
}

interface Settings {
  keys: SavedKeys;
  researchModel: ModelSelection;
  briefModel: ModelSelection;
  prompts: Prompts;
}

const DEFAULT_PROMPTS: Prompts = {
  promise: { system: '', user: '' },
  problem: { system: '', user: '' },
  usp: { system: '', user: '' },
};

const DEFAULT_SETTINGS: Settings = {
  keys: { claude: '', openai: '', manus: '' },
  researchModel: { provider: 'openai', model: 'gpt-4o' },
  briefModel: { provider: 'claude', model: 'claude-sonnet-4-20250514' },
  prompts: DEFAULT_PROMPTS,
};

type TabId = 'api-keys' | 'ai-config' | 'ai-prompts';

type PromptSection = 'promise' | 'problem' | 'usp';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('api-keys');
  const [visibleKeys, setVisibleKeys] = useState<Record<keyof SavedKeys, boolean>>({
    claude: false,
    openai: false,
    manus: false,
  });
  const [openAccordions, setOpenAccordions] = useState<Record<PromptSection, boolean>>({
    promise: true,
    problem: false,
    usp: false,
  });

  useEffect(() => {
    // Load API keys (legacy support)
    const savedKeys = localStorage.getItem('creative_brief_api_keys');
    if (savedKeys) {
      setSettings(prev => ({ ...prev, keys: JSON.parse(savedKeys) }));
    }

    // Load full settings
    const savedSettings = localStorage.getItem('creative_brief_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(prev => ({ ...prev, ...parsed }));
    }
  }, []);

  const keys = settings.keys;

  const handleSave = () => {
    localStorage.setItem('creative_brief_api_keys', JSON.stringify(settings.keys));
    localStorage.setItem('creative_brief_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateKeys = (key: keyof SavedKeys, value: string) => {
    setSettings(prev => ({
      ...prev,
      keys: { ...prev.keys, [key]: value }
    }));
  };

  const updatePrompts = (section: PromptSection, field: 'system' | 'user', value: string) => {
    setSettings(prev => ({
      ...prev,
      prompts: {
        ...prev.prompts,
        [section]: { ...prev.prompts[section], [field]: value }
      }
    }));
  };

  const toggleAccordion = (section: PromptSection) => {
    setOpenAccordions(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateResearchModel = (provider: AIProvider) => {
    setSettings(prev => ({
      ...prev,
      researchModel: {
        provider,
        model: PROVIDER_CONFIGS[provider].defaultModel
      }
    }));
  };

  const updateBriefModel = (provider: AIProvider) => {
    setSettings(prev => ({
      ...prev,
      briefModel: {
        provider,
        model: PROVIDER_CONFIGS[provider].defaultModel
      }
    }));
  };

  const tabs = [
    { id: 'api-keys' as TabId, label: 'API Keys', icon: <Key className="w-4 h-4" /> },
    { id: 'ai-config' as TabId, label: 'AI Configuration', icon: <Cpu className="w-4 h-4" /> },
    { id: 'ai-prompts' as TabId, label: 'AI Prompts', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <main className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your API keys and preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Page Content */}
        <div>
          {/* API Keys Page */}
          {activeTab === 'api-keys' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Keys are stored locally in your browser and never sent to our servers.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

              {/* Claude API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Claude API Key
                </label>
                <div className="relative">
                  <input
                    type={visibleKeys.claude ? 'text' : 'password'}
                    value={keys.claude}
                    onChange={(e) => updateKeys('claude', e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setVisibleKeys(v => ({ ...v, claude: !v.claude }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {visibleKeys.claude ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {keys.claude && !visibleKeys.claude && (
                  <p className="text-xs text-gray-500 mt-1">Ends with: ...{keys.claude.slice(-4)}</p>
                )}
              </div>

              {/* OpenAI API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type={visibleKeys.openai ? 'text' : 'password'}
                    value={keys.openai}
                    onChange={(e) => updateKeys('openai', e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setVisibleKeys(v => ({ ...v, openai: !v.openai }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {visibleKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {keys.openai && !visibleKeys.openai && (
                  <p className="text-xs text-gray-500 mt-1">Ends with: ...{keys.openai.slice(-4)}</p>
                )}
              </div>

              {/* Manus API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manus API Key
                </label>
                <div className="relative">
                  <input
                    type={visibleKeys.manus ? 'text' : 'password'}
                    value={keys.manus}
                    onChange={(e) => updateKeys('manus', e.target.value)}
                    placeholder="manus-..."
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setVisibleKeys(v => ({ ...v, manus: !v.manus }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {visibleKeys.manus ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {keys.manus && !visibleKeys.manus && (
                  <p className="text-xs text-gray-500 mt-1">Ends with: ...{keys.manus.slice(-4)}</p>
                )}
              </div>
              </div>
            </div>
          )}

          {/* AI Configuration Page */}
          {activeTab === 'ai-config' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">AI Configuration</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose which AI models to use for each task.
                </p>
              </div>

              <div className="grid gap-6">
                {/* Brand Research Model */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Model for Brand Research
                  </label>
                  <p className="text-xs text-gray-500 mb-4">
                    Used for crawling and analyzing website content
                  </p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => updateResearchModel(provider)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        settings.researchModel.provider === provider
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-sm">{PROVIDER_CONFIGS[provider].name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {settings.researchModel.provider === provider
                          ? settings.researchModel.model
                          : PROVIDER_CONFIGS[provider].defaultModel}
                      </p>
                    </button>
                  ))}
                </div>
                {settings.researchModel.provider && (
                  <select
                    value={settings.researchModel.model}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      researchModel: { ...prev.researchModel, model: e.target.value }
                    }))}
                    className="mt-3 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {PROVIDER_CONFIGS[settings.researchModel.provider].models.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )}
                </div>

                {/* Creative Brief Model */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Model for Building Creative Brief
                  </label>
                  <p className="text-xs text-gray-500 mb-4">
                    Used for generating the strategic brief and deliverables
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map((provider) => (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => updateBriefModel(provider)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          settings.briefModel.provider === provider
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-sm">{PROVIDER_CONFIGS[provider].name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {settings.briefModel.provider === provider
                            ? settings.briefModel.model
                            : PROVIDER_CONFIGS[provider].defaultModel}
                        </p>
                      </button>
                    ))}
                  </div>
                  {settings.briefModel.provider && (
                    <select
                      value={settings.briefModel.model}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        briefModel: { ...prev.briefModel, model: e.target.value }
                      }))}
                      className="mt-3 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {PROVIDER_CONFIGS[settings.briefModel.provider].models.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Prompts Page */}
          {activeTab === 'ai-prompts' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">AI Prompts</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Configure system and user prompts for each section of the brief generation.
                </p>
              </div>

              <div className="space-y-4">
                {/* The Promise Accordion */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleAccordion('promise')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">The Promise</h3>
                      <p className="text-xs text-gray-500 mt-0.5">What transformation do you promise customers?</p>
                    </div>
                    {openAccordions.promise ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {openAccordions.promise && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                      <div className="pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          System Prompt
                        </label>
                        <p className="text-xs text-gray-500 mb-2">Instructions for how the AI should behave</p>
                        <textarea
                          value={settings.prompts.promise.system}
                          onChange={(e) => updatePrompts('promise', 'system', e.target.value)}
                          placeholder="e.g., You are a brand strategist. Focus on identifying the core transformation..."
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-900 text-gray-100 font-mono text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize placeholder-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          User Prompt
                        </label>
                        <p className="text-xs text-gray-500 mb-2">The specific request or context to provide</p>
                        <textarea
                          value={settings.prompts.promise.user}
                          onChange={(e) => updatePrompts('promise', 'user', e.target.value)}
                          placeholder="e.g., We help small businesses grow their revenue by 3x in 90 days..."
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-900 text-gray-100 font-mono text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize placeholder-gray-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* The Problem Accordion */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleAccordion('problem')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">The Problem</h3>
                      <p className="text-xs text-gray-500 mt-0.5">What core problem does your product solve?</p>
                    </div>
                    {openAccordions.problem ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {openAccordions.problem && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                      <div className="pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          System Prompt
                        </label>
                        <p className="text-xs text-gray-500 mb-2">Instructions for how the AI should behave</p>
                        <textarea
                          value={settings.prompts.problem.system}
                          onChange={(e) => updatePrompts('problem', 'system', e.target.value)}
                          placeholder="e.g., You are a market researcher. Identify the pain points and frustrations..."
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-900 text-gray-100 font-mono text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize placeholder-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          User Prompt
                        </label>
                        <p className="text-xs text-gray-500 mb-2">The specific request or context to provide</p>
                        <textarea
                          value={settings.prompts.problem.user}
                          onChange={(e) => updatePrompts('problem', 'user', e.target.value)}
                          placeholder="e.g., Business owners struggle to find qualified leads..."
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-900 text-gray-100 font-mono text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize placeholder-gray-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* USP Accordion */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleAccordion('usp')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">Unique Selling Proposition (USP)</h3>
                      <p className="text-xs text-gray-500 mt-0.5">What makes you different from competitors?</p>
                    </div>
                    {openAccordions.usp ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {openAccordions.usp && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                      <div className="pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          System Prompt
                        </label>
                        <p className="text-xs text-gray-500 mb-2">Instructions for how the AI should behave</p>
                        <textarea
                          value={settings.prompts.usp.system}
                          onChange={(e) => updatePrompts('usp', 'system', e.target.value)}
                          placeholder="e.g., You are a competitive analyst. Identify unique differentiators..."
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-900 text-gray-100 font-mono text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize placeholder-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          User Prompt
                        </label>
                        <p className="text-xs text-gray-500 mb-2">The specific request or context to provide</p>
                        <textarea
                          value={settings.prompts.usp.user}
                          onChange={(e) => updatePrompts('usp', 'user', e.target.value)}
                          placeholder="e.g., Unlike other agencies, we use AI-powered targeting..."
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-900 text-gray-100 font-mono text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize placeholder-gray-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-6">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          All settings are stored locally in your browser.
        </p>
      </div>
    </main>
  );
}
