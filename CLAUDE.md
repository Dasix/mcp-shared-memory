# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an experimental MCP (Model Context Protocol) server that provides shared memory functionality across multiple projects.

## Development Setup

Since this is a new repository, the project structure and build commands are yet to be established. When implementing the MCP server, consider:

1. The project will need to implement the MCP server protocol
2. It will require a persistence mechanism for the shared memory
3. Authentication and access control may be needed for multi-project access

## Architecture Notes

As an MCP server, this project will need to:

- Handle MCP protocol messages for memory operations (read, write, update, delete)
- Manage concurrent access from multiple clients
- Provide a reliable storage backend for the shared memory state
