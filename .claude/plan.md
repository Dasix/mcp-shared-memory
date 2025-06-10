This project (`mcp-shared-memory`) is an experimental Model Context Protocol (MCP) server that provides shared
memory functionality across multiple projects. The goal is to allow different instances of Claude Code to share
and manage memory in a consistent way by connecting to a single centralized server instance running on the network.

## Development Plan

- We will be creating the MCP server using TypeScript and Node.js
- We have scaffolded the project using **boilerplate-mcp-server** (https://github.com/aashari/boilerplate-mcp-server)
  - Comprehensive template with ESLint, Prettier, CI/CD, testing, and clean architecture
  - Includes example IP lookup tool that we'll replace with our shared memory tools
  - Supports both stdio and HTTP/SSE transports out of the box
  - Well-structured with separate directories for tools, resources, prompts, and utilities
- Primary focus on network-accessible protocols for centralized deployment, while keeping other approaches available:
  - **HTTP with SSE (Server-Sent Events)**: Primary protocol for remote access, using HTTP POST for client-to-server and SSE for server-to-client streaming
  - **Streamable HTTP**: The newer, more flexible transport replacing SSE for production deployments
  - **stdio (Standard Input/Output)**: Support for local testing, development, and alternative deployment models
  - All transports use JSON-RPC 2.0 as the wire protocol for message exchange
  - Note: While our primary use case is a centralized server, the architecture supports local instances and other deployment patterns
- We should be able to run the server locally and test it with using the project's Claude Code instance.
- We also want to create all of the appropriate documentation and metadata to allow MCP clients (such as Claude Code)
  to discover the server and understand its available tools.

## Core Features

- The single centralized MCP server instance will be configured to read from and write to a Git repository.
- Multiple Claude Code clients will connect to this server over the network.
- The Git repository is where all of the shared memory will be stored.
- "Memory files" will be stored in markdown format.
- In addition to the "memory files", each client that connects will have a small amount of metadata. We will
  store that metadata in a directory outside of this repository in JSON format.
- Where project meta will be stored will be set via an environment variable.
- We will implement .env (or similar) support to allow configuration of the MCP server.
- In general, the MCP will be configured via a small number of environment variables. Besides that, it
  should get all of its configuration data from the shared memory Git repository.
  - The shared memory will provide a `flags.json` (described below)
- Clients (projects) will download a list of "flags", which will be defined in the shared memory repo.
- Each memory file (markdown file) will support a templating syntax (conditionals, based on flags, and partials)
- Clients can read instructions or templates and can write templates.

### Known MCP Server Settings

Environment variables for the centralized server:

- `GIT_REPO_URL` - The URL of the Git repository where the shared memory is stored
- `GIT_REPO_PATH` - The path to the local clone of the Git repository (on the server)
- `PROJECT_META_PATH` - The path to the directory where project metadata is stored (on the server)
- `SERVER_PORT` - The port for the HTTP/SSE server (default: 3000)
- `SERVER_HOST` - The host to bind to (default: 0.0.0.0 for network access)

### MCP Tools to Expose to Clients

- `get_available_flags` - Returns a list of available flags and how to check to see which ones apply to the client's project.
- `set_project_flags` - Sets the flags for the client's project.
- `get_instruction` - Reads an instruction file from the shared memory, with template resolved. e.g. `get_instruction("instructions/argo-cd.md")`
- `get_instruction_template` - Reads the template file used for an instruction, clients will need to read this before they edit so that they can preserve the template tags.
- `set_instruction_template` - Writes a template file to the shared memory. e.g. `set_instruction_template("instructions/argo-cd.md", content, commit_message)`
- `list_instructions` - Lists instruction templates available in the shared memory. Accepts a glob.

### Flags

The shared memory repo will contain a `/config/flags.json`. This file will contain a list of flags that can be used
to create logical divisions in the shared memory so that instruction files can be dynamic based on the project
or instance that is using the shared memory.

For simplicity, all flags will be booleans and all default to `false`.

```json
{
  "flags": {
    "flagName": {
      "description": "A brief description of the flag",
      "checkInstructions": "/instructions/checks/flagName.md"
    }
  }
}
```

Note: The `checkInstructions` field is optional and explains how clients can check to see if they meet the requirements for this flag.

Example:

```json
{
  "flags": {
    "argocd": {
      "description": "Describes whether or not the project contains ArgoCD configs",
      "checkInstructions": "/instructions/checks/argo-cd.md"
    }
  }
}
```

## Architecture

### System Components

1. **MCP Server Core**
   - Handles MCP protocol communication (JSON-RPC 2.0)
   - Manages client connections and sessions
   - Routes tool calls to appropriate handlers
2. **Git Repository Manager**
   - Clones and manages the shared memory Git repository
   - Handles Git operations (pull, commit, push)
   - Manages file locking for concurrent access
3. **Template Engine**
   - Processes markdown files with conditional logic based on flags
   - Supports partials for reusable content
   - Validates template syntax
4. **Project Metadata Store**
   - Stores client/project-specific metadata in JSON format
   - Uses client's unique auth token as the primary key for metadata
   - Manages project flags and configuration per client
   - Maintains mapping between tokens and project names/settings
5. **Tool Handlers**
   - Implements each MCP tool (get_instruction, set_instruction_template, etc.)
   - Validates inputs and permissions
   - Coordinates between components

### Data Flow (Centralized Network Model)

1. Remote Claude Code client connects to centralized MCP server via HTTP/SSE
2. Server authenticates client and loads project-specific metadata
3. Client requests available flags → Server reads from shared Git repo
4. Client sets project flags → Server updates project metadata locally
5. Client reads instruction → Server fetches from Git, processes template with client's flags, returns result
6. Client writes template → Server validates, commits to shared Git repo for all clients

## Templating System

### Syntax Design

We'll use a simple, readable syntax inspired by Handlebars/Mustache:

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
- **Partials**: `{{> path/to/partial}}` for including reusable content
- **Comments**: `{{! This is a comment }}`
- **Escaping**: `\{{` to output literal braces

## Security Considerations (Network-First Design)

1. **Authentication & Client Identification**
   - Each client receives a unique API token that serves dual purposes:
     - Authentication for network access
     - Client/project identification (token is the primary key for project metadata)
   - Optional OAuth 2.1 for enterprise deployments
   - Tokens are never stored in the shared Git repository, only in server-side metadata
2. **Authorization**
   - Read/write permissions per project
   - Flag restrictions (some flags may be read-only)
3. **Git Access**
   - Support for SSH keys and HTTPS credentials
   - Separate credentials per project if needed
4. **Input Validation**
   - Sanitize file paths to prevent directory traversal
   - Validate template syntax before saving
   - Limit file sizes and Git operations

## Error Handling

1. **Git Conflicts**
   - Automatic retry with pull/merge for simple conflicts
   - Return clear error messages for manual resolution
2. **Template Errors**
   - Validate syntax before saving
   - Provide line numbers for syntax errors
   - Fallback to raw content if template processing fails
3. **Network Issues**
   - Retry logic for Git operations
   - Cache frequently accessed content
   - Graceful degradation for read operations

## Testing Strategy

1. **Unit Tests**
   - Template engine with various flag combinations
   - Tool handlers with mock Git operations
   - Input validation and sanitization
2. **Integration Tests**
   - Full MCP protocol flow with test client
   - Git operations with test repository
   - Concurrent access scenarios
3. **E2E Tests**
   - Multiple Claude Code clients connecting to single server
   - Concurrent access from different network locations
   - Template editing workflow with conflict resolution

## Deployment & Installation

### Centralized Server Setup

1. **Network Server Deployment**

   - Deploy on a dedicated server/VM accessible from your network
   - Configure with static IP or domain name
   - Set up SSL/TLS for secure connections
   - Run as system service with systemd/PM2 for reliability
   - Docker container recommended for easier deployment and updates

2. **Local Development**

   ```bash
   npm install
   npm run dev  # Run with hot reload for testing
   ```

3. **Claude Code Client Configuration**
   Configure each Claude Code instance to connect to the centralized server with a unique token:
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
   Note: Each client must have a unique token - this is how the server identifies different projects/clients.

### Client Discovery

- Publish to MCP server registry
- Create discovery metadata file
- Document available tools and their parameters

## Next Steps

1. Choose and scaffold using one of the identified templates
2. Implement core Git repository manager
3. Build template engine with flag support
4. Create MCP tool handlers
5. Add project metadata management
6. Implement security and error handling
7. Write comprehensive tests
8. Create documentation and examples
