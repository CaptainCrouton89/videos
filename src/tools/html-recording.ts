import { execSync } from "child_process";
import {
  readFileSync,
  renameSync,
  unlinkSync,
} from "fs";
import { resolve } from "path";
import puppeteer from "puppeteer";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";
import { z } from "zod";

export const recordHtmlVideoSchema = z.object({
  htmlFilePath: z.string().describe("Path to HTML file to record"),
  duration: z.number().describe("Exact duration in seconds to record"),
  outputPath: z.string().describe("Output path for the video file"),
  format: z
    .enum(["mp4", "webm", "avi", "mov"])
    .optional()
    .default("mp4")
    .describe("Video format: mp4, webm, avi, or mov (default: mp4)"),
  aspectRatio: z
    .enum(["16x9", "9x16", "1x1"])
    .optional()
    .default("16x9")
    .describe(
      "Aspect ratio: 16x9 (landscape), 9x16 (portrait), or 1x1 (square) (default: 16x9)"
    ),
  verbose: z
    .boolean()
    .optional()
    .default(false)
    .describe("Enable verbose output mode (default: false)"),
});

export const takeScreenshotSchema = z.object({
  htmlFilePath: z
    .string()
    .optional()
    .describe("Path to the HTML file to screenshot"),
  htmlContent: z.string().optional().describe("HTML content to screenshot"),
  outputPath: z
    .string()
    .optional()
    .describe("Output path for the screenshot (default: screenshot.png)"),
  format: z
    .enum(["png", "jpeg"])
    .optional()
    .default("png")
    .describe("Screenshot format: png or jpeg (default: png)"),
  width: z
    .number()
    .optional()
    .default(1920)
    .describe("Screenshot width in pixels (default: 1920)"),
  height: z
    .number()
    .optional()
    .default(1080)
    .describe("Screenshot height in pixels (default: 1080)"),
  fullPage: z
    .boolean()
    .optional()
    .default(false)
    .describe("Take full page screenshot (default: false)"),
  verbose: z
    .boolean()
    .optional()
    .default(false)
    .describe("Enable verbose output mode (default: false)"),
});

export async function recordHtmlVideo({
  htmlFilePath,
  duration = 5,
  outputPath,
  format = "mp4",
  aspectRatio = "16x9",
  verbose = false,
}: z.infer<typeof recordHtmlVideoSchema>) {
  try {
    // Set default output path based on format if not provided
    const finalOutputPath = outputPath || `recording.${format}`;

    // Calculate dimensions based on aspect ratio - using 1080p quality
    let width: number, height: number;
    switch (aspectRatio) {
      case "16x9":
        width = 1920;
        height = 1080;
        break;
      case "9x16":
        width = 1080;
        height = 1920;
        break;
      case "1x1":
        width = 1080;
        height = 1080;
        break;
      default:
        width = 1920;
        height = 1080;
    }

    // Resolve the HTML file path
    const resolvedHtmlPath = resolve(htmlFilePath);

    // Check if file exists
    try {
      readFileSync(resolvedHtmlPath);
    } catch (error) {
      throw new Error(`HTML file not found: ${resolvedHtmlPath}`);
    }

    // Launch browser
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set viewport to calculated dimensions
    await page.setViewport({ width, height });

    // Navigate to the HTML file
    await page.goto(`file://${resolvedHtmlPath}`, { waitUntil: 'networkidle0' });

    // Create temp output path for the recording
    const tempOutputPath = `temp_recording_${Date.now()}.mp4`;

    // Set up the screen recorder
    const recorder = new PuppeteerScreenRecorder(page, {
      fps: 30,
      videoFrame: {
        width,
        height,
      },
      aspectRatio: aspectRatio.replace('x', ':'),
    });

    // Start recording
    await recorder.start(tempOutputPath);

    // Wait for the specified duration
    await new Promise(resolve => setTimeout(resolve, duration * 1000));

    // Stop recording
    await recorder.stop();

    // Close the browser
    await browser.close();

    // Convert to desired format if not MP4
    if (format !== "mp4") {
      try {
        // Check if ffmpeg is available
        execSync("ffmpeg -version", { stdio: "ignore" });

        // Convert using ffmpeg
        const ffmpegCommand = `ffmpeg -i "${tempOutputPath}" -y "${finalOutputPath}"`;
        execSync(ffmpegCommand, { stdio: "ignore" });

        // Remove the temp file
        unlinkSync(tempOutputPath);
      } catch (error) {
        // If ffmpeg is not available, just rename the file
        console.error("FFmpeg not found, keeping MP4 format");
        renameSync(tempOutputPath, finalOutputPath.replace(`.${format}`, ".mp4"));
        throw new Error(
          "FFmpeg not found. Install FFmpeg to convert to other formats, or use MP4 format."
        );
      }
    } else {
      // Just rename the MP4 file to the desired output path
      renameSync(tempOutputPath, finalOutputPath);
    }

    if (verbose) {
      const response = `Video recording completed successfully:
- HTML file: ${resolvedHtmlPath}
- Duration: ${duration} seconds
- Output: ${finalOutputPath}
- Format: ${format.toUpperCase()}
- Aspect Ratio: ${aspectRatio}
- Dimensions: ${width}x${height} (headless)

The video has been saved to the current directory.`;

      return {
        content: [
          {
            type: "text" as const,
            text: response,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ HTML video recording complete. Output: ${finalOutputPath}`,
          },
        ],
      };
    }
  } catch (error) {
    const errorMessage = `Error recording HTML video: ${
      error instanceof Error ? error.message : String(error)
    }`;

    return {
      content: [
        {
          type: "text" as const,
          text: errorMessage,
        },
      ],
    };
  }
}

export async function takeScreenshot({
  htmlFilePath,
  htmlContent,
  outputPath,
  format = "png",
  width = 1920,
  height = 1080,
  fullPage = false,
  verbose = false,
}: z.infer<typeof takeScreenshotSchema>) {
  try {
    // Validate that either htmlFilePath or htmlContent is provided
    if (!htmlFilePath && !htmlContent) {
      throw new Error("Either htmlFilePath or htmlContent must be provided");
    }

    if (htmlFilePath && htmlContent) {
      throw new Error("Provide either htmlFilePath or htmlContent, not both");
    }

    // Set default output path based on format if not provided
    const finalOutputPath = outputPath || `screenshot.${format}`;

    // Launch browser
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set viewport size
    await page.setViewport({ width, height });

    if (htmlFilePath) {
      // Screenshot from file path
      const resolvedHtmlPath = resolve(htmlFilePath);

      // Check if file exists
      try {
        readFileSync(resolvedHtmlPath);
      } catch (error) {
        throw new Error(`HTML file not found: ${resolvedHtmlPath}`);
      }

      await page.goto(`file://${resolvedHtmlPath}`, { waitUntil: 'networkidle0' });
    } else {
      // Screenshot from HTML content
      await page.setContent(htmlContent!);
    }

    // Wait for page to load completely
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Take screenshot
    await page.screenshot({
      path: finalOutputPath as `${string}.png` | `${string}.jpeg`,
      type: format as 'png' | 'jpeg',
      fullPage: fullPage,
    });

    await browser.close();

    if (verbose) {
      const response = `Screenshot taken successfully:
- Source: ${htmlFilePath ? `File: ${htmlFilePath}` : "HTML Content"}
- Output: ${finalOutputPath}
- Format: ${format.toUpperCase()}
- Dimensions: ${width}x${height}
- Full Page: ${fullPage ? "Yes" : "No"}

The screenshot has been saved to ${finalOutputPath}.`;

      return {
        content: [
          {
            type: "text" as const,
            text: response,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Screenshot complete. Output: ${finalOutputPath}`,
          },
        ],
      };
    }
  } catch (error) {
    const errorMessage = `Error taking screenshot: ${
      error instanceof Error ? error.message : String(error)
    }`;

    return {
      content: [
        {
          type: "text" as const,
          text: errorMessage,
        },
      ],
    };
  }
}
