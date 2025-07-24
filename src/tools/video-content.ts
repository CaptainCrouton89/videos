import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";
import { z } from "zod";

const execAsync = promisify(exec);

export const getContentSchema = z.object({
  input: z.string().describe("Absolute path to the input video file"),
  output_directory: z.string().describe("Absolute path to the output directory for screenshots"),
  interval: z
    .number()
    .optional()
    .default(0.5)
    .describe("Time interval between screenshots in seconds (default: 0.5)"),
  resolution: z
    .string()
    .optional()
    .default("720p")
    .describe("Resolution of screenshots (default: 720p). Format: WIDTHxHEIGHT or 720p/1080p/480p"),
  verbose: z.boolean().optional().default(false).describe("Enable verbose output mode (default: false)"),
});

export async function getContent({
  input,
  output_directory,
  interval = 0.5,
  resolution = "720p",
  verbose = false,
}: z.infer<typeof getContentSchema>) {
  try {
    // Validate input file exists
    await fs.access(input);

    // Ensure output directory exists
    await fs.mkdir(output_directory, { recursive: true });

    // Convert resolution shortcuts to actual dimensions
    let scaleFilter = "";
    if (resolution === "720p") {
      scaleFilter = "scale=1280:720";
    } else if (resolution === "1080p") {
      scaleFilter = "scale=1920:1080";
    } else if (resolution === "480p") {
      scaleFilter = "scale=854:480";
    } else if (resolution.includes("x")) {
      // Custom resolution format WIDTHxHEIGHT
      scaleFilter = `scale=${resolution.replace("x", ":")}`;
    } else {
      // Default to 720p if format is unrecognized
      scaleFilter = "scale=1280:720";
    }

    // Build FFmpeg command to extract screenshots at intervals
    const outputPattern = path.join(output_directory, "screenshot_%06d.png");
    const ffmpegCommand = `ffmpeg -i "${input}" -vf "fps=1/${interval},${scaleFilter}" "${outputPattern}"`;

    const { stdout, stderr } = await execAsync(ffmpegCommand);

    // Count the number of screenshots created
    const files = await fs.readdir(output_directory);
    const screenshotFiles = files.filter(file => file.startsWith("screenshot_") && file.endsWith(".png"));
    const screenshotCount = screenshotFiles.length;

    if (verbose) {
      return {
        content: [
          {
            type: "text" as const,
            text: `📸 **Video Content Extraction Complete**

**📁 Video Input:** ${input}
**📁 Screenshots Directory:** ${output_directory}
**⏱️ Interval:** ${interval} seconds
**📏 Resolution:** ${resolution}
**🖼️ Screenshots Created:** ${screenshotCount}

✅ **Success!** Screenshots have been extracted and saved to: **${output_directory}**

**Instructions:** Read the images in the directory to evaluate the content of the video`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Video content extraction complete. ${screenshotCount} screenshots saved to: ${output_directory}`,
          },
        ],
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error extracting video content: ${
            error instanceof Error ? error.message : String(error)
          }

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- Input video file doesn't exist or is inaccessible
- Output directory doesn't exist or lacks write permissions
- Invalid interval value (must be > 0)
- Invalid resolution format (use WIDTHxHEIGHT or 720p/1080p/480p)`,
        },
      ],
    };
  }
}