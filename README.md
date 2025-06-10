# MCP Shared Memory Server

An experimental Model Context Protocol (MCP) server that provides shared memory functionality across multiple Claude Code instances through a centralized Git-backed storage system.

## Overview

This MCP server enables different Claude Code instances to share and manage memory in a consistent way by connecting to a single centralized server. It uses a Git repository as the backing store for shared memory, allowing for version control, collaboration, and persistence.

## Features

- **Centralized Memory Storage**: Single server instance manages memory for multiple clients
- **Git-Backed Persistence**: All shared memory stored in a Git repository
- **Project-Specific Configuration**: Each client identified by unique auth token
- **Template System**: Markdown files support conditional logic based on project flags
- **Network-First Design**: Optimized for HTTP/SSE transport for remote access
- **Flexible Architecture**: Supports both centralized and local deployment models

## Installation

```bash
npm install mcp-shared-memory
```

## Configuration

The server is configured through environment variables:

- `GIT_REPO_URL` - URL of the Git repository for shared memory storage
- `GIT_REPO_PATH` - Local path to the Git repository clone
- `PROJECT_META_PATH` - Directory for storing project metadata
- `SERVER_PORT` - HTTP/SSE server port (default: 3000)
- `SERVER_HOST` - Host to bind to (default: 0.0.0.0)

## Usage

### Starting the Server

```bash
# Development mode with hot reload
npm run dev:server

# Production mode
npm run start:server
```

### Claude Code Client Configuration

Configure each Claude Code instance to connect to the server:

```json
{
  "mcp-servers": {
    "shared-memory": {
      "url": "https://shared-memory.internal.network:3000",
      "transport": "sse",
      "auth": {
        "type": "token",
        "token": "${SHARED_MEMORY_TOKEN}"
      }
    }
  }
}
```

**Note**: Each client must have a unique token - this is how the server identifies different projects/clients.

## Available Tools

- `get_available_flags` - Returns available flags and their check instructions
- `set_project_flags` - Sets flags for the client's project
- `get_instruction` - Reads an instruction file with templates resolved
- `get_instruction_template` - Reads the raw template file
- `set_instruction_template` - Writes a template file to shared memory
- `list_instructions` - Lists available instruction templates

## Template System

The server supports a Handlebars-inspired template syntax in markdown files:

```markdown
# Deployment Instructions

{{#if argocd}}
## ArgoCD Deployment
Follow these steps for ArgoCD deployment...
{{/if}}

{{#if kubernetes}}
## Kubernetes Deployment
Apply the manifests with kubectl...
{{/if}}

{{> partials/common-footer}}
```

### Features

- **Conditionals**: `{{#if flag}}...{{/if}}`, `{{#unless flag}}...{{/unless}}`
- **Partials**: `{{> path/to/partial}}`
- **Comments**: `{{! This is a comment }}`
- **Escaping**: `\{{` to output literal braces

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

## Architecture

The server consists of several key components:

1. **MCP Server Core** - Handles protocol communication and client sessions
2. **Git Repository Manager** - Manages Git operations and file locking
3. **Template Engine** - Processes markdown templates with conditional logic
4. **Project Metadata Store** - Stores client-specific configuration
5. **Tool Handlers** - Implements MCP tool endpoints

## Security

- Each client authenticated via unique API token
- Tokens serve as primary keys for project metadata
- File path sanitization prevents directory traversal
- Template validation before saving

## License

ISC

## Contributing

This is an experimental project. Contributions and feedback are welcome!