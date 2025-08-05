import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";
import { z } from "zod";

const execAsync = promisify(exec);

// Wrapper to add timeout to exec calls
async function execWithTimeout(command: string, timeoutMs: number = 300000) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Command timed out after ${timeoutMs}ms: ${command}`));
    }, timeoutMs);

    execAsync(command)
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export const adjustVideoSpeedSchema = z.object({
  input: z.string().describe("Absolute path to the input video file"),
  speed_factor: z
    .number()
    .describe("Speed factor (0.5 = half speed, 2.0 = double speed)"),
  output: z.string().describe("Absolute path for the output video file"),
  verbose: z.boolean().optional().default(false).describe("Enable verbose output mode (default: false)"),
});

export async function adjustVideoSpeed({
  input,
  speed_factor,
  output,
  verbose = false,
}: z.infer<typeof adjustVideoSpeedSchema>) {
  try {
    // Validate input file exists
    await fs.access(input);

    // Ensure output directory exists
    await fs.mkdir(path.dirname(output), { recursive: true });

    // Calculate setpts value (inverse of speed factor)
    const setptsValue = 1 / speed_factor;

    // Build FFmpeg command
    const ffmpegCommand = `ffmpeg -y -i "${input}" -filter:v "setpts=${setptsValue}*PTS" -filter:a "atempo=${speed_factor}" -c:v libx264 -c:a aac "${output}"`;

    const { stdout, stderr } = await execWithTimeout(ffmpegCommand);

    if (verbose) {
      return {
        content: [
          {
            type: "text" as const,
            text: `⚡ **Video Speed Adjustment Complete**

**📁 Input:** ${input}
**📁 Output:** ${output}
**🎬 Speed Factor:** ${speed_factor}x (${
              speed_factor > 1 ? "faster" : speed_factor < 1 ? "slower" : "normal"
            })
**⚙️ Video Filter:** setpts=${setptsValue}*PTS
**🎵 Audio Filter:** atempo=${speed_factor}

✅ **Success!** Video speed has been adjusted and saved to the output file.`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Video speed adjustment complete (${speed_factor}x). Output: ${output}`,
          },
        ],
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error adjusting video speed: ${
            error instanceof Error ? error.message : String(error)
          }

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- Input file doesn't exist or is inaccessible
- Output directory doesn't exist or lacks write permissions
- Invalid speed factor (must be > 0)`,
        },
      ],
    };
  }
}

export const scaleVideoSchema = z.object({
  input: z.string().describe("Absolute path to the input video file"),
  width: z.number().describe("Target width in pixels"),
  height: z.number().describe("Target height in pixels"),
  output: z.string().describe("Absolute path for the output video file"),
  maintain_aspect: z
    .boolean()
    .optional()
    .describe("Maintain aspect ratio (default: false)"),
  verbose: z.boolean().optional().default(false).describe("Enable verbose output mode (default: false)"),
});

export async function scaleVideo({
  input,
  width,
  height,
  output,
  maintain_aspect = false,
  verbose = false,
}: z.infer<typeof scaleVideoSchema>) {
  try {
    // Validate input file exists
    await fs.access(input);

    // Ensure output directory exists
    await fs.mkdir(path.dirname(output), { recursive: true });

    // Build scale filter
    const scaleFilter = maintain_aspect
      ? `scale=${width}:${height}:force_original_aspect_ratio=decrease`
      : `scale=${width}:${height}`;

    // Build FFmpeg command
    const ffmpegCommand = `ffmpeg -y -i "${input}" -vf "${scaleFilter}" -c:v libx264 -c:a copy "${output}"`;

    const { stdout, stderr } = await execWithTimeout(ffmpegCommand);

    if (verbose) {
      return {
        content: [
          {
            type: "text" as const,
            text: `📏 **Video Scaling Complete**

**📁 Input:** ${input}
**📁 Output:** ${output}
**🎬 Target Resolution:** ${width}x${height}
**⚙️ Scale Filter:** ${scaleFilter}
**📐 Aspect Ratio:** ${
              maintain_aspect ? "Maintained" : "Forced to exact dimensions"
            }

✅ **Success!** Video has been resized and saved to the output file.`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Video scaling complete (${width}x${height}). Output: ${output}`,
          },
        ],
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error scaling video: ${
            error instanceof Error ? error.message : String(error)
          }

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- Input file doesn't exist or is inaccessible
- Output directory doesn't exist or lacks write permissions
- Invalid dimensions (must be > 0)`,
        },
      ],
    };
  }
}

export const applyVideoFiltersSchema = z.object({
  input: z.string().describe("Absolute path to the input video file"),
  filter_string: z
    .string()
    .describe("FFmpeg filter string (e.g., 'brightness=0.1,contrast=1.2')"),
  output: z.string().describe("Absolute path for the output video file"),
  copy_audio: z
    .boolean()
    .optional()
    .describe("Copy audio stream unchanged (default: true)"),
  verbose: z.boolean().optional().default(false).describe("Enable verbose output mode (default: false)"),
});

export async function applyVideoFilters({
  input,
  filter_string,
  output,
  copy_audio = true,
  verbose = false,
}: z.infer<typeof applyVideoFiltersSchema>) {
  try {
    // Validate input file exists
    await fs.access(input);

    // Ensure output directory exists
    await fs.mkdir(path.dirname(output), { recursive: true });

    // Build FFmpeg command
    const audioOption = copy_audio ? "-c:a copy" : "-an";
    const ffmpegCommand = `ffmpeg -y -i "${input}" -vf "${filter_string}" -c:v libx264 ${audioOption} "${output}"`;

    const { stdout, stderr } = await execWithTimeout(ffmpegCommand);

    if (verbose) {
      return {
        content: [
          {
            type: "text" as const,
            text: `🎨 **Video Filters Applied**

**📁 Input:** ${input}
**📁 Output:** ${output}
**⚙️ Filter String:** ${filter_string}
**🎵 Audio Processing:** ${
              copy_audio ? "Copied unchanged" : "Removed (no audio)"
            }

✅ **Success!** Video filters have been applied and saved to the output file.

**Example Filter Strings:**
- brightness=0.1,contrast=1.2 (adjust brightness and contrast)
- hue=s=0 (convert to grayscale)
- rotate=PI/4 (rotate 45 degrees)
- blur=5 (apply blur effect)
- sharpen=luma_msize_x=5:luma_msize_y=5 (sharpen image)`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Video filters applied (${filter_string}). Output: ${output}`,
          },
        ],
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    let specificHelp = "";
    if (errorMessage.includes("timed out")) {
      specificHelp = "\n**⏱️ Timeout Issue:** The FFmpeg command took longer than 5 minutes. This might indicate:\n- Very large video file\n- Complex filter processing\n- System resource constraints\n- Hanging due to audio stream issues";
    } else if (errorMessage.includes("audio") || errorMessage.includes("stream")) {
      specificHelp = "\n**🎵 Audio Stream Issue:** Try setting copy_audio to true or use a different filter approach for files with problematic audio streams.";
    } else if (errorMessage.includes("filter")) {
      specificHelp = "\n**⚙️ Filter Issue:** Check your filter syntax. For trim filters, use: trim=start=0:duration=10.5";
    }
    
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error applying video filters: ${errorMessage}${specificHelp}

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- Input file doesn't exist or is inaccessible
- Output directory doesn't exist or lacks write permissions
- Invalid filter string syntax
- Filter not supported by your FFmpeg version
- Timeout due to large files or complex processing`,
        },
      ],
    };
  }
}
