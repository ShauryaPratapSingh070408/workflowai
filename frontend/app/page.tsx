import Link from 'next/link';
import { Zap, Settings, PlayCircle, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-purple-500/20 bg-black/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-white">WorkflowAI</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/workflows"
              className="px-4 py-2 rounded-lg border border-purple-500 text-purple-300 hover:bg-purple-500/10 transition"
            >
              Workflows
            </Link>
            <Link
              href="/settings"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            Build Workflows That
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              {' '}Research & Create
            </span>
          </h1>
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Open-source workflow automation platform. Scrape data, analyze with AI, generate presentations—all with a visual editor.
            <strong className="block mt-2 text-yellow-300">✨ Add API keys through Settings UI - no .env needed!</strong>
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/workflows/new"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition"
            >
              <PlayCircle className="w-5 h-5" />
              Create Workflow
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-purple-500 text-purple-300 text-lg font-semibold hover:bg-purple-500/10 transition"
            >
              <Settings className="w-5 h-5" />
              Setup API Keys
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 transition">
            <Zap className="w-8 h-8 text-yellow-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Visual Builder</h3>
            <p className="text-purple-200">Drag-and-drop node editor. No coding required.</p>
          </div>
          
          <div className="bg-gradient-to-br from-pink-500/10 to-transparent border border-pink-500/30 rounded-xl p-6 hover:border-pink-500/50 transition">
            <Sparkles className="w-8 h-8 text-pink-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Free AI Models</h3>
            <p className="text-purple-200">OpenRouter (6 models) + NVIDIA NIM. Add keys in Settings.</p>
          </div>
          
          <div className="bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/30 rounded-xl p-6 hover:border-cyan-500/50 transition">
            <Settings className="w-8 h-8 text-cyan-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">UI-Based Setup</h3>
            <p className="text-purple-200">Manage API keys through Settings page. No .env files!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
