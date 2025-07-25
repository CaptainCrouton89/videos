#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import all tool handlers
import {
  mergeAudioAndVideo,
  mergeAudioAndVideoSchema,
  separateAudioAndVideo,
  separateAudioAndVideoSchema,
} from "./tools/audio-video.js";
import {
  recordHtmlVideo,
  recordHtmlVideoSchema,
  takeScreenshot,
  takeScreenshotSchema,
} from "./tools/html-recording.js";
import {
  getHtmlVideoFeedback,
  getHtmlVideoFeedbackSchema,
} from "./tools/html-video-feedback.js";
import { getModels, getModelsSchema } from "./tools/models-info.js";
import { getContent, getContentSchema } from "./tools/video-content.js";
import {
  concatenateSegments,
  concatenateSegmentsSchema,
  imagesToVideo,
  imagesToVideoSchema,
} from "./tools/video-editing.js";
import {
  generateVideo,
  generateVideoSchema,
} from "./tools/video-generation.js";
import {
  getVideoMetadata,
  getVideoMetadataSchema,
} from "./tools/video-metadata.js";
import {
  adjustVideoSpeed,
  adjustVideoSpeedSchema,
  applyVideoFilters,
  applyVideoFiltersSchema,
  scaleVideo,
  scaleVideoSchema,
} from "./tools/video-processing.js";
import {
  videoTransition,
  videoTransitionSchema,
  advancedVideoEffects,
  advancedVideoEffectsSchema,
} from "./tools/video-transitions.js";

// Create the MCP server
const server = new McpServer({
  name: "video-generation",
  version: "1.0.0",
});

// Register all tools
server.tool(
  "generate-video",
  "Generate videos using latest 2025 AI models including Veo-3, HunyuanVideo, Mochi-1, LTX-Video, Pyramid Flow, Seedance, Hailuo, Kling, and more",
  generateVideoSchema.shape,
  generateVideo
);

server.tool(
  "get-video-metadata",
  "Extract comprehensive video metadata including duration, resolution, fps, codec, aspect ratio, audio properties, and orientation using FFprobe",
  getVideoMetadataSchema.shape,
  getVideoMetadata
);

server.tool(
  "adjust-video-speed",
  "Apply speed modification using setpts filter to change video playback speed",
  adjustVideoSpeedSchema.shape,
  adjustVideoSpeed
);

server.tool(
  "scale-video",
  "Resize video to target resolution while maintaining aspect ratio or forcing specific dimensions",
  scaleVideoSchema.shape,
  scaleVideo
);

server.tool(
  "apply-video-filters",
  "Apply custom FFmpeg video filters using filter strings for advanced video processing",
  applyVideoFiltersSchema.shape,
  applyVideoFilters
);

server.tool(
  "concatenate-segments",
  "Join multiple videos and/or images into a single video file using FFmpeg concat filter",
  concatenateSegmentsSchema.shape,
  concatenateSegments
);

server.tool(
  "images-to-video",
  "Create a video from a sequence of images with customizable durations and optional audio",
  imagesToVideoSchema.shape,
  imagesToVideo
);

server.tool(
  "separate-audio-and-video",
  "Create separate audio and video tracks from a video file, saving pure audio and pure video to new files",
  separateAudioAndVideoSchema.shape,
  separateAudioAndVideo
);

server.tool(
  "merge-audio-and-video",
  "Merge an audio file with a video file with options for replacing existing audio and trimming to match durations",
  mergeAudioAndVideoSchema.shape,
  mergeAudioAndVideo
);

server.tool(
  "get-models",
  "Get comprehensive information about all available video generation models including parameters, capabilities, performance, and cost estimates",
  getModelsSchema.shape,
  getModels
);

server.tool(
  "get-content",
  "Extract video content by taking screenshots at regular intervals and saving them to an output directory for analysis",
  getContentSchema.shape,
  getContent
);

server.tool(
  "record-html-video",
  "Opens an HTML file with Playwright and records it as a video at maximum dimensions (headless). Useful for creating video content that contains lots of text, logos, or abstract content. Can also be useful for videos that combine text with videos by layering them.",
  recordHtmlVideoSchema.shape,
  recordHtmlVideo
);

server.tool(
  "take-screenshot",
  "Takes a screenshot of an HTML file or HTML content",
  takeScreenshotSchema.shape,
  takeScreenshot
);

server.tool(
  "get-html-video-feedback",
  "Analyze video frames using Gemini AI to provide critical feedback on HTML/web page design, focusing on spacing, layout, and comprehensibility",
  getHtmlVideoFeedbackSchema.shape,
  getHtmlVideoFeedback
);

server.tool(
  "video-transition",
  "Apply professional transitions between multiple videos including fade, wipe, slide, dissolve, and advanced effects like glitch, datamosh, and cinematic transitions",
  videoTransitionSchema.shape,
  videoTransition
);

server.tool(
  "advanced-video-effects",
  "Apply advanced visual effects to videos including color grading, artistic filters, distortions, sci-fi effects, retro filters, and cinematic post-processing",
  advancedVideoEffectsSchema.shape,
  advancedVideoEffects
);

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Video Generation Server running...");
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

main().catch(console.error);
