# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Commands

### Development
- `pnpm run build` - Compile TypeScript to JavaScript in dist/ directory
- `pnpm start` - Run the compiled MCP server
- `pnpm install` - Install dependencies

### MCP Server Installation
- `pnpm run install-server` - Install to all MCP clients (Claude Desktop, Cursor, Claude Code, Gemini, MCP)
- `pnpm run install-desktop` - Install to Claude Desktop only
- `pnpm run install-cursor` - Install to Cursor only  
- `pnpm run install-code` - Install to Claude Code only
- `pnpm run install-mcp` - Install to .mcp.json only

Installation scripts automatically build the project and update the respective configuration files.

## Architecture

This is an MCP (Model Context Protocol) server for video generation built with:

- **Core Framework**: @modelcontextprotocol/sdk for MCP server implementation
- **Runtime**: Node.js with ES modules (`"type": "module"`)
- **Language**: TypeScript with ES2022 target
- **Schema Validation**: Zod for parameter validation
- **Transport**: StdioServerTransport for client communication
- **Video Generation**: Replicate API integration for AI video models

### Project Structure
```
src/
├── index.ts           # Main MCP server implementation
scripts/
├── update-config.js   # Multi-client configuration installer
dist/                  # Compiled JavaScript output
videos/                # Default video output directory
```

### Server Implementation Pattern

The server follows this pattern in src/index.ts:

1. **Server Creation**: `McpServer` instance with name "video-generation"
2. **Tool Registration**: Single `generate-video` tool with comprehensive Zod schema validation
3. **Transport Setup**: StdioServerTransport for client communication
4. **Error Handling**: Comprehensive error handling with process.exit(1)

### Video Generation Architecture

The main tool `generate-video` provides:
- **25+ AI Video Models**: Latest 2025 models including Veo-3, HunyuanVideo, Mochi-1, Seedance, etc.
- **Model Types**: Text-to-video, image-to-video, and hybrid models
- **Parameter Validation**: Comprehensive parameter validation with model-specific constraints
- **Async Processing**: Prediction polling with 15-minute timeout
- **File Management**: Automatic video download and local storage with organized naming

### Video Model Support

Models are configured in `VIDEO_MODELS` object with:
- Model version/endpoint mapping
- Supported input types (text-to-video, image-to-video, both)
- Maximum duration limits
- Supported resolutions
- Model-specific default parameters

### Key Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `zod` - Runtime type validation for tool parameters
- `replicate` - Replicate API client (optional, uses fetch directly)
- Node.js built-in modules: `fs`, `path`, `fetch`

## Environment Variables

Required `.env.local` file for video generation:
- `REPLICATE_API_TOKEN` - Required for Replicate API access

## Development Workflow

1. Set up Replicate API token in `.env.local`
2. Modify `src/index.ts` to add/update video models or parameters
3. Run `pnpm run build` to compile
4. Test with `pnpm start`
5. Use installation scripts to update MCP client configurations
6. Restart MCP clients to load changes

## Video Generation Workflow

1. **Model Selection**: Choose from 25+ supported AI video models
2. **Parameter Configuration**: Set duration, resolution, prompts, and model-specific parameters
3. **Async Processing**: Server polls Replicate API for completion (up to 15 minutes)
4. **File Management**: Videos automatically saved to `videos/` directory with timestamped filenames
5. **Progress Tracking**: Detailed status updates and web monitoring URLs provided