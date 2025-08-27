import { GoogleGenerativeAI } from "@google/generative-ai";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

export const checkAsset9by16Schema = z.object({
  image_path: z.string().describe("Absolute path to the image file to analyze"),
});

export async function checkAsset9by16({
  image_path,
}: z.infer<typeof checkAsset9by16Schema>) {
  try {
    // Validate input file exists
    await fs.access(image_path);

    // Check for Google API key
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is required");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Read the image file
    const imageBuffer = await fs.readFile(image_path);
    const imageBase64 = imageBuffer.toString("base64");

    // Determine mime type from file extension
    const ext = path.extname(image_path).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : 
                     ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
                     ext === ".webp" ? "image/webp" : "image/jpeg";

    const prompt = `You are analyzing an image that will be used for 9:16 vertical video content. Please perform the following analysis:

1. **WATERMARK CHECK**: First and most importantly, carefully examine the ENTIRE image for any watermarks, including:
   - Text watermarks (company names, photographer credits, stock photo text)
   - Logo watermarks (transparent or semi-transparent logos)
   - Pattern watermarks (repeating patterns or grids)
   - Copyright marks or attribution text
   - Any overlaid text that appears to be a watermark
   - Check ALL corners and edges, as well as the center
   - Look for subtle, semi-transparent overlays

2. **IF WATERMARK FOUND**: Stop the analysis and respond with:
   "REJECTED: Watermark detected - [describe location and type of watermark]. This image cannot be used."

3. **IF NO WATERMARK**: Analyze how to crop this image for 9:16 aspect ratio:
   - Identify the main subject(s) or focal point(s) of the image
   - Determine the current aspect ratio and dimensions
   - Provide specific cropping instructions that preserve the main subject(s)
   - If the main subject(s) cannot be preserved in 9:16 format, explain why

Your response should be in one of these formats:

**Format 1 (Watermark Found):**
REJECTED: Watermark detected - [specific description and location]. This image cannot be used.

**Format 2 (Can be cropped to 9:16):**
APPROVED: No watermarks detected.
CROPPING INSTRUCTIONS:
- Main subject: [describe what needs to be preserved]
- Recommended crop: [specific instructions like "crop from center, removing X pixels from left/right" or "focus on upper/lower portion"]
- Notes: [any additional considerations]

**Format 3 (Cannot be cropped to 9:16):**
REJECTED: No watermarks detected, but image cannot be cropped to 9:16 while preserving main subject(s).
Reason: [explain why - e.g., "horizontal panorama with subjects spread across entire width", "main subjects at opposite edges"]
Recommendation: Delete this image and find another suitable for vertical format.`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    const analysisText = result.response.text();

    return {
      content: [
        {
          type: "text" as const,
          text: `**9:16 Asset Check Analysis**\n\n**Image:** ${path.basename(image_path)}\n\n${analysisText}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error analyzing image for 9:16 compatibility: ${
            error instanceof Error ? error.message : String(error)
          }

**Common Issues:**
- Image file doesn't exist or is inaccessible
- GOOGLE_API_KEY environment variable not set
- Invalid image format (supported: PNG, JPG, JPEG, WebP)
- Network issues connecting to Google AI API`,
        },
      ],
    };
  }
}