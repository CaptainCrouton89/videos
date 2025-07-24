import { execSync } from "child_process";
import {
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
} from "fs";
import { resolve } from "path";
import { chromium } from "playwright";
import { z } from "zod";

export const recordHtmlVideoSchema = z.object({
  htmlFilePath: z.string().describe("Path to HTML file to record"),
  duration: z
    .number()
    .optional()
    .default(5)
    .describe("Duration in seconds to record (default: 5)"),
  outputPath: z
    .string()
    .optional()
    .describe("Output path for the video file (default: recording.mp4)"),
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
});

export async function recordHtmlVideo({
  htmlFilePath,
  duration = 5,
  outputPath,
  format = "mp4",
  aspectRatio = "16x9",
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
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      recordVideo: {
        dir: "./",
        size: { width, height },
      },
    });

    const page = await context.newPage();

    // Set viewport to calculated dimensions
    await page.setViewportSize({ width, height });

    // Navigate to the HTML file
    await page.goto(`file://${resolvedHtmlPath}`);

    // Wait for the specified duration
    await page.waitForTimeout(duration * 1000);

    // Close the page and context to finalize the video
    await page.close();
    await context.close();
    await browser.close();

    // Find the generated WebM file (Playwright generates WebM by default)
    const files = readdirSync("./").filter((f) => f.endsWith(".webm"));
    const latestWebM = files.sort((a, b) => {
      const statA = statSync(a);
      const statB = statSync(b);
      return statB.mtime.getTime() - statA.mtime.getTime();
    })[0];

    if (!latestWebM) {
      throw new Error("No WebM file found after recording");
    }

    // Convert to desired format if not WebM
    if (format !== "webm") {
      try {
        // Check if ffmpeg is available
        execSync("ffmpeg -version", { stdio: "ignore" });

        // Convert using ffmpeg
        const ffmpegCommand = `ffmpeg -i "${latestWebM}" -y "${finalOutputPath}"`;
        execSync(ffmpegCommand, { stdio: "ignore" });

        // Remove the original WebM file
        unlinkSync(latestWebM);
      } catch (error) {
        // If ffmpeg is not available, just rename the file
        console.error("FFmpeg not found, keeping WebM format");
        renameSync(latestWebM, finalOutputPath.replace(`.${format}`, ".webm"));
        throw new Error(
          "FFmpeg not found. Install FFmpeg to convert to other formats, or use WebM format."
        );
      }
    } else {
      // Just rename the WebM file to the desired output path
      renameSync(latestWebM, finalOutputPath);
    }

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
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set viewport size
    await page.setViewportSize({ width, height });

    if (htmlFilePath) {
      // Screenshot from file path
      const resolvedHtmlPath = resolve(htmlFilePath);

      // Check if file exists
      try {
        readFileSync(resolvedHtmlPath);
      } catch (error) {
        throw new Error(`HTML file not found: ${resolvedHtmlPath}`);
      }

      await page.goto(`file://${resolvedHtmlPath}`);
    } else {
      // Screenshot from HTML content
      await page.setContent(htmlContent!);
    }

    // Wait for page to load completely
    await page.waitForLoadState("networkidle");

    // Take screenshot
    await page.screenshot({
      path: finalOutputPath,
      type: format,
      fullPage: fullPage,
    });

    await browser.close();

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
