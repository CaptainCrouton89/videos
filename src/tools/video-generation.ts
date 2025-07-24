import { z } from "zod";
import path from "path";
import { VIDEO_MODELS } from "../models.js";
import { waitAndSaveVideo } from "../utils.js";
import { uploadImageToSupabase, isLocalFilePath } from "../supabase.js";

export const generateVideoSchema = z.object({
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
      // Runway Gen Models (2025)
      "gen4-turbo",
    ])
    .describe("The video generation model to use"),
  prompt: z.union([
    z.string().describe("Single text prompt describing the video content"),
    z.array(z.string()).describe("Array of text prompts for parallel video generation")
  ]).describe("Text prompt(s) describing the video content"),
  image: z
    .string()
    .optional()
    .describe("Image URL or local file path for image-to-video models (local files will be automatically uploaded to Supabase)"),
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
  verbose: z.boolean().optional().default(false).describe("Enable verbose output mode (default: false)"),
});

export async function generateVideo({
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
  verbose = false,
}: z.infer<typeof generateVideoSchema>) {
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

    // Handle local image files - upload to Supabase if needed
    let processedImageUrl = image;
    if (image && isLocalFilePath(image)) {
      try {
        console.error(`Uploading local image file to Supabase: ${image}`);
        processedImageUrl = await uploadImageToSupabase(image);
        console.error(`Image uploaded successfully: ${processedImageUrl}`);
      } catch (error) {
        throw new Error(`Failed to upload local image file: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Handle both single prompt and array of prompts
    const prompts = Array.isArray(prompt) ? prompt : [prompt];
    const isMultiplePrompts = prompts.length > 1;

    // Function to build input parameters for a given prompt
    const buildInputParams = (currentPrompt: string, promptIndex: number) => {
      let input: any = {
        prompt: currentPrompt,
        ...modelConfig.defaultParams,
      };

      // Add common parameters
      if (duration) {
        input.duration = Math.min(duration, modelConfig.maxDuration);
      }
      if (seed) {
        // For multiple prompts, increment seed to ensure variety
        input.seed = isMultiplePrompts ? seed + promptIndex : seed;
      }
      if (negative_prompt) {
        input.negative_prompt = negative_prompt;
      }
      if (
        processedImageUrl &&
        (modelConfig.type === "image-to-video" || modelConfig.type === "both")
      ) {
        input.image = processedImageUrl;
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
          if (processedImageUrl) input.image = processedImageUrl;
          break;

        case "pyramid-flow":
          if (processedImageUrl) input.image = processedImageUrl;
          break;

        case "seedance-pro":
        case "seedance-lite":
          if (resolution && modelConfig.resolutions.includes(resolution))
            input.resolution = resolution;
          if (processedImageUrl) {
            input.mode = "image-to-video";
            input.image_url = processedImageUrl;
          }
          break;

        case "hailuo-2":
        case "minimax-video":
          if (resolution && modelConfig.resolutions.includes(resolution))
            input.resolution = resolution;
          if (processedImageUrl) input.image = processedImageUrl;
          break;

        case "minimax-director":
          if (resolution && modelConfig.resolutions.includes(resolution))
            input.resolution = resolution;
          if (camera_movement) input.camera_movement = camera_movement;
          if (processedImageUrl) input.image = processedImageUrl;
          break;

        case "kling-v2.1-master":
        case "kling-v1.6-pro":
          if (resolution && modelConfig.resolutions.includes(resolution))
            input.resolution = resolution;
          if (motion_intensity) input.motion_intensity = motion_intensity;
          if (processedImageUrl) input.image = processedImageUrl;
          break;

        case "ray-flash-2":
        case "ray-2":
        case "luma-ray":
          if (resolution && modelConfig.resolutions.includes(resolution))
            input.resolution = resolution;
          if (processedImageUrl) input.image = processedImageUrl;
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
          if (processedImageUrl) input.image = processedImageUrl;
          break;

        case "pixverse-v4.5":
          if (resolution && modelConfig.resolutions.includes(resolution))
            input.resolution = resolution;
          if (processedImageUrl) input.image = processedImageUrl;
          break;

        case "gen4-turbo":
          if (aspect_ratio) input.aspect_ratio = aspect_ratio;
          if (processedImageUrl) input.image = processedImageUrl;
          break;

        default:
          // Generic parameter mapping for other models
          if (resolution && modelConfig.resolutions.includes(resolution))
            input.resolution = resolution;
          if (fps) input.fps = fps;
          if (guidance_scale) input.guidance_scale = guidance_scale;
          if (processedImageUrl) input.image = processedImageUrl;
      }

      return input;
    };

    // Function to create a prediction for a single prompt
    const createPrediction = async (currentPrompt: string, promptIndex: number) => {
      const input = buildInputParams(currentPrompt, promptIndex);
      
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
          `Replicate API error for prompt ${promptIndex + 1}: ${error.detail || response.statusText}`
        );
      }

      const prediction = await response.json();
      return { prediction, prompt: currentPrompt, promptIndex, input };
    };

    // Create predictions for all prompts in parallel
    const predictionPromises = prompts.map((currentPrompt, index) => 
      createPrediction(currentPrompt, index)
    );

    const predictionResults = await Promise.all(predictionPromises);

    // Wait for all predictions to complete and save videos in parallel
    const videoPromises = predictionResults.map(async ({ prediction, prompt: currentPrompt, promptIndex, input }) => {
      if (prediction.id) {
        const savedFilePath = await waitAndSaveVideo(
          prediction.id,
          apiToken,
          save_path || "videos",
          model,
          currentPrompt
        );
        return { savedFilePath, prompt: currentPrompt, promptIndex, prediction, input };
      }
      return { savedFilePath: null, prompt: currentPrompt, promptIndex, prediction, input };
    });

    const videoResults = await Promise.all(videoPromises);

    // Build response message
    const features = [];
    if ((modelConfig as any).hasAudio) features.push("Audio Generation");
    if (modelConfig.type === "both")
      features.push("Text-to-Video & Image-to-Video");
    else if (modelConfig.type === "image-to-video")
      features.push("Image-to-Video");
    else features.push("Text-to-Video");

    const allSuccessful = videoResults.every(result => result.savedFilePath);
    const completedCount = videoResults.filter(result => result.savedFilePath).length;

    // Build individual video details
    const videoDetails = videoResults.map(({ savedFilePath, prompt: currentPrompt, promptIndex, prediction, input }) => {
      const paramDetails = [];
      paramDetails.push(`Prompt: ${currentPrompt}`);
      paramDetails.push(
        `Duration: ${input.duration || (modelConfig.defaultParams as any).duration || 5}s`
      );
      if (input.resolution)
        paramDetails.push(`Resolution: ${input.resolution}`);
      if (input.fps) paramDetails.push(`FPS: ${input.fps}`);
      if (input.aspect_ratio)
        paramDetails.push(`Aspect Ratio: ${input.aspect_ratio}`);
      if (input.generate_audio)
        paramDetails.push(`Audio Generation: ${input.generate_audio}`);
      if (input.camera_movement)
        paramDetails.push(`Camera Movement: ${input.camera_movement}`);
      if (input.motion_intensity)
        paramDetails.push(`Motion Intensity: ${input.motion_intensity}`);
      if (processedImageUrl) paramDetails.push(`Input Image: ${processedImageUrl}`);
      if (negative_prompt)
        paramDetails.push(`Negative Prompt: ${negative_prompt}`);
      if (input.seed) paramDetails.push(`Seed: ${input.seed}`);

      return {
        promptIndex: promptIndex + 1,
        prompt: currentPrompt,
        predictionId: prediction.id,
        status: prediction.status,
        savedFilePath,
        webUrl: prediction.urls?.web,
        paramDetails
      };
    });

    if (verbose) {
      return {
        content: [
          {
            type: "text" as const,
            text: `🎬 ${isMultiplePrompts ? 'Parallel ' : ''}Video Generation ${
              allSuccessful
                ? "Completed Successfully!"
                : completedCount > 0
                ? `Partially Complete! (${completedCount}/${prompts.length} videos saved)`
                : "Started Successfully!"
            }

📋 **Model Details:**
- Model: ${model} (${modelConfig.version})
- Features: ${features.join(", ")}
- ${isMultiplePrompts ? `Videos Generated: ${prompts.length}` : 'Single Video'}
- Max Duration: ${modelConfig.maxDuration}s
- Resolutions: ${modelConfig.resolutions.join(", ")}

${videoDetails.map(detail => `
📹 **Video ${detail.promptIndex}:**
- Prompt: "${detail.prompt}"
- Prediction ID: ${detail.predictionId}
- Status: ${detail.status}
${detail.savedFilePath ? `- ✅ Saved: ${path.basename(detail.savedFilePath)}` : detail.webUrl ? `- 🔗 Monitor: ${detail.webUrl}` : '- ❌ Failed'}

⚙️ **Parameters:**
${detail.paramDetails.map(p => `  - ${p}`).join('\n')}
`).join('\n')}

${allSuccessful ? 
  `✅ **All ${prompts.length} video${prompts.length > 1 ? 's' : ''} generated successfully!**` : 
  completedCount > 0 ? 
    `⚠️ **${completedCount} of ${prompts.length} videos completed successfully.**` :
    `📥 **Monitor Progress:**
${videoDetails.map(detail => detail.webUrl ? `- Video ${detail.promptIndex}: ${detail.webUrl}` : '').filter(Boolean).join('\n')}

Processing time varies by model complexity and queue load.`
}

${(modelConfig as any).hasAudio ? "🎵 This model includes audio generation!" : ""}
${
  modelConfig.type === "both"
    ? "🖼️ This model supports both text-to-video and image-to-video!"
    : ""
}`,
          },
        ],
      };
    } else {
      const successfulVideos = videoDetails.filter(detail => detail.savedFilePath);
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Video generation ${allSuccessful ? 'complete' : completedCount > 0 ? 'partially complete' : 'started'}. ${successfulVideos.length > 0 ? `Saved: ${successfulVideos.map(v => path.basename(v.savedFilePath!)).join(', ')}` : videoDetails.map(d => d.webUrl ? `Monitor: ${d.webUrl}` : '').filter(Boolean).join(', ')}`,
          },
        ],
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error generating video: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
    };
  }
}