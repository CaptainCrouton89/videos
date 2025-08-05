import { GoogleGenerativeAI } from "@google/generative-ai";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

export const checkWatermarkSchema = z.object({
  image_path: z.string().describe("Absolute path to the image file to analyze"),
});

export async function checkWatermark({
  image_path,
}: z.infer<typeof checkWatermarkSchema>) {
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

    const prompt = `You are analyzing an image to detect watermarks. Please perform a thorough examination:

**WATERMARK DETECTION**: Carefully examine the ENTIRE image for any watermarks, including:
- Text watermarks (company names, photographer credits, stock photo text)
- Logo watermarks (transparent or semi-transparent logos)
- Pattern watermarks (repeating patterns or grids)
- Copyright marks or attribution text
- Any overlaid text that appears to be a watermark
- Check ALL corners and edges, as well as the center
- Look for subtle, semi-transparent overlays

Your response should be in one of these formats:

**Format 1 (Watermark Found):**
WATERMARK DETECTED: [Describe the type and location of watermark]
Location: [Specific location like "bottom right corner", "center", "top left", etc.]
Type: [Text/Logo/Pattern/Copyright]
Description: [Detailed description of the watermark]

**Format 2 (No Watermark):**
NO WATERMARK DETECTED: The image is clean and free of any watermarks.`;

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
          text: `**Watermark Check Analysis**\n\n**Image:** ${path.basename(image_path)}\n\n${analysisText}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error analyzing image for watermarks: ${
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