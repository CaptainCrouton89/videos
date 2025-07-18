#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

// Create the MCP server
const server = new McpServer({
  name: "video-generation",
  version: "1.0.0",
});

// Video generation models and their configurations
const VIDEO_MODELS = {
  // Google Veo Models (2025)
  "veo-3": {
    version: "google/veo-3",
    type: "text-to-video",
    maxDuration: 30,
    resolutions: ["720p", "1080p", "4K"],
    hasAudio: true,
    defaultParams: {
      duration: 5,
      aspect_ratio: "16:9",
      enhance_prompt: true,
      generate_audio: true,
      person_generation: "allow_all",
    },
  },
  "veo-3-fast": {
    version: "google/veo-3-fast",
    type: "text-to-video",
    maxDuration: 30,
    resolutions: ["720p", "1080p", "4K"],
    hasAudio: true,
    defaultParams: {
      duration: 5,
      aspect_ratio: "16:9",
      enhance_prompt: true,
      generate_audio: true,
      person_generation: "allow_all",
    },
  },
  "veo-2": {
    version: "google/veo-2",
    type: "text-to-video",
    maxDuration: 30,
    resolutions: ["720p", "1080p", "4K"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      resolution: "720p",
      fps: 24,
      guidance_scale: 7.5,
      num_inference_steps: 50,
    },
  },

  // Tencent HunyuanVideo (2025)
  "hunyuan-video": {
    version: "tencent/hunyuan-video",
    type: "text-to-video",
    maxDuration: 10,
    resolutions: ["720p", "1280p"],
    defaultParams: {
      video_size: "720x1280",
      video_length: 129,
      inference_steps: 50,
      guidance_scale: 6,
      flow_reverse: false,
      cpu_offload: true,
    },
  },

  // Genmo Mochi-1 (2025)
  "mochi-1": {
    version: "genmoai/mochi-1",
    type: "text-to-video",
    maxDuration: 5.4,
    resolutions: ["480p"],
    defaultParams: {
      num_frames: 31,
      height: 480,
      width: 848,
      num_inference_steps: 64,
      guidance_scale: 4.5,
      fps: 30,
    },
  },

  // LTX Video (2025)
  "ltx-video": {
    version: "lightricks/ltx-video",
    type: "text-to-video",
    maxDuration: 10,
    resolutions: ["768p"],
    defaultParams: {
      duration: 5,
      fps: 24,
      resolution: "768x512",
    },
  },

  // Pyramid Flow (2025)
  "pyramid-flow": {
    version: "zsxkib/pyramid-flow",
    type: "both",
    maxDuration: 10,
    resolutions: ["768p"],
    defaultParams: {
      duration: 5,
      resolution: "768p",
      flow_steps: 50,
    },
  },

  // ByteDance Seedance Models (2025)
  "seedance-pro": {
    version: "bytedance/seedance-1-pro",
    type: "both",
    maxDuration: 10,
    resolutions: ["480p", "720p", "1080p"],
    defaultParams: {
      duration: 5,
      resolution: "480p",
      mode: "text-to-video",
    },
  },
  "seedance-lite": {
    version: "bytedance/seedance-1-lite",
    type: "both",
    maxDuration: 10,
    resolutions: ["480p", "720p"],
    defaultParams: {
      duration: 5,
      resolution: "480p",
      mode: "text-to-video",
    },
  },

  // MiniMax Hailuo Models (2025)
  "hailuo-2": {
    version: "minimax/hailuo-02",
    type: "both",
    maxDuration: 10,
    resolutions: ["720p", "1080p"],
    defaultParams: {
      duration: 6,
      resolution: "720p",
    },
  },
  "minimax-video": {
    version: "minimax/video-01",
    type: "text-to-video",
    maxDuration: 6,
    resolutions: ["720p"],
    defaultParams: {
      duration: 6,
      resolution: "720p",
      fps: 25,
    },
  },
  "minimax-director": {
    version: "minimax/video-01-director",
    type: "both",
    maxDuration: 10,
    resolutions: ["720p", "1080p"],
    defaultParams: {
      duration: 6,
      resolution: "720p",
      camera_movement: "static",
    },
  },

  // Kuaishou Kling Models (2025)
  "kling-v2.1-master": {
    version: "kwaivgi/kling-v2.1-master",
    type: "both",
    maxDuration: 10,
    resolutions: ["720p", "1080p"],
    defaultParams: {
      duration: 5,
      resolution: "720p",
      motion_intensity: 5,
    },
  },
  "kling-v1.6-pro": {
    version: "kwaivgi/kling-v1.6-pro",
    type: "both",
    maxDuration: 10,
    resolutions: ["1080p"],
    defaultParams: {
      duration: 5,
      resolution: "1080p",
    },
  },

  // Luma Ray Models (2025)
  "ray-flash-2": {
    version: "luma/ray-flash-2-720p",
    type: "both",
    maxDuration: 10,
    resolutions: ["720p"],
    defaultParams: {
      duration: 5,
      resolution: "720p",
    },
  },
  "ray-2": {
    version: "luma/ray-2-720p",
    type: "both",
    maxDuration: 10,
    resolutions: ["720p"],
    defaultParams: {
      duration: 5,
      resolution: "720p",
    },
  },
  "luma-ray": {
    version: "luma/ray",
    type: "both",
    maxDuration: 10,
    resolutions: ["720p", "1080p"],
    defaultParams: {
      duration: 5,
      resolution: "720p",
    },
  },

  // Alibaba WAN Models (2025)
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
      steps: 50,
    },
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
      steps: 50,
    },
  },
  "wan-t2v-480p": {
    version: "wavespeedai/wan-2.1-t2v-480p",
    type: "text-to-video",
    maxDuration: 5,
    resolutions: ["480p"],
    defaultParams: {
      duration: 5,
      resolution: "480p",
      fps: 25,
      guide_scale: 4,
      steps: 50,
    },
  },
  "wan-i2v-480p": {
    version: "wavespeedai/wan-2.1-i2v-480p",
    type: "image-to-video",
    maxDuration: 5,
    resolutions: ["480p"],
    defaultParams: {
      duration: 5,
      resolution: "480p",
      fps: 25,
      guide_scale: 4,
      steps: 50,
    },
  },

  // PixVerse Models (2025)
  "pixverse-v4.5": {
    version: "pixverse/pixverse-v4.5",
    type: "both",
    maxDuration: 8,
    resolutions: ["540p", "720p", "1080p"],
    defaultParams: {
      duration: 5,
      resolution: "720p",
    },
  },
};

// Helper function to wait for prediction completion and save video
async function waitAndSaveVideo(
  predictionId: string,
  apiToken: string,
  savePath: string,
  model: string,
  prompt: string
): Promise<string> {
  const maxWaitTime = 15 * 60 * 1000; // 15 minutes
  const pollInterval = 10000; // 10 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to check prediction status: ${response.statusText}`
      );
    }

    const prediction = await response.json();

    if (prediction.status === "succeeded" && prediction.output) {
      // Create save directory
      const saveDir = path.resolve(process.cwd(), savePath);
      await fs.mkdir(saveDir, { recursive: true });

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const sanitizedPrompt = prompt.slice(0, 50).replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${model}_${sanitizedPrompt}_${timestamp}.mp4`;
      const filePath = path.join(saveDir, filename);

      // Download and save video
      const videoUrl = Array.isArray(prediction.output)
        ? prediction.output[0]
        : prediction.output;
      const videoResponse = await fetch(videoUrl);

      if (!videoResponse.ok) {
        throw new Error(
          `Failed to download video: ${videoResponse.statusText}`
        );
      }

      const videoBuffer = await videoResponse.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(videoBuffer));

      return filePath;
    } else if (prediction.status === "failed") {
      throw new Error(
        `Video generation failed: ${prediction.error || "Unknown error"}`
      );
    } else if (prediction.status === "canceled") {
      throw new Error("Video generation was canceled");
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Video generation timed out after 15 minutes");
}

// Video generation tool
server.tool(
  "generate-video",
  "Generate videos using latest 2025 AI models including Veo-3, HunyuanVideo, Mochi-1, LTX-Video, Pyramid Flow, Seedance, Hailuo, Kling, and more",
  {
    model: z
      .enum([
        // Google Veo Models (2025)
        "veo-3",
        "veo-3-fast",
        "veo-2",
        // Tencent HunyuanVideo (2025)
        "hunyuan-video",
        // Genmo Mochi-1 (2025)
        "mochi-1",
        // LTX Video (2025)
        "ltx-video",
        // Pyramid Flow (2025)
        "pyramid-flow",
        // ByteDance Seedance Models (2025)
        "seedance-pro",
        "seedance-lite",
        // MiniMax Hailuo Models (2025)
        "hailuo-2",
        "minimax-video",
        "minimax-director",
        // Kuaishou Kling Models (2025)
        "kling-v2.1-master",
        "kling-v1.6-pro",
        // Luma Ray Models (2025)
        "ray-flash-2",
        "ray-2",
        "luma-ray",
        // Alibaba WAN Models (2025)
        "wan-t2v-720p",
        "wan-i2v-720p",
        "wan-t2v-480p",
        "wan-i2v-480p",
        // PixVerse Models (2025)
        "pixverse-v4.5",
      ])
      .describe("The video generation model to use"),
    prompt: z.string().describe("Text prompt describing the video content"),
    image: z
      .string()
      .optional()
      .describe("Image URL for image-to-video models"),
    duration: z.number().optional().describe("Video duration in seconds"),
    resolution: z
      .enum(["480p", "540p", "720p", "768p", "1080p", "1280p", "4K"])
      .optional()
      .describe("Video resolution"),
    fps: z.number().optional().describe("Frames per second"),
    guidance_scale: z
      .number()
      .optional()
      .describe("Guidance scale for generation quality"),
    seed: z
      .number()
      .optional()
      .describe("Random seed for reproducible results"),
    aspect_ratio: z
      .enum(["16:9", "9:16", "1:1"])
      .optional()
      .describe("Video aspect ratio"),
    negative_prompt: z
      .string()
      .optional()
      .describe("Negative prompt to avoid certain content"),
    enhance_prompt: z
      .boolean()
      .optional()
      .describe("Whether to enhance the prompt (Veo models)"),
    generate_audio: z
      .boolean()
      .optional()
      .describe("Whether to generate audio (Veo models)"),
    camera_movement: z
      .enum(["static", "pan", "tilt", "zoom", "dolly"])
      .optional()
      .describe("Camera movement (director models)"),
    motion_intensity: z
      .number()
      .optional()
      .describe("Motion intensity level (1-10)"),
    save_path: z
      .string()
      .optional()
      .describe("Relative path to save the video (default: 'videos')"),
  },
  async ({
    model,
    prompt,
    image,
    duration,
    resolution,
    fps,
    guidance_scale,
    seed,
    aspect_ratio,
    negative_prompt,
    enhance_prompt,
    generate_audio,
    camera_movement,
    motion_intensity,
    save_path,
  }) => {
    try {
      const modelConfig = VIDEO_MODELS[model];
      if (!modelConfig) {
        throw new Error(`Unknown model: ${model}`);
      }

      // Validate input types
      if (modelConfig.type === "image-to-video" && !image) {
        throw new Error(`Model ${model} requires an image input`);
      }

      if (modelConfig.type === "text-to-video" && image) {
        throw new Error(
          `Model ${model} is text-to-video only and doesn't accept image input`
        );
      }

      const apiToken = process.env.REPLICATE_API_TOKEN;
      if (!apiToken) {
        throw new Error("REPLICATE_API_TOKEN environment variable is required");
      }

      // Build input parameters based on model type
      let input: any = {
        prompt,
        ...modelConfig.defaultParams,
      };

      // Add common parameters
      if (duration) {
        input.duration = Math.min(duration, modelConfig.maxDuration);
      }
      if (seed) {
        input.seed = seed;
      }
      if (negative_prompt) {
        input.negative_prompt = negative_prompt;
      }
      if (
        image &&
        (modelConfig.type === "image-to-video" || modelConfig.type === "both")
      ) {
        input.image = image;
      }

      // Model-specific parameter mapping
      switch (model) {
        case "veo-3":
        case "veo-3-fast":
          if (aspect_ratio) input.aspect_ratio = aspect_ratio;
          if (enhance_prompt !== undefined)
            input.enhance_prompt = enhance_prompt;
          if (generate_audio !== undefined)
            input.generate_audio = generate_audio;
          break;

        case "veo-2":
          if (resolution && modelConfig.resolutions.includes(resolution))
            input.resolution = resolution;
          if (fps) input.fps = fps;
          if (guidance_scale) input.guidance_scale = guidance_scale;
          break;

        case "hunyuan-video":
          if (resolution === "720p") input.video_size = "720x1280";
          else if (resolution === "1280p") input.video_size = "1280x720";
          if (guidance_scale) input.guidance_scale = guidance_scale;
          break;

        case "mochi-1":
          if (guidance_scale) input.guidance_scale = guidance_scale;
          if (fps) input.fps = fps;
          break;

        case "ltx-video":
          if (fps) input.fps = fps;
          break;

        case "pyramid-flow":
          if (image) input.image = image;
          break;

        case "seedance-pro":
        case "seedance-lite":
          if (resolution && modelConfig.resolutions.includes(resolution))
            input.resolution = resolution;
          if (image) input.mode = "image-to-video";
          break;

        case "hailuo-2":
        case "minimax-video":
          if (resolution && modelConfig.resolutions.includes(resolution))
            input.resolution = resolution;
          if (image) input.image = image;
          break;

        case "minimax-director":
          if (resolution && modelConfig.resolutions.includes(resolution))
            input.resolution = resolution;
          if (camera_movement) input.camera_movement = camera_movement;
          if (image) input.image = image;
          break;

        case "kling-v2.1-master":
        case "kling-v1.6-pro":
          if (resolution && modelConfig.resolutions.includes(resolution))
            input.resolution = resolution;
          if (motion_intensity) input.motion_intensity = motion_intensity;
          if (image) input.image = image;
          break;

        case "ray-flash-2":
        case "ray-2":
        case "luma-ray":
          if (resolution && modelConfig.resolutions.includes(resolution))
            input.resolution = resolution;
          if (image) input.image = image;
          break;

        case "wan-t2v-720p":
        case "wan-t2v-480p":
          if (fps) input.fps = fps;
          if (guidance_scale) input.guide_scale = guidance_scale;
          break;

        case "wan-i2v-720p":
        case "wan-i2v-480p":
          if (fps) input.fps = fps;
          if (guidance_scale) input.guide_scale = guidance_scale;
          if (image) input.image = image;
          break;

        case "pixverse-v4.5":
          if (resolution && modelConfig.resolutions.includes(resolution))
            input.resolution = resolution;
          if (image) input.image = image;
          break;

        default:
          // Generic parameter mapping for other models
          if (resolution && modelConfig.resolutions.includes(resolution))
            input.resolution = resolution;
          if (fps) input.fps = fps;
          if (guidance_scale) input.guidance_scale = guidance_scale;
          if (image) input.image = image;
      }

      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: modelConfig.version,
          input,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Replicate API error: ${error.detail || response.statusText}`
        );
      }

      const prediction = await response.json();

      // Wait for the prediction to complete and save the video
      let savedFilePath = null;
      if (prediction.id) {
        savedFilePath = await waitAndSaveVideo(
          prediction.id,
          apiToken,
          save_path || "videos",
          model,
          prompt
        );
      }

      // Build response message
      const features = [];
      if ((modelConfig as any).hasAudio) features.push("Audio Generation");
      if (modelConfig.type === "both")
        features.push("Text-to-Video & Image-to-Video");
      else if (modelConfig.type === "image-to-video")
        features.push("Image-to-Video");
      else features.push("Text-to-Video");

      const paramDetails = [];
      paramDetails.push(`Prompt: ${prompt}`);
      paramDetails.push(
        `Duration: ${input.duration || (modelConfig.defaultParams as any).duration || 5}s`
      );
      paramDetails.push(`Max Duration: ${modelConfig.maxDuration}s`);
      paramDetails.push(`Resolutions: ${modelConfig.resolutions.join(", ")}`);
      if (input.resolution)
        paramDetails.push(`Selected Resolution: ${input.resolution}`);
      if (input.fps) paramDetails.push(`FPS: ${input.fps}`);
      if (input.aspect_ratio)
        paramDetails.push(`Aspect Ratio: ${input.aspect_ratio}`);
      if (input.generate_audio)
        paramDetails.push(`Audio Generation: ${input.generate_audio}`);
      if (input.camera_movement)
        paramDetails.push(`Camera Movement: ${input.camera_movement}`);
      if (input.motion_intensity)
        paramDetails.push(`Motion Intensity: ${input.motion_intensity}`);
      if (image) paramDetails.push(`Input Image: ${image}`);
      if (negative_prompt)
        paramDetails.push(`Negative Prompt: ${negative_prompt}`);
      if (input.seed) paramDetails.push(`Seed: ${input.seed}`);

      return {
        content: [
          {
            type: "text",
            text: `🎬 Video Generation ${
              savedFilePath
                ? "Completed Successfully!"
                : "Started Successfully!"
            }

📋 **Model Details:**
- Model: ${model} (${modelConfig.version})
- Features: ${features.join(", ")}
- Prediction ID: ${prediction.id}
- Status: ${prediction.status}

${
  savedFilePath
    ? `💾 **Saved Video:**
- File Path: ${savedFilePath}
- Directory: ${path.dirname(savedFilePath)}
- Filename: ${path.basename(savedFilePath)}

✅ **Success!**
Your video has been generated and saved successfully!`
    : `🔗 **Monitor Progress:**
${prediction.urls.web}

📥 **Next Steps:**
1. Click the web URL above to monitor progress
2. Download the generated video once complete
3. Processing time varies by model complexity and queue load`
}

⚙️ **Generation Parameters:**
${paramDetails.map((p) => `- ${p}`).join("\n")}

${(modelConfig as any).hasAudio ? "🎵 This model includes audio generation!" : ""}
${
  modelConfig.type === "both"
    ? "🖼️ This model supports both text-to-video and image-to-video!"
    : ""
}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error generating video: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
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
