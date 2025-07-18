#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create the MCP server
const server = new McpServer({
  name: "video-generation",
  version: "1.0.0",
});

// Video generation models and their configurations
const VIDEO_MODELS = {
  "veo-2": {
    version: "google/veo-2",
    type: "text-to-video",
    maxDuration: 30,
    resolutions: ["720p", "1080p", "4K"],
    defaultParams: {
      duration: 5,
      resolution: "720p",
      fps: 24,
      guidance_scale: 7.5,
      num_inference_steps: 50
    }
  },
  "seedance-pro": {
    version: "bytedance/seedance-1-pro",
    type: "text-to-video",
    maxDuration: 10,
    resolutions: ["480p", "1080p"],
    defaultParams: {
      duration: 5,
      resolution: "480p",
      fps: 25,
      guidance_scale: 4.0,
      num_inference_steps: 50
    }
  },
  "wan-t2v-720p": {
    version: "wavespeedai/wan-2.1-t2v-720p",
    type: "text-to-video",
    maxDuration: 5,
    resolutions: ["720p"],
    defaultParams: {
      duration: 5,
      resolution: "720p",
      fps: 25,
      guide_scale: 4,
      steps: 50
    }
  },
  "wan-i2v-720p": {
    version: "wavespeedai/wan-2.1-i2v-720p",
    type: "image-to-video",
    maxDuration: 5,
    resolutions: ["720p"],
    defaultParams: {
      duration: 5,
      resolution: "720p",
      fps: 25,
      guide_scale: 4,
      steps: 50
    }
  },
  "minimax-video": {
    version: "minimax/video-01",
    type: "text-to-video",
    maxDuration: 6,
    resolutions: ["720p"],
    defaultParams: {
      duration: 6,
      resolution: "720p",
      fps: 25
    }
  }
};

// Video generation tool
server.tool(
  "generate-video",
  "Generate videos using various AI models including Veo-2, Seedance, Wan2.1, and Minimax",
  {
    model: z.enum(["veo-2", "seedance-pro", "wan-t2v-720p", "wan-i2v-720p", "minimax-video"]).describe("The video generation model to use"),
    prompt: z.string().describe("Text prompt describing the video content"),
    image: z.string().optional().describe("Image URL for image-to-video models"),
    duration: z.number().optional().describe("Video duration in seconds"),
    resolution: z.enum(["480p", "720p", "1080p", "4K"]).optional().describe("Video resolution"),
    fps: z.number().optional().describe("Frames per second"),
    guidance_scale: z.number().optional().describe("Guidance scale for generation quality"),
    seed: z.number().optional().describe("Random seed for reproducible results"),
    aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional().describe("Video aspect ratio"),
    negative_prompt: z.string().optional().describe("Negative prompt to avoid certain content")
  },
  async ({ model, prompt, image, duration, resolution, fps, guidance_scale, seed, aspect_ratio, negative_prompt }) => {
    try {
      const modelConfig = VIDEO_MODELS[model];
      if (!modelConfig) {
        throw new Error(`Unknown model: ${model}`);
      }

      if (modelConfig.type === "image-to-video" && !image) {
        throw new Error(`Model ${model} requires an image input`);
      }

      if (modelConfig.type === "text-to-video" && image) {
        throw new Error(`Model ${model} is text-to-video only and doesn't accept image input`);
      }

      const apiToken = process.env.REPLICATE_API_TOKEN;
      if (!apiToken) {
        throw new Error("REPLICATE_API_TOKEN environment variable is required");
      }

      const input = {
        prompt,
        ...modelConfig.defaultParams,
        ...(duration && { duration: Math.min(duration, modelConfig.maxDuration) }),
        ...(resolution && modelConfig.resolutions.includes(resolution) && { resolution }),
        ...(fps && { fps }),
        ...(guidance_scale && { guidance_scale }),
        ...(seed && { seed }),
        ...(aspect_ratio && { aspect_ratio }),
        ...(negative_prompt && { negative_prompt }),
        ...(image && { image })
      };

      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          version: modelConfig.version,
          input
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Replicate API error: ${error.detail || response.statusText}`);
      }

      const prediction = await response.json();
      
      return {
        content: [
          {
            type: "text",
            text: `Video generation started successfully!
            
Model: ${model}
Prediction ID: ${prediction.id}
Status: ${prediction.status}
Web URL: ${prediction.urls.web}

Generated with parameters:
- Prompt: ${prompt}
- Duration: ${input.duration}s
- Resolution: ${input.resolution}
- FPS: ${input.fps}
${image ? `- Input Image: ${image}` : ''}
${aspect_ratio ? `- Aspect Ratio: ${aspect_ratio}` : ''}
${negative_prompt ? `- Negative Prompt: ${negative_prompt}` : ''}

Check the web URL above to monitor progress and download the generated video once complete.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error generating video: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Hello World Server running...");
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

main().catch(console.error);
