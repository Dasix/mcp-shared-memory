# Project Plan: Claude Code Shared Memory System

This document outlines the development plan for creating a centralized, version-controlled shared memory system for Claude Code (CC) instances. The goal is to increase efficiency, maintain consistency, and enable collaborative improvement of automated workflows across multiple projects.

## **Phase 1: Foundational Setup (The Git Repository)**

This phase focuses on creating the "source of truth" for the shared memory.

1.  **Create a Central Git Repository**:

    - Initialize a new private repository on GitHub, GitLab, or another Git provider.
    - This repository will store all shared markdown files.
    - **Name**: `claude-shared-memory` (or similar).

2.  **Establish a Directory Structure**:

    - Clone the repository locally.
    - Create a clear, logical directory structure. This is crucial for organization and for Claude to easily locate files.

    ```
    /
    ├── instructions/
    │   ├── opening-a-pr.md
    │   ├── running-tests.md
    │   └── deployment/
    │       ├── general-deploy.md
    │       └── argocd-deploy.md
    ├── checks/
    │   ├── check-for-argocd.md
    │   └── check-for-python.md
    ├── templates/
    │   ├── python-dockerfile.template
    │   └── standard-readme.template
    └── project-init.md
    ```

3.  **Populate Initial Memory Files**:

    - Create a few essential instruction files.
    - Write them to be as generic as possible.
    - **Optimize for Tokens**: Use clear, concise language. Use headings, lists, and code blocks to structure the information for the LLM.
    - **Example `opening-a-pr.md`**:

      ```markdown
      ## Instructions for Opening a Pull Request

      1.  Ensure you are on a feature branch, not `main`.
      2.  Run all project tests using the instructions in `shared://instructions/running-tests.md`.
      3.  If tests pass, commit your changes with a conventional commit message.
      4.  Push the feature branch to the remote repository.
      5.  Create the pull request on GitHub, using the commit messages to generate the description.
      6.  Add the `needs-review` label.
      ```

## **Phase 2: MCP Server Development (The Core Engine)**

This phase involves building the API that Claude will interact with. We'll use Python with Flask for this example, but Node.js with Express is also a great choice.

### **Sprint 1: Read-Only Functionality**

- **Goal**: Create a server that can read and serve files from the Git repo.
- **Tasks**:
  1.  **Setup Project**:
      - Create a new directory for the MCP server.
      - Setup a Python virtual environment: `python -m venv venv`.
      - Install Flask: `pip install Flask`.
  2.  **Clone Repo**: The server needs a local clone of the `claude-shared-memory` repo. Decide where this will live (e.g., in a subdirectory of the server project).
  3.  **Create `read_shared_memory` Tool**:
      - Create a Flask app in `server.py`.
      - Add a POST endpoint `/tools/read_shared_memory`.
      - The endpoint will expect a JSON body: `{ "file_path": "instructions/opening-a-pr.md" }`.
      - It will securely read the contents of the requested file from the local Git clone and return it as a JSON response: `{ "content": "..." }`.
      - **Security**: Implement path traversal protection to ensure requests can't access files outside the designated memory directory.

### **Sprint 2: Write-Access Functionality**

- **Goal**: Enable Claude to modify the shared memory.
- **Tasks**:
  1.  **Install GitPython**: `pip install GitPython`. This library makes it easy to run Git commands from Python.
  2.  **Create `write_shared_memory` Tool**:
      - Add a POST endpoint `/tools/write_shared_memory`.
      - Expects JSON body: `{ "file_path": "...", "content": "...", "commit_message": "..." }`.
      - **Workflow**:
        a. Run `git pull` to ensure the repo is up-to-date.
        b. Write the new `content` to the specified `file_path`.
        c. Run `git add [file_path]`.
        d. Run `git commit -m [commit_message]`.
        e. Run `git push` to send the change back to the remote repository.
  3.  **Authentication**: Configure SSH keys for the MCP server so it can `pull` and `push` from your Git provider without manual intervention.

### **Sprint 3: State Management (Project Flags)**

- **Goal**: Allow the MCP server to track instance-specific configurations.
- **Tasks**:
  1.  **Data Store**: Choose a simple storage method for the flags. A single JSON file (`project_states.json`) is sufficient to start.
  2.  **Token Generation**: When a CC instance connects for the first time (or upon request), generate a unique ID for it.
  3.  **Implement Flag Tools**:
      - `GET /tools/get_available_checks`: Reads the `checks/` directory and returns a list of available check files.
      - `POST /tools/set_project_features`: Expects `{ "token": "...", "features": {"argocd": true, ...} }`. It will find the project by its token in `project_states.json` and update its features.
      - `GET /tools/get_project_features`: Expects `{ "token": "..." }` and returns the currently stored features for that project.

## **Phase 3: Synchronization & Data Consistency**

- **Goal**: Ensure the MCP server's local repo clone stays fresh.
- **Tasks**:
  1.  **Implement Polling (Simple Method)**:
      - Create a background thread in your Flask application.
      - The thread will run `git pull` on the local repo every 5 minutes.
  2.  **Implement Webhook (Advanced Method)**:
      - Create a new endpoint: `POST /webhook/git-update`.
      - When this endpoint receives a request, it runs `git pull`.
      - Go to your GitHub/GitLab repository settings -> Webhooks.
      - Add a new webhook pointing to your server's public URL and this endpoint.
      - Use a tool like `ngrok` to expose your local server to the internet for testing.

## **Phase 4: Claude Code Integration & Workflow**

- **Goal**: Define the user-facing workflow for using the system.
- **Tasks**:

  1.  **Connect MCP to Claude**: In a project directory, run the command to connect your running MCP server.
      ```bash
      claude mcp add shared-memory --url http://<your-mcp-server-ip>:5000
      ```
  2.  **Bootstrap `CLAUDE.md`**: This is the entry point. Create a `CLAUDE.md` file in the root of your project that teaches Claude about the system.

      ```markdown
      # Claude Memory

      This project is connected to a shared memory system via the `shared-memory` MCP.

      ## Available Tools

      - `shared-memory.read_shared_memory(file_path: str)`: Reads a file from the shared memory.
      - `shared-memory.write_shared_memory(file_path: str, content: str, commit_message: str)`: Writes a file to the shared memory. Always provide a clear, conventional commit message.
      - `shared-memory.get_project_features()`: Gets features for this project.
      - `shared-memory.set_project_features(features: dict)`: Sets features for this project.

      ## Initialization

      If this is a new project, run the initialization instructions located at `shared://project-init.md`.

      ## Golden Rule

      When asked to perform a common task (like opening a PR, running tests, or deploying), FIRST read the corresponding file from `shared://instructions/` unless I tell you otherwise.
      ```

  3.  **Define User Workflows**: Document the commands for yourself.
      - **For a new project**: "Claude, initialize this project."
      - **For a mid-task update**: "Stop. Re-read the instructions for opening a PR and continue."

## **Phase 5: Future Roadmap**

- **Goal**: Plan for future enhancements.
- **Ideas**:
  - **Semantic Search**: Implement a tool that uses vector embeddings to find the most relevant memory file instead of requiring an exact path.
  - **Versioning**: Add a parameter to `read_shared_memory` to get a file from a specific git tag or commit hash, e.g., `read_shared_memory(file_path="...", version="v1.2")`.
  - **Web UI**: Build a simple web interface for the MCP server to view project flags and browse the memory files.
  - **Tool Discovery**: Create a tool `list_files(path: str)` so Claude can explore the shared memory directories itself.
