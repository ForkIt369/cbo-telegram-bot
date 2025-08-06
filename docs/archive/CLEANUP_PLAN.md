# CBO Bot Cleanup Plan

## 🧹 Identified Issues

### 1. Documentation Chaos
**Problem**: Too many overlapping documentation files in root
- `README.md` - Main readme
- `ARCHITECTURE.md` - System architecture 
- `CLAUDE.md` - Claude AI instructions
- `HANDOVER.md` - Project handover notes
- `QUICK_START.md` - Quick start guide
- `DIGITALOCEAN_MINIAPP.md` - Mini app deployment
- `MINI_APP_SETUP.md` - Mini app setup

**Solution**: Consolidate into organized structure

### 2. Duplicate Deployment Files
**Problem**: Three different DigitalOcean deployment configs
- `.do/app.yaml` - Current official config
- `do-app-spec.yaml` - Older deployment spec
- `do-app-deploy.yaml` - Another deployment variant

**Solution**: Keep only `.do/app.yaml`, remove others

### 3. Experimental MCP Code
**Problem**: Half-implemented MCP (Model Context Protocol) features
- Production deployment issues
- Complex HTTP wrapper setup
- Not actively used in production

**Solution**: Move to experimental branch or document as optional

### 4. Redundant Service Files
**Problem**: Two Claude service implementations
- `claudeService.js` - Basic implementation (used)
- `claudeServiceWithTools.js` - With MCP tools (experimental)

**Solution**: Keep basic version, document experimental as optional

## 📋 Cleanup Actions

### Phase 1: Documentation Consolidation
```bash
# Create organized docs structure
mkdir -p docs/setup
mkdir -p docs/deployment  
mkdir -p docs/development
mkdir -p docs/archive

# Move files
mv QUICK_START.md docs/setup/
mv MINI_APP_SETUP.md docs/setup/
mv DIGITALOCEAN_MINIAPP.md docs/deployment/
mv HANDOVER.md docs/archive/
mv ARCHITECTURE.md docs/development/

# Keep in root
# - README.md (simplified)
# - CLAUDE.md (AI instructions)
# - PROJECT_OVERVIEW.md (new)
```

### Phase 2: Remove Duplicates
```bash
# Remove duplicate deployment files
rm do-app-spec.yaml
rm do-app-deploy.yaml

# Keep only official config
# .do/app.yaml
```

### Phase 3: Organize Experimental Code
```bash
# Create experimental directory
mkdir -p experimental/mcp

# Move MCP-related files
mv src/services/claudeServiceWithTools.js experimental/
mv src/services/mcpManager.js experimental/
mv src/services/mcpRegistry.js experimental/
mv src/services/transports/ experimental/mcp/
mv mcp-servers/ experimental/
mv docs/mcp-*.md experimental/mcp/docs/
```

### Phase 4: Clean Up Root Directory
```bash
# Final root structure should be:
.
├── README.md              # Simple getting started
├── CLAUDE.md             # AI instructions
├── PROJECT_OVERVIEW.md   # Project structure guide
├── package.json          # Dependencies
├── .env.example          # Environment template
├── .gitignore           
├── src/                  # Core application
├── agents/               # CBO agent
├── mini-app/             # Telegram Mini App
├── data/                 # Runtime data
├── config/               # Configuration
├── docs/                 # Organized documentation
├── experimental/         # Experimental features
└── .do/                  # DigitalOcean config
```

## 🎯 Expected Outcomes

1. **Cleaner Root**: Only essential files in root directory
2. **Organized Docs**: Clear hierarchy in `docs/` folder
3. **No Duplicates**: Single source of truth for configs
4. **Experimental Isolation**: Optional features clearly separated
5. **Easier Navigation**: New developers can understand structure

## ⚠️ Before Cleanup

1. **Backup Everything**: Create a backup branch
2. **Test Deployment**: Ensure `.do/app.yaml` is correct
3. **Update README**: Reflect new structure
4. **Document Changes**: Note what moved where

## 🚀 Implementation Commands

```bash
# 1. Create backup
git checkout -b pre-cleanup-backup
git checkout master

# 2. Create new structure
mkdir -p docs/{setup,deployment,development,archive}
mkdir -p experimental/mcp/{docs,servers}

# 3. Move files (see actions above)

# 4. Update references in code

# 5. Commit changes
git add .
git commit -m "Reorganize project structure for clarity"

# 6. Test everything still works
npm run dev
```

## 📝 Post-Cleanup Tasks

1. Update README.md with new structure
2. Update CLAUDE.md if file locations changed
3. Test bot functionality
4. Test deployment process
5. Update any hardcoded paths in code