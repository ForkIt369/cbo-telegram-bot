# CBO Bot Project Overview

## 🎯 Project Status

**Current State**: Production-ready Telegram bot with experimental features
- **Live Bot**: Running 24/7 on DigitalOcean App Platform
- **Repository**: https://github.com/ForkIt369/cbo-telegram-bot
- **Framework**: Claude Sonnet 4 integration for business optimization

## 📁 Project Structure

```
CBO_BOT/
├── src/                    # Core bot application
│   ├── index.js           # Main entry point & Telegram bot setup
│   ├── handlers/          # Message & command handlers
│   │   └── cboAgentHandler.js  # CBO agent conversation management
│   ├── services/          # Service layer
│   │   ├── claudeService.js    # Basic Claude integration
│   │   ├── claudeServiceWithTools.js  # Claude + MCP tools (experimental)
│   │   ├── mcpManager.js       # MCP server management
│   │   ├── mcpRegistry.js      # MCP server registry
│   │   ├── whitelistService.js # User access control
│   │   └── transports/         # MCP transport implementations
│   ├── memory/            # Conversation persistence
│   │   └── memoryBank.js  # File-based storage system
│   ├── middleware/        # Express/Bot middleware
│   │   └── accessControl.js  # Whitelist enforcement
│   └── utils/             # Utilities
│       └── logger.js      # Winston logging
│
├── agents/                # External agents
│   └── cbo-agent.js      # Core CBO business logic
│
├── mini-app/             # Telegram Mini App (Web interface)
│   ├── src/              # React app source
│   ├── dist/             # Built static files
│   └── package.json      # Mini app dependencies
│
├── mcp-servers/          # MCP server wrappers (experimental)
│   └── context7/         # Context7 documentation MCP
│       ├── index.js      # HTTP wrapper
│       ├── package.json  # Dependencies
│       └── Dockerfile    # Container config
│
├── data/                 # Persistent storage
│   └── memories/         # Conversation history
│       ├── conversations/  # User conversation logs
│       ├── insights/       # Extracted insights
│       └── patterns/       # Identified patterns
│
├── config/               # Configuration files
│   └── whitelist.json    # Authorized users
│
├── docs/                 # Documentation
│   ├── architecture.md   # System architecture
│   ├── api-specs.md      # API specifications
│   ├── implementation-plan.md  # Development roadmap
│   └── mcp-*.md          # MCP-related docs
│
└── deployment/           # Deployment configs
    └── .do/              # DigitalOcean configs
        └── app.yaml      # App Platform spec
```

## 🔑 Key Components

### 1. **Telegram Bot** (`src/index.js`)
- Telegraf-based bot handling commands and messages
- Webhook mode in production, polling in development
- Commands: `/start`, `/help`, `/status`, `/tools`, `/mcphealth`

### 2. **CBO Agent** (`agents/cbo-agent.js`)
- Claude Sonnet 4 integration
- BroVerse Biz Mental Model™ (BBMM) framework
- Four Flows analysis: Value, Info, Work, Cash

### 3. **Memory System** (`src/memory/memoryBank.js`)
- File-based persistence in `data/memories/`
- Stores conversations, insights, and patterns
- Enables context retention across sessions

### 4. **Mini App** (`mini-app/`)
- React-based web interface
- Telegram WebApp integration
- Beautiful chat UI with animations

### 5. **MCP Integration** (Experimental)
- Model Context Protocol for tool extensions
- HTTP wrappers for production deployment
- Currently includes Context7 for documentation

## 🚨 Current Issues & Chaos Points

### 1. **Documentation Overload**
- 7 markdown files in root directory
- Multiple overlapping docs (README, HANDOVER, QUICK_START, etc.)
- Inconsistent information across files

### 2. **MCP Complexity**
- Experimental MCP features partially implemented
- Production deployment challenges
- Mixed stdio/HTTP transport modes

### 3. **Deployment Configurations**
- Multiple YAML files: `do-app-spec.yaml`, `do-app-deploy.yaml`, `.do/app.yaml`
- Unclear which is the current/correct one

### 4. **Code Organization**
- Two Claude service files (with/without tools)
- Unused test configurations
- No actual tests implemented

## 🛠️ Recommended Actions

### Immediate Cleanup
1. **Consolidate Documentation**
   - Merge overlapping docs into organized structure
   - Move technical docs to `docs/` folder
   - Keep only essential files in root

2. **Simplify Deployment**
   - Use single deployment configuration
   - Remove duplicate YAML files
   - Document deployment process clearly

3. **Code Cleanup**
   - Remove or properly integrate experimental MCP code
   - Consolidate Claude service implementations
   - Add basic tests

### Project Organization
```
Proposed Structure:
├── README.md          # Quick start & overview
├── .env.example       # Environment template
├── package.json       # Dependencies
├── src/              # All source code
├── docs/             # All documentation
│   ├── setup/        # Setup guides
│   ├── deployment/   # Deployment docs
│   └── development/  # Dev guides
└── config/           # All configs
```

## 🚀 Next Steps

1. **Documentation Consolidation** - Merge and organize all docs
2. **Remove Experimental Code** - Clean up or properly integrate MCP
3. **Simplify Deployment** - Single, clear deployment path
4. **Add Tests** - Basic test coverage for core features
5. **Update Dependencies** - Check for security updates

## 📊 Project Stats

- **Core Files**: ~20 JavaScript files
- **Dependencies**: 6 production, 3 development
- **Documentation**: 15+ markdown files (needs consolidation)
- **Active Features**: Bot commands, Mini App, Memory system
- **Experimental**: MCP tools integration