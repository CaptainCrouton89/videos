import { z } from "zod";
import { VIDEO_MODELS } from "../models.js";
import {
  getCostEstimate,
  getQualityTier,
  getSpeedEstimate,
  getSupportedParameters,
} from "../utils.js";

export const getModelsSchema = z.object({
  model_filter: z
    .string()
    .optional()
    .describe("Filter models by name (partial match, case-insensitive)"),
  type_filter: z
    .enum(["text-to-video", "image-to-video", "both"])
    .optional()
    .describe("Filter by model type"),
  resolution_filter: z
    .enum(["480p", "540p", "720p", "768p", "1080p", "1280p", "4K"])
    .optional()
    .describe("Filter by supported resolution"),
  has_audio: z
    .boolean()
    .optional()
    .describe("Filter models that support audio generation"),
  sort_by: z
    .enum(["name", "max_duration", "quality", "speed"])
    .optional()
    .describe("Sort models by criteria (default: name)"),
});

export async function getModels({
  model_filter,
  type_filter,
  resolution_filter,
  has_audio,
  sort_by = "name",
}: z.infer<typeof getModelsSchema>) {
  try {
    // Get all models with enhanced information
    const modelEntries = Object.entries(VIDEO_MODELS).map(([key, config]) => {
      return {
        id: key,
        name: key,
        version: config.version,
        type: config.type,
        maxDuration: config.maxDuration,
        resolutions: config.resolutions,
        hasAudio: config.hasAudio || false,
        defaultParams: config.defaultParams,
        qualityTier: getQualityTier(key),
        speedEstimate: getSpeedEstimate(key),
        costEstimate: getCostEstimate(key, config),
        supportedParams: getSupportedParameters(key, config),
        company: config.version.split("/")[0],
        features: [
          config.type === "both"
            ? "Text-to-Video & Image-to-Video"
            : config.type === "image-to-video"
            ? "Image-to-Video"
            : "Text-to-Video",
          ...(config.hasAudio ? ["Audio Generation"] : []),
          ...(config.maxDuration >= 10 ? ["Long Duration"] : []),
          ...(config.resolutions.includes("1080p") ||
          config.resolutions.includes("4K")
            ? ["High Resolution"]
            : []),
        ],
      };
    });

    // Apply filters
    let filteredModels = modelEntries;

    if (model_filter) {
      filteredModels = filteredModels.filter((model) =>
        model.name.toLowerCase().includes(model_filter.toLowerCase())
      );
    }

    if (type_filter) {
      filteredModels = filteredModels.filter(
        (model) => model.type === type_filter
      );
    }

    if (resolution_filter) {
      filteredModels = filteredModels.filter((model) =>
        model.resolutions.includes(resolution_filter)
      );
    }

    if (has_audio !== undefined) {
      filteredModels = filteredModels.filter(
        (model) => model.hasAudio === has_audio
      );
    }

    // Sort models
    filteredModels.sort((a, b) => {
      switch (sort_by) {
        case "max_duration":
          return b.maxDuration - a.maxDuration;
        case "quality":
          const qualityOrder = { Premium: 4, High: 3, Medium: 2, Standard: 1 };
          return (
            qualityOrder[b.qualityTier as keyof typeof qualityOrder] -
            qualityOrder[a.qualityTier as keyof typeof qualityOrder]
          );
        case "speed":
          const speedOrder = { "Very Fast": 4, Fast: 3, Medium: 2, Slow: 1 };
          return (
            speedOrder[b.speedEstimate as keyof typeof speedOrder] -
            speedOrder[a.speedEstimate as keyof typeof speedOrder]
          );
        default:
          return a.name.localeCompare(b.name);
      }
    });

    // Group models by company
    const companyCounts = filteredModels.reduce((acc, model) => {
      acc[model.company] = (acc[model.company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Build summary statistics
    const stats = {
      total: filteredModels.length,
      byType: {
        textToVideo: filteredModels.filter((m) => m.type === "text-to-video")
          .length,
        imageToVideo: filteredModels.filter((m) => m.type === "image-to-video")
          .length,
        both: filteredModels.filter((m) => m.type === "both").length,
      },
      byQuality: {
        premium: filteredModels.filter((m) => m.qualityTier === "Premium")
          .length,
        high: filteredModels.filter((m) => m.qualityTier === "High").length,
        medium: filteredModels.filter((m) => m.qualityTier === "Medium").length,
        standard: filteredModels.filter((m) => m.qualityTier === "Standard")
          .length,
      },
      withAudio: filteredModels.filter((m) => m.hasAudio).length,
      companies: Object.keys(companyCounts).length,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: `🎬 **Video Generation Models Database**

📊 **Summary Statistics:**
- Total Models: ${stats.total}
- Companies: ${stats.companies} (${Object.entries(companyCounts)
            .map(([company, count]) => `${company}: ${count}`)
            .join(", ")})
- With Audio: ${stats.withAudio}
- Quality Distribution: Premium (${stats.byQuality.premium}), High (${
            stats.byQuality.high
          }), Medium (${stats.byQuality.medium}), Standard (${
            stats.byQuality.standard
          })
- Type Distribution: Text-to-Video (${
            stats.byType.textToVideo
          }), Image-to-Video (${stats.byType.imageToVideo}), Both (${
            stats.byType.both
          })

${
  filteredModels.length === 0
    ? "❌ No models match your filters."
    : `📋 **Model Details:**

${filteredModels
  .map(
    (model) => `
**${model.name}** (${model.company})
- Version: ${model.version}
- Type: ${model.type}
- Quality: ${model.qualityTier} | Speed: ${model.speedEstimate} | Cost: ${
      model.costEstimate
    }
- Max Duration: ${model.maxDuration}s
- Resolutions: ${model.resolutions.join(", ")}
- Audio: ${model.hasAudio ? "Yes" : "No"}
- Features: ${model.features.join(", ")}
- Parameters: ${model.supportedParams.join(", ")}
- Default Settings: ${Object.entries(model.defaultParams)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ")}
`
  )
  .join("\n")}

🎯 **Quality Tiers:**
- **Premium**: Latest flagship models with best quality and features
- **High**: Excellent quality with good feature support
- **Medium**: Good quality for most use cases
- **Standard**: Basic quality, suitable for testing

⚡ **Speed Estimates:**
- **Very Fast**: < 30 seconds for 5s video
- **Fast**: 30-60 seconds for 5s video  
- **Medium**: 1-3 minutes for 5s video
- **Slow**: 3+ minutes for 5s video

💰 **Cost Estimates:**
- **Very High**: Premium models with audio/4K
- **High**: Premium models or high-res generation
- **Medium**: Standard models with good features
- **Low**: Basic models or lower resolutions

🔧 **Common Parameters:**
- **prompt**: Text description (required)
- **duration**: Video length in seconds
- **image**: Input image for image-to-video models
- **resolution**: Output resolution (480p, 720p, 1080p, 4K)
- **fps**: Frames per second
- **aspect_ratio**: Video aspect ratio (16:9, 9:16, 1:1)
- **guidance_scale**: Generation quality control
- **seed**: Random seed for reproducibility
- **negative_prompt**: What to avoid in generation`
}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error retrieving model information: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
    };
  }
}
