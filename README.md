# WorkflowAI 🎭

> Open-source workflow automation platform optimized for research-to-content pipelines. Build, execute, and scale AI-powered workflows with a visual editor.

## 🎯 Overview

**WorkflowAI** is a self-hosted, lightweight alternative to n8n designed for:

- 🔬 **Students & Researchers**: Automate research data scraping, summarization, and presentation generation
- 📊 **Content Creators**: Batch-generate social scripts, captions, and slide decks
- 🎓 **Educators**: Create automated quiz generators and handout pipelines
- 🚀 **Entrepreneurs**: Quick competitor research and market intelligence workflows

### Key Features

✅ **Visual Workflow Builder** – Drag-and-drop node-based editor (React Flow)  
✅ **Free AI Models** – OpenRouter (6 models) + NVIDIA NIM (Nexus-FT-1)  
✅ **Image Generation** – DreamWeave (HuggingFace-powered Stable Diffusion)  
✅ **Data Scraping** – HTTP requests, HTML parsing, JSON extraction  
✅ **Export to PPT/PDF** – Auto-generate presentations with speaker notes  
✅ **Mobile Responsive** – Full-featured on desktop, tablet, and phone  
✅ **Deploy Anywhere** – Next.js + Fastify, Vercel-ready  
✅ **UI-Based API Keys** – No .env editing, manage keys through Settings page  

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ LTS
- **npm** 10+
- **PostgreSQL** or SQLite (included)

### Installation

```bash
# Clone the repository
git clone https://github.com/ShauryaPratapSingh070408/workflowai.git
cd workflowai

# Install dependencies
npm install

# Setup backend database
cd backend
npx prisma migrate dev --name init

# Start development servers (from root)
cd ..
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Get API Keys (All Free!)

1. **OpenRouter** (6 free LLM models): https://openrouter.ai
2. **NVIDIA NIM** (Advanced reasoning): https://build.nvidia.com
3. **HuggingFace** (Image generation): https://huggingface.co

Add these keys through the **Settings page** in the UI - no .env file editing needed!

## 📚 Documentation

See the `docs/` folder for detailed guides:

- [Installation Guide](./docs/INSTALLATION.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, React Flow, Tailwind CSS
- **Backend**: Fastify, TypeScript, Prisma ORM
- **Database**: PostgreSQL / SQLite
- **AI**: OpenRouter API, NVIDIA NIM, HuggingFace
- **Deploy**: Vercel, Docker

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guidelines](./CONTRIBUTING.md).

## 📝 License

MIT License - see [LICENSE](./LICENSE)

---

**Made with ❤️ for researchers, students, and creators**

*WorkflowAI © 2025*
