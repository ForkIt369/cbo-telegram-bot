# MCP Architecture Flow Diagrams

## Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DigitalOcean App Platform                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────┐                    ┌──────────────────┐                  │
│  │                  │                    │                  │                  │
│  │  Telegram Users  │◄──────────────────►│  Telegram API   │                  │
│  │                  │                    │                  │                  │
│  └──────────────────┘                    └────────┬─────────┘                  │
│                                                   │                             │
│                                                   │ Webhook                     │
│  ┌────────────────────────────────────────────────▼─────────────────────────┐  │
│  │                          CBO Bot Service (Port 3003)                      │  │
│  ├───────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                           │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐                │  │
│  │  │   Telegraf  │  │ CBO Handler  │  │ Claude Service  │                │  │
│  │  │   Bot API   │──│              │──│  (with Tools)   │                │  │
│  │  └─────────────┘  └──────────────┘  └────────┬─────────┘                │  │
│  │                                               │                          │  │
│  │                    ┌──────────────────────────┴─────────────┐           │  │
│  │                    │         MCP Manager                    │           │  │
│  │                    ├────────────────────────────────────────┤           │  │
│  │                    │ • Registry (server configs)           │           │  │
│  │                    │ • Transport selection (stdio/HTTP)    │           │  │
│  │                    │ • Tool discovery & routing            │           │  │
│  │                    └─────────┬──────────────┬──────────────┘           │  │
│  │                              │              │                           │  │
│  └──────────────────────────────┼──────────────┼───────────────────────────┘  │
│                                 │              │                               │
│         HTTP/Internal Network   │              │                               │
│  ┌──────────────────────────────▼───┐  ┌───────▼────────────────────────────┐ │
│  │   Context7 MCP Service (8001)    │  │  Perplexity MCP Service (8002)    │ │
│  ├──────────────────────────────────┤  ├────────────────────────────────────┤ │
│  │  ┌────────────┐  ┌────────────┐ │  │  ┌────────────┐  ┌──────────────┐ │ │
│  │  │   HTTP     │  │   MCP      │ │  │  │   HTTP     │  │    MCP       │ │ │
│  │  │  Wrapper   │──│  Server    │ │  │  │  Wrapper   │──│   Server     │ │ │
│  │  └────────────┘  └────────────┘ │  │  └────────────┘  └──────────────┘ │ │
│  └──────────────────────────────────┘  └────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Development Mode Flow (stdio transport)

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│              │     │             │     │              │     │             │
│  User Input  │────►│  CBO Bot    │────►│ MCP Manager  │────►│  Context7   │
│              │     │             │     │              │     │  (stdio)    │
└──────────────┘     └─────────────┘     └──────┬───────┘     └──────┬──────┘
                            │                    │                     │
                            │              ┌─────▼──────┐              │
                            │              │            │              │
                            └──────────────│   Claude   │◄─────────────┘
                                          │    API     │
                                          │            │
                                          └────────────┘

1. User sends message to bot
2. Bot processes through CBO Handler
3. Claude Service requests available tools from MCP Manager
4. MCP Manager spawns Context7 process via stdio
5. Tools are discovered and registered
6. Claude decides to use a tool
7. Tool execution request goes through MCP Manager
8. Results returned to Claude for final response
```

## Production Mode Flow (HTTP transport)

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│              │     │             │     │              │     │  Context7   │
│  User Input  │────►│  CBO Bot    │────►│ MCP Manager  │────►│   HTTP      │
│              │     │  Service    │     │              │     │  Service    │
└──────────────┘     └─────────────┘     └──────┬───────┘     └──────┬──────┘
                            │                    │                     │
                            │              ┌─────▼──────┐              │
                            │              │            │              │
                            └──────────────│   Claude   │◄─────────────┘
                                          │    API     │
                                          │            │
                                          └────────────┘

HTTP Flow Details:
┌─────────────┐    POST /rpc     ┌──────────────┐    stdio    ┌────────────┐
│ MCP Manager │─────────────────►│ HTTP Wrapper │─────────────►│ MCP Server │
│             │◄─────────────────│              │◄─────────────│            │
└─────────────┘    JSON-RPC      └──────────────┘   JSON-RPC   └────────────┘
```

## Tool Discovery Flow

```
                    MCP Manager Initialize
                            │
                            ▼
                ┌───────────────────────┐
                │  Load Registry Config │
                └───────────┬───────────┘
                            │
                ┌───────────▼───────────┐
                │  For Each Server:    │
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Context7    │   │  Perplexity   │   │    GitHub     │
│               │   │               │   │               │
│ stdio (dev)   │   │ HTTP (prod)   │   │ HTTP (prod)   │
│ HTTP (prod)   │   │               │   │               │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
   List Tools          List Tools          List Tools
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────────────────────────────────────────────┐
│                  Tool Registry                        │
├───────────────────────────────────────────────────────┤
│ • context7:get-library-docs                          │
│ • context7:resolve-library-id                        │
│ • perplexity:search-web                              │
│ • github:search-repositories                         │
│ • github:create-issue                                │
└───────────────────────────────────────────────────────┘
```

## Tool Execution Flow

```
User: "Search for React hooks documentation"
        │
        ▼
┌─────────────────┐
│   CBO Handler   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Claude Service                  │
│  "I'll search for React hooks docs"    │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      Tool Decision by Claude            │
│  Tool: context7:get-library-docs       │
│  Params: {library: "react", ...}       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   MCP Manager   │────►│ Route to Server │
│                 │     │   (context7)    │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  HTTP Request   │
                        │  POST /rpc      │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Context7 Server │
                        │ Execute Tool    │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Return Results  │
                        │ (React docs)    │
                        └────────┬────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────┐
│         Claude Formats Response         │
│  "Here's the React hooks documentation"│
└────────┬────────────────────────────────┘
         │
         ▼
    User receives formatted response
```

## HTTP Wrapper Internal Flow

```
┌──────────────────────────────────────────────────────────┐
│                 Context7 HTTP Wrapper                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┐    ┌─────────────┐    ┌──────────────┐ │
│  │   Express  │    │   Message   │    │    Child     │ │
│  │   Server   │───►│   Queue     │───►│   Process    │ │
│  │  (Port 8001)    │             │    │  Management  │ │
│  └────────────┘    └─────────────┘    └──────┬───────┘ │
│         │                                     │         │
│         ▼                                     ▼         │
│  ┌────────────┐                      ┌──────────────┐  │
│  │   Routes   │                      │ MCP Process  │  │
│  ├────────────┤                      │              │  │
│  │ GET /health│                      │ npx context7 │  │
│  │ POST /rpc  │◄────────────────────►│              │  │
│  │ GET /events│     JSON-RPC         └──────────────┘  │
│  └────────────┘      over stdio                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
┌──────────┐      ┌──────────┐      ┌──────────────┐      ┌──────────┐
│  CBO Bot │      │   HTTP   │      │   Validate   │      │   MCP    │
│          │─────►│ Request  │─────►│   API Key    │─────►│  Server  │
│          │      │          │      │              │      │          │
└──────────┘      └──────────┘      └──────┬───────┘      └──────────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │   401 if     │
                                    │   Invalid    │
                                    └──────────────┘

Headers:
X-API-Key: ${MCP_CONTEXT7_API_KEY}
Content-Type: application/json
```

## Error Handling Flow

```
                    Tool Execution Request
                            │
                            ▼
                    ┌───────────────┐
                    │  MCP Manager  │
                    └───────┬───────┘
                            │
                ┌───────────┴───────────┐
                │   Try HTTP Request    │
                └───────────┬───────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   Success   │ │   Timeout   │ │   Error     │
    │             │ │             │ │             │
    │ Return Data │ │ Retry/Fail  │ │ Log & Fail  │
    └─────────────┘ └─────────────┘ └─────────────┘
                            │               │
                            └───────┬───────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │ Graceful      │
                            │ Degradation   │
                            │               │
                            │ "I'll answer  │
                            │ without tools"│
                            └───────────────┘
```