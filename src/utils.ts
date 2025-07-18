import { promises as fs } from "fs";
import path from "path";

export async function waitAndSaveVideo(
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

export function getQualityTier(modelKey: string): string {
  if (modelKey.includes("veo-3")) return "Premium";
  if (modelKey.includes("veo-2")) return "Premium";
  if (modelKey.includes("kling") && modelKey.includes("master")) return "Premium";
  if (modelKey.includes("hailuo-2")) return "High";
  if (modelKey.includes("hunyuan")) return "High";
  if (modelKey.includes("seedance-pro")) return "High";
  if (modelKey.includes("kling")) return "High";
  if (modelKey.includes("ray")) return "High";
  if (modelKey.includes("pixverse")) return "Medium";
  if (modelKey.includes("wan")) return "Medium";
  if (modelKey.includes("lite")) return "Medium";
  return "Standard";
}

export function getSpeedEstimate(modelKey: string): string {
  if (modelKey.includes("fast")) return "Very Fast";
  if (modelKey.includes("flash")) return "Very Fast";
  if (modelKey.includes("ltx")) return "Very Fast";
  if (modelKey.includes("lite")) return "Fast";
  if (modelKey.includes("wan") && modelKey.includes("480p")) return "Fast";
  if (modelKey.includes("mochi")) return "Slow";
  if (modelKey.includes("veo-3") && !modelKey.includes("fast")) return "Slow";
  if (modelKey.includes("hunyuan")) return "Slow";
  return "Medium";
}

export function getCostEstimate(modelKey: string, modelConfig: any): string {
  const quality = getQualityTier(modelKey);
  const hasAudio = modelConfig.hasAudio;
  const maxRes = Math.max(...modelConfig.resolutions.map((r: string) => parseInt(r.replace(/[^\d]/g, ''))));
  
  let baseCost = 1;
  if (quality === "Premium") baseCost = 4;
  else if (quality === "High") baseCost = 2.5;
  else if (quality === "Medium") baseCost = 1.5;
  
  if (hasAudio) baseCost *= 1.3;
  if (maxRes >= 1080) baseCost *= 1.5;
  if (maxRes >= 2160) baseCost *= 2; // 4K
  
  if (baseCost >= 4) return "Very High";
  if (baseCost >= 2.5) return "High";
  if (baseCost >= 1.5) return "Medium";
  return "Low";
}

export function getSupportedParameters(modelKey: string, config: any): string[] {
  const params = ["prompt", "duration"];
  
  if (config.type === "image-to-video" || config.type === "both") {
    params.push("image");
  }
  
  // Add model-specific parameters
  if (modelKey.includes("veo")) {
    params.push("aspect_ratio", "enhance_prompt", "generate_audio", "negative_prompt");
  }
  if (modelKey.includes("kling")) {
    params.push("motion_intensity", "resolution");
  }
  if (modelKey.includes("minimax-director")) {
    params.push("camera_movement");
  }
  if (modelKey.includes("wan")) {
    params.push("fps", "guidance_scale");
  }
  if (modelKey.includes("seedance")) {
    params.push("resolution");
  }
  
  params.push("seed", "negative_prompt");
  
  return params;
}