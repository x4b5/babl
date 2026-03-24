# /mcp-status

Check the status of all configured MCP servers.

## Instructions

1. Read `.mcp.json` from the project root.
2. For each server in `mcpServers`, report:
   - **Name** — the server key
   - **Command** — the command used to start it
   - **Package** — the MCP package name (from args)
   - **Env vars** — any required environment variables
   - **Status** — whether the server is reachable (try calling a simple tool or listing tools)
3. If `.mcp.json` is missing or empty, report that no MCP servers are configured.
4. Print a summary table with all servers and their status.

### Expected servers

| Server     | Package                                   | Purpose                               |
| ---------- | ----------------------------------------- | ------------------------------------- |
| github     | `@modelcontextprotocol/server-github`     | GitHub PRs, issues, repos             |
| filesystem | `@modelcontextprotocol/server-filesystem` | File access outside working directory |
| memory     | `@modelcontextprotocol/server-memory`     | Persistent key-value memory           |
