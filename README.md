# MCP Video Generation Server

A powerful MCP (Model Context Protocol) server for AI video generation using the latest 2025 models. Generate videos from text prompts or images using cutting-edge AI models like Google Veo-3, Tencent HunyuanVideo, Mochi-1, and many more.

## Features

- **25+ AI Video Models**: Latest 2025 models including Veo-3, HunyuanVideo, Mochi-1, LTX-Video, Pyramid Flow, Seedance, Hailuo, Kling, and more
- **Multiple Input Types**: Text-to-video, image-to-video, and hybrid models
- **Advanced Parameters**: Duration, resolution, FPS, aspect ratio, motion intensity, camera movement
- **Video Processing Tools**: Metadata extraction, speed adjustment, scaling, filtering, concatenation, audio separation
- **Automatic Downloads**: Generated videos are automatically saved locally with organized naming
- **MCP Integration**: Works with Claude Desktop, Cursor, Claude Code, and other MCP clients

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm package manager
- Replicate API token
- FFmpeg (for video processing tools)

### Installation

1. Clone and install dependencies:
```bash
git clone <repository-url>
cd mcp-video-generation
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Add your REPLICATE_API_TOKEN to .env.local
```

3. Build and install to MCP clients:
```bash
pnpm run install-server  # Install to all MCP clients
# Or install to specific clients:
pnpm run install-desktop # Claude Desktop only
pnpm run install-cursor  # Cursor only
pnpm run install-code    # Claude Code only
```

## Supported Models

### Google Veo Models (2025)
- **veo-3**: Latest model with audio generation, up to 30s, 4K support
- **veo-3-fast**: Fast variant with audio generation
- **veo-2**: Previous generation, text-to-video only

### Tencent HunyuanVideo (2025)
- **hunyuan-video**: High-quality Chinese model, up to 10s, 720p-1280p

### Genmo Mochi-1 (2025)
- **mochi-1**: Open-source model, 5.4s max, 480p

### LTX Video (2025)
- **ltx-video**: Lightricks model, up to 10s, 768p

### Pyramid Flow (2025)
- **pyramid-flow**: Both text-to-video and image-to-video

### ByteDance Seedance (2025)
- **seedance-pro**: Professional model, both input types
- **seedance-lite**: Lightweight variant

### MiniMax Hailuo (2025)
- **hailuo-2**: Both text and image inputs
- **minimax-video**: Text-to-video only
- **minimax-director**: Director model with camera controls

### Kuaishou Kling (2025)
- **kling-v2.1-master**: Latest master model
- **kling-v1.6-pro**: Professional variant

### Luma Ray (2025)
- **ray-flash-2**: Fast variant
- **ray-2**: Standard model
- **luma-ray**: Original Ray model

### Alibaba WAN (2025)
- **wan-t2v-720p/480p**: Text-to-video variants
- **wan-i2v-720p/480p**: Image-to-video variants

### PixVerse (2025)
- **pixverse-v4.5**: Latest version, up to 8s, multiple resolutions

## Usage Examples

### Basic Video Generation

```javascript
// Generate a video with Veo-3
{
  "model": "veo-3",
  "prompt": "A serene sunrise over mountains with birds flying",
  "duration": 5,
  "resolution": "1080p",
  "aspect_ratio": "16:9",
  "generate_audio": true
}
```

### Image-to-Video

```javascript
// Convert image to video with Pyramid Flow
{
  "model": "pyramid-flow",
  "prompt": "The scene comes to life with gentle movement",
  "image": "https://example.com/image.jpg",
  "duration": 5,
  "resolution": "768p"
}
```

### Director Mode with Camera Controls

```javascript
// Use MiniMax Director for camera movement
{
  "model": "minimax-director",
  "prompt": "A cinematic shot of a bustling city street",
  "duration": 6,
  "camera_movement": "dolly",
  "resolution": "1080p"
}
```

## Video Processing Tools

### Metadata Extraction
```javascript
// Get comprehensive video metadata
{
  "tool": "get-video-metadata",
  "file_path": "/absolute/path/to/video.mp4"
}
```

### Speed Adjustment
```javascript
// Change video playback speed
{
  "tool": "adjust-video-speed",
  "input": "/path/to/input.mp4",
  "speed_factor": 2.0,  // 2x speed
  "output": "/path/to/output.mp4"
}
```

### Video Scaling
```javascript
// Resize video resolution
{
  "tool": "scale-video",
  "input": "/path/to/input.mp4",
  "width": 1920,
  "height": 1080,
  "output": "/path/to/output.mp4",
  "maintain_aspect": true
}
```

### Apply Filters
```javascript
// Apply FFmpeg filters
{
  "tool": "apply-video-filters",
  "input": "/path/to/input.mp4",
  "filter_string": "brightness=0.1,contrast=1.2",
  "output": "/path/to/output.mp4"
}
```

### Concatenate Videos
```javascript
// Join multiple videos
{
  "tool": "concatenate-segments",
  "inputs": ["/path/to/video1.mp4", "/path/to/video2.mp4"],
  "output": "/path/to/combined.mp4",
  "re_encode": false
}
```

### Separate Audio and Video
```javascript
// Extract audio and video tracks
{
  "tool": "separate-audio-and-video",
  "input": "/path/to/input.mp4",
  "video_output": "/path/to/video_only.mp4",
  "audio_output": "/path/to/audio_only.mp3",
  "audio_format": "mp3"
}
```

## Configuration

### Environment Variables

Create `.env.local` file with:
```
REPLICATE_API_TOKEN=your_replicate_token_here
```

### MCP Client Configuration

The server automatically updates configuration files for:
- Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Cursor: `~/Library/Application Support/Cursor/User/claude_desktop_config.json`
- Claude Code: `~/.claude/claude_code_config.json`
- MCP: `.mcp.json`

## Development

### Commands

```bash
pnpm run build        # Compile TypeScript
pnpm start            # Run the server
pnpm run install-server # Build and install to all clients
```

### Project Structure

```
src/
├── index.ts          # Main MCP server implementation
scripts/
├── update-config.js  # Configuration installer
dist/                 # Compiled JavaScript
videos/               # Default video output directory
```

### Adding New Models

1. Add model configuration to `VIDEO_MODELS` object in `src/index.ts`
2. Add model to the enum in the tool schema
3. Add model-specific parameter handling in the switch statement
4. Build and reinstall: `pnpm run install-server`

## Troubleshooting

### Common Issues

**FFmpeg not found**
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
```

**Replicate API errors**
- Verify your API token is correct
- Check your Replicate account credits
- Ensure the model version is still available

**Video generation timeout**
- Large videos may take up to 15 minutes
- Monitor progress using the web URL provided
- Check Replicate dashboard for queue status

**File permissions**
- Ensure output directories are writable
- Check file paths are absolute and valid

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review Replicate model documentation
- Open an issue on GitHub