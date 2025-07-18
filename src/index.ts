#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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

// Video metadata extraction tool
server.tool(
  "get-video-metadata",
  "Extract comprehensive video metadata including duration, resolution, fps, codec, aspect ratio, audio properties, and orientation using FFprobe",
  {
    file_path: z.string().describe("Absolute path to the video file"),
  },
  async ({ file_path }) => {
    try {
      // Check if file exists
      await fs.access(file_path);
      
      // Execute FFprobe command to get comprehensive metadata
      const ffprobeCommand = `ffprobe -v quiet -print_format json -show_format -show_streams "${file_path}"`;
      const { stdout, stderr } = await execAsync(ffprobeCommand);
      
      if (stderr) {
        throw new Error(`FFprobe error: ${stderr}`);
      }

      const metadata = JSON.parse(stdout);
      
      // Extract video stream information
      const videoStream = metadata.streams.find((stream: any) => stream.codec_type === 'video');
      const audioStream = metadata.streams.find((stream: any) => stream.codec_type === 'audio');
      const format = metadata.format;

      if (!videoStream) {
        throw new Error("No video stream found in the file");
      }

      // Calculate precise duration
      const duration = parseFloat(format.duration || videoStream.duration || '0');
      
      // Extract video properties
      const width = parseInt(videoStream.width || '0');
      const height = parseInt(videoStream.height || '0');
      const aspectRatio = width && height ? `${width}:${height}` : 'unknown';
      const fps = videoStream.r_frame_rate ? eval(videoStream.r_frame_rate) : 'unknown';
      const videoCodec = videoStream.codec_name || 'unknown';
      const videoBitrate = videoStream.bit_rate ? parseInt(videoStream.bit_rate) : null;
      
      // Determine orientation
      const orientation = width > height ? 'landscape' : height > width ? 'portrait' : 'square';
      
      // Extract audio properties if available
      let audioProperties = null;
      if (audioStream) {
        audioProperties = {
          codec: audioStream.codec_name || 'unknown',
          sample_rate: audioStream.sample_rate ? parseInt(audioStream.sample_rate) : null,
          channels: audioStream.channels || null,
          bitrate: audioStream.bit_rate ? parseInt(audioStream.bit_rate) : null,
          channel_layout: audioStream.channel_layout || 'unknown'
        };
      }

      // Format file size
      const fileSizeBytes = parseInt(format.size || '0');
      const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

      return {
        content: [
          {
            type: "text",
            text: `📹 **Video Metadata Analysis**

**📁 File Information:**
- Path: ${file_path}
- Size: ${fileSizeMB} MB (${fileSizeBytes.toLocaleString()} bytes)
- Duration: ${duration.toFixed(3)} seconds (${Math.floor(duration / 60)}:${(duration % 60).toFixed(3).padStart(6, '0')})

**🎬 Video Properties:**
- Resolution: ${width}x${height}
- Aspect Ratio: ${aspectRatio}
- Orientation: ${orientation}
- FPS: ${typeof fps === 'number' ? fps.toFixed(2) : fps}
- Codec: ${videoCodec}
${videoBitrate ? `- Video Bitrate: ${(videoBitrate / 1000).toFixed(0)} kbps` : ''}

${audioProperties ? `**🎵 Audio Properties:**
- Codec: ${audioProperties.codec}
- Sample Rate: ${audioProperties.sample_rate ? `${audioProperties.sample_rate} Hz` : 'unknown'}
- Channels: ${audioProperties.channels || 'unknown'}
- Channel Layout: ${audioProperties.channel_layout}
${audioProperties.bitrate ? `- Audio Bitrate: ${(audioProperties.bitrate / 1000).toFixed(0)} kbps` : ''}` : '**🔇 Audio:** No audio stream detected'}

**📊 Format Information:**
- Container: ${format.format_name || 'unknown'}
- Container Long Name: ${format.format_long_name || 'unknown'}
${format.bit_rate ? `- Overall Bitrate: ${(parseInt(format.bit_rate) / 1000).toFixed(0)} kbps` : ''}

**🎯 Quick Stats:**
- Is Landscape: ${orientation === 'landscape' ? 'Yes' : 'No'}
- Is Portrait: ${orientation === 'portrait' ? 'Yes' : 'No'}
- Has Audio: ${audioProperties ? 'Yes' : 'No'}
- Video Stream Count: ${metadata.streams.filter((s: any) => s.codec_type === 'video').length}
- Audio Stream Count: ${metadata.streams.filter((s: any) => s.codec_type === 'audio').length}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error analyzing video metadata: ${error instanceof Error ? error.message : String(error)}

**Common Issues:**
- FFprobe not installed (install via: brew install ffmpeg)
- File path doesn't exist or is inaccessible
- File is not a valid video format
- Insufficient permissions to read the file`
          }
        ]
      };
    }
  }
);

// Video speed adjustment tool
server.tool(
  "adjust-video-speed",
  "Apply speed modification using setpts filter to change video playback speed",
  {
    input: z.string().describe("Absolute path to the input video file"),
    speed_factor: z.number().describe("Speed factor (0.5 = half speed, 2.0 = double speed)"),
    output: z.string().describe("Absolute path for the output video file"),
  },
  async ({ input, speed_factor, output }) => {
    try {
      // Validate input file exists
      await fs.access(input);
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(output), { recursive: true });
      
      // Calculate setpts value (inverse of speed factor)
      const setptsValue = 1 / speed_factor;
      
      // Build FFmpeg command
      const ffmpegCommand = `ffmpeg -i "${input}" -filter:v "setpts=${setptsValue}*PTS" -filter:a "atempo=${speed_factor}" -c:v libx264 -c:a aac "${output}"`;
      
      const { stdout, stderr } = await execAsync(ffmpegCommand);
      
      return {
        content: [
          {
            type: "text",
            text: `⚡ **Video Speed Adjustment Complete**

**📁 Input:** ${input}
**📁 Output:** ${output}
**🎬 Speed Factor:** ${speed_factor}x (${speed_factor > 1 ? 'faster' : speed_factor < 1 ? 'slower' : 'normal'})
**⚙️ Video Filter:** setpts=${setptsValue}*PTS
**🎵 Audio Filter:** atempo=${speed_factor}

✅ **Success!** Video speed has been adjusted and saved to the output file.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error adjusting video speed: ${error instanceof Error ? error.message : String(error)}

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- Input file doesn't exist or is inaccessible
- Output directory doesn't exist or lacks write permissions
- Invalid speed factor (must be > 0)`
          }
        ]
      };
    }
  }
);

// Video scaling tool
server.tool(
  "scale-video",
  "Resize video to target resolution while maintaining aspect ratio or forcing specific dimensions",
  {
    input: z.string().describe("Absolute path to the input video file"),
    width: z.number().describe("Target width in pixels"),
    height: z.number().describe("Target height in pixels"),
    output: z.string().describe("Absolute path for the output video file"),
    maintain_aspect: z.boolean().optional().describe("Maintain aspect ratio (default: false)"),
  },
  async ({ input, width, height, output, maintain_aspect = false }) => {
    try {
      // Validate input file exists
      await fs.access(input);
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(output), { recursive: true });
      
      // Build scale filter
      const scaleFilter = maintain_aspect ? `scale=${width}:${height}:force_original_aspect_ratio=decrease` : `scale=${width}:${height}`;
      
      // Build FFmpeg command
      const ffmpegCommand = `ffmpeg -i "${input}" -vf "${scaleFilter}" -c:v libx264 -c:a copy "${output}"`;
      
      const { stdout, stderr } = await execAsync(ffmpegCommand);
      
      return {
        content: [
          {
            type: "text",
            text: `📏 **Video Scaling Complete**

**📁 Input:** ${input}
**📁 Output:** ${output}
**🎬 Target Resolution:** ${width}x${height}
**⚙️ Scale Filter:** ${scaleFilter}
**📐 Aspect Ratio:** ${maintain_aspect ? 'Maintained' : 'Forced to exact dimensions'}

✅ **Success!** Video has been resized and saved to the output file.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error scaling video: ${error instanceof Error ? error.message : String(error)}

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- Input file doesn't exist or is inaccessible
- Output directory doesn't exist or lacks write permissions
- Invalid dimensions (must be > 0)`
          }
        ]
      };
    }
  }
);

// Apply video filters tool
server.tool(
  "apply-video-filters",
  "Apply custom FFmpeg video filters using filter strings for advanced video processing",
  {
    input: z.string().describe("Absolute path to the input video file"),
    filter_string: z.string().describe("FFmpeg filter string (e.g., 'brightness=0.1,contrast=1.2')"),
    output: z.string().describe("Absolute path for the output video file"),
    copy_audio: z.boolean().optional().describe("Copy audio stream unchanged (default: true)"),
  },
  async ({ input, filter_string, output, copy_audio = true }) => {
    try {
      // Validate input file exists
      await fs.access(input);
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(output), { recursive: true });
      
      // Build FFmpeg command
      const audioOption = copy_audio ? '-c:a copy' : '-c:a aac';
      const ffmpegCommand = `ffmpeg -i "${input}" -vf "${filter_string}" -c:v libx264 ${audioOption} "${output}"`;
      
      const { stdout, stderr } = await execAsync(ffmpegCommand);
      
      return {
        content: [
          {
            type: "text",
            text: `🎨 **Video Filters Applied**

**📁 Input:** ${input}
**📁 Output:** ${output}
**⚙️ Filter String:** ${filter_string}
**🎵 Audio Processing:** ${copy_audio ? 'Copied unchanged' : 'Re-encoded with AAC'}

✅ **Success!** Video filters have been applied and saved to the output file.

**Example Filter Strings:**
- brightness=0.1,contrast=1.2 (adjust brightness and contrast)
- hue=s=0 (convert to grayscale)
- rotate=PI/4 (rotate 45 degrees)
- blur=5 (apply blur effect)
- sharpen=luma_msize_x=5:luma_msize_y=5 (sharpen image)`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error applying video filters: ${error instanceof Error ? error.message : String(error)}

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- Input file doesn't exist or is inaccessible
- Output directory doesn't exist or lacks write permissions
- Invalid filter string syntax
- Filter not supported by your FFmpeg version`
          }
        ]
      };
    }
  }
);

// Concatenate video segments tool
server.tool(
  "concatenate-segments",
  "Join multiple videos into a single video file using FFmpeg concat filter",
  {
    inputs: z.array(z.string()).describe("Array of absolute paths to input video files"),
    output: z.string().describe("Absolute path for the output video file"),
    re_encode: z.boolean().optional().describe("Re-encode videos for compatibility (default: false)"),
  },
  async ({ inputs, output, re_encode = false }) => {
    try {
      // Validate all input files exist
      for (const input of inputs) {
        await fs.access(input);
      }
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(output), { recursive: true });
      
      if (re_encode) {
        // Use concat filter for re-encoding (handles different formats/codecs)
        const inputsString = inputs.map((input, index) => `[${index}:v] [${index}:a]`).join(' ');
        const concatString = `${inputsString} concat=n=${inputs.length}:v=1:a=1 [v] [a]`;
        const inputFlags = inputs.map(input => `-i "${input}"`).join(' ');
        const ffmpegCommand = `ffmpeg ${inputFlags} -filter_complex "${concatString}" -map "[v]" -map "[a]" -c:v libx264 -c:a aac "${output}"`;
        
        const { stdout, stderr } = await execAsync(ffmpegCommand);
      } else {
        // Use concat demuxer for faster concatenation (requires same format/codec)
        const tempListFile = path.join(path.dirname(output), 'concat_list.txt');
        const listContent = inputs.map(input => `file '${input}'`).join('\n');
        
        await fs.writeFile(tempListFile, listContent);
        
        const ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${tempListFile}" -c copy "${output}"`;
        const { stdout, stderr } = await execAsync(ffmpegCommand);
        
        // Clean up temp file
        await fs.unlink(tempListFile);
      }
      
      return {
        content: [
          {
            type: "text",
            text: `🔗 **Video Concatenation Complete**

**📁 Input Files:** ${inputs.length} videos
${inputs.map((input, index) => `  ${index + 1}. ${path.basename(input)}`).join('\n')}

**📁 Output:** ${output}
**⚙️ Method:** ${re_encode ? 'Re-encode (compatible with different formats)' : 'Copy streams (faster, requires same format)'}

✅ **Success!** ${inputs.length} videos have been joined into a single file.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error concatenating videos: ${error instanceof Error ? error.message : String(error)}

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- One or more input files don't exist or are inaccessible
- Output directory doesn't exist or lacks write permissions
- Videos have different formats/codecs (try re_encode: true)
- Insufficient disk space for output file`
          }
        ]
      };
    }
  }
);

// Separate audio and video tool
server.tool(
  "separate-audio-and-video",
  "Create separate audio and video tracks from a video file, saving pure audio and pure video to new files",
  {
    input: z.string().describe("Absolute path to the input video file"),
    video_output: z.string().describe("Absolute path for the pure video output file (no audio)"),
    audio_output: z.string().describe("Absolute path for the pure audio output file"),
    audio_format: z.enum(['mp3', 'wav', 'aac', 'flac']).optional().describe("Audio format (default: mp3)"),
  },
  async ({ input, video_output, audio_output, audio_format = 'mp3' }) => {
    try {
      // Validate input file exists
      await fs.access(input);
      
      // Ensure output directories exist
      await fs.mkdir(path.dirname(video_output), { recursive: true });
      await fs.mkdir(path.dirname(audio_output), { recursive: true });
      
      // Extract video without audio
      const videoCommand = `ffmpeg -i "${input}" -c:v copy -an "${video_output}"`;
      
      // Extract audio without video
      const audioCodec = audio_format === 'mp3' ? 'mp3' : audio_format === 'wav' ? 'pcm_s16le' : audio_format === 'aac' ? 'aac' : 'flac';
      const audioCommand = `ffmpeg -i "${input}" -vn -c:a ${audioCodec} "${audio_output}"`;
      
      // Execute both commands
      const [videoResult, audioResult] = await Promise.all([
        execAsync(videoCommand),
        execAsync(audioCommand)
      ]);
      
      return {
        content: [
          {
            type: "text",
            text: `🎬🎵 **Audio and Video Separation Complete**

**📁 Input:** ${input}
**📁 Video Output:** ${video_output} (no audio)
**📁 Audio Output:** ${audio_output} (${audio_format.toUpperCase()})

**⚙️ Processing:**
- Video: Copied original video stream, removed audio
- Audio: Extracted to ${audio_format.toUpperCase()} format using ${audioCodec} codec

✅ **Success!** Audio and video tracks have been separated into individual files.

**Use Cases:**
- Create silent video for background use
- Extract audio for podcasts or music
- Separate tracks for individual editing
- Convert audio to different formats`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error separating audio and video: ${error instanceof Error ? error.message : String(error)}

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- Input file doesn't exist or is inaccessible
- Output directories don't exist or lack write permissions
- Input file has no audio stream (for audio extraction)
- Input file has no video stream (for video extraction)`
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
