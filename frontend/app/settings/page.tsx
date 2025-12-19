'use client';

import { useState, useEffect } from 'react';
import { Settings, Key, Save, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ApiKeySetting {
  id: string;
  key: string;
  isConfigured: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ApiKeySetting[]>([]);
  const [apiKeys, setApiKeys] = useState({
    OPENROUTER_API_KEY: '',
    NVIDIA_API_KEY: '',
    HUGGINGFACE_API_KEY: '',
  });
  const [showKeys, setShowKeys] = useState({
    OPENROUTER_API_KEY: false,
    NVIDIA_API_KEY: false,
    HUGGINGFACE_API_KEY: false,
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiClient.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveApiKey = async (key: string) => {
    const value = apiKeys[key as keyof typeof apiKeys];
    
    if (!value) {
      setStatus({ ...status, [key]: 'error' });
      return;
    }

    setSaving(key);
    setStatus({ ...status, [key]: 'saving' });

    try {
      await apiClient.post('/settings', { key, value });
      setStatus({ ...status, [key]: 'success' });
      await loadSettings();
      
      // Clear input after successful save
      setApiKeys({ ...apiKeys, [key]: '' });
      
      setTimeout(() => {
        setStatus({ ...status, [key]: '' });
      }, 3000);
    } catch (error) {
      setStatus({ ...status, [key]: 'error' });
      console.error('Error saving API key:', error);
    } finally {
      setSaving(null);
    }
  };

  const isConfigured = (key: string) => {
    return settings.some((s) => s.key === key && s.isConfigured);
  };

  const apiKeyConfigs = [
    {
      key: 'OPENROUTER_API_KEY',
      name: 'OpenRouter API Key',
      description: '6 free LLM models including GPT-OSS, DeepSeek, Llama 3.1',
      placeholder: 'sk_or_v1_...',
      link: 'https://openrouter.ai/settings/keys',
    },
    {
      key: 'NVIDIA_API_KEY',
      name: 'NVIDIA NIM API Key',
      description: 'Nexus-FT-1 advanced reasoning model',
      placeholder: 'nvapi-...',
      link: 'https://build.nvidia.com',
    },
    {
      key: 'HUGGINGFACE_API_KEY',
      name: 'HuggingFace API Key',
      description: 'Stable Diffusion image generation (DreamWeave)',
      placeholder: 'hf_...',
      link: 'https://huggingface.co/settings/tokens',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-purple-500/20 bg-black/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-400" />
            <span className="text-xl font-semibold text-white">Settings</span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">API Key Management</h1>
          <p className="text-purple-200">
            Configure your API keys through this UI. Keys are encrypted and stored securely in the database.
            <strong className="block mt-1 text-yellow-300">✨ No .env files needed!</strong>
          </p>
        </div>

        <div className="space-y-6">
          {apiKeyConfigs.map((config) => (
            <div
              key={config.key}
              className="bg-slate-900/50 border border-purple-500/30 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">{config.name}</h3>
                    {isConfigured(config.key) && (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                  <p className="text-sm text-purple-200">{config.description}</p>
                </div>
                <a
                  href={config.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300 underline"
                >
                  Get Key
                </a>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showKeys[config.key as keyof typeof showKeys] ? 'text' : 'password'}
                    value={apiKeys[config.key as keyof typeof apiKeys]}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, [config.key]: e.target.value })
                    }
                    placeholder={config.placeholder}
                    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500 pr-10"
                  />
                  <button
                    onClick={() =>
                      setShowKeys({
                        ...showKeys,
                        [config.key]: !showKeys[config.key as keyof typeof showKeys],
                      })
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300"
                  >
                    {showKeys[config.key as keyof typeof showKeys] ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => saveApiKey(config.key)}
                  disabled={saving === config.key}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {saving === config.key ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
              </div>

              {/* Status Messages */}
              {status[config.key] === 'success' && (
                <p className="mt-2 text-sm text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  API key saved successfully!
                </p>
              )}
              {status[config.key] === 'error' && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  Error saving API key. Please try again.
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">🔒 Security</h3>
          <ul className="text-sm text-purple-200 space-y-1">
            <li>• All API keys are encrypted before storage</li>
            <li>• Keys are stored in your database, not in code</li>
            <li>• Only accessible through authenticated requests</li>
            <li>• Change or remove keys anytime</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
