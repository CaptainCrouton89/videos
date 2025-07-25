import { GoogleGenerativeAI } from "@google/generative-ai";
import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";
import { z } from "zod";

const execAsync = promisify(exec);

export const getHtmlVideoFeedbackSchema = z.object({
  video_file: z.string().describe("Absolute path to the input video file"),
  mode: z
    .enum(["normal", "advanced"])
    .describe("Analysis mode: normal (first and last frames) or advanced (every 1 second)"),
  description: z
    .string()
    .describe("Description of what the video is supposed to depict"),
});

export async function getHtmlVideoFeedback({
  video_file,
  mode,
  description,
}: z.infer<typeof getHtmlVideoFeedbackSchema>) {
  try {
    // Validate input file exists
    await fs.access(video_file);

    // Check for Google API key
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is required");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Create temporary directory for frames
    const tempDir = path.join(process.cwd(), "temp_frames");
    await fs.mkdir(tempDir, { recursive: true });

    // Get video duration first
    const durationCommand = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${video_file}"`;
    const { stdout: durationStr } = await execAsync(durationCommand);
    const duration = parseFloat(durationStr.trim());

    const results = [];

    try {
      if (mode === "normal") {
        // Extract first frame (0.5s) and last frame
        const timestamps = [0.5, duration - 0.1];
        const frameNames = ["first", "last"];
        
        for (let i = 0; i < timestamps.length; i++) {
          const timestamp = timestamps[i];
          const frameName = frameNames[i];
          const framePath = path.join(tempDir, `${frameName}_frame.jpg`);
          
          const frameCommand = `ffmpeg -i "${video_file}" -ss ${timestamp} -vframes 1 -y "${framePath}"`;
          await execAsync(frameCommand);

          const frameBuffer = await fs.readFile(framePath);
          const frameBase64 = frameBuffer.toString("base64");

          const prompt = frameName === "first" 
            ? `You are analyzing a screenshot from an AI-generated video. This is the FIRST frame of the video (taken at 0.5 seconds), showing the initial state of the web page.

**Video Description:** ${description}

Please provide critical feedback on this web page focusing on:
1. **Spacing & Layout**: Are elements properly spaced? Is the layout clean and organized?
2. **Visual Hierarchy**: Is the information hierarchy clear? Are headings, subheadings, and body text properly differentiated?
3. **Comprehensibility**: Is the content easy to understand and navigate? Are UI elements intuitive?
4. **First Impression**: Since this is the opening frame, how effective is it at immediately communicating the page's purpose?
5. **Visual Polish**: Are there any obvious visual issues, misalignments, or rough edges?
6. **Alignment with Intent**: How well does this initial frame align with the intended video description above?

Remember: This web page was AI-generated, so be specific about what works well and what could be improved. Focus on actionable feedback that would help improve the web page design.`
            : `You are analyzing a screenshot from an AI-generated web page video. This is the FINAL frame of the video, showing the completed/final state of the web page after any animations or transitions.

**Video Description:** ${description}

Please provide critical feedback on this web page focusing on:
1. **Final Layout Quality**: How does the completed layout look? Are all elements properly positioned?
2. **Content Completeness**: Does the final state appear complete and polished? Are there any missing elements or cut-off content?
3. **Visual Coherence**: Does the final design feel cohesive and professional?
4. **User Experience**: From a final state perspective, how usable and intuitive does this web page appear?
5. **Overall Polish**: What are the strengths and weaknesses of the final rendered page?
6. **Goal Achievement**: How well does this final result achieve the intended video description above?

Remember: This web page was AI-generated, and this represents the final result after any animations or loading sequences. Be specific about what works well and what could be improved in the final output.`;

          const analysis = model.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: frameBase64,
                    },
                  },
                  { text: prompt },
                ],
              },
            ],
          });

          results.push({
            frame: frameName,
            timestamp: `${timestamp.toFixed(1)}s`,
            analysis: analysis,
          });
        }
      } else if (mode === "advanced") {
        // Extract frames every 1 second
        const timestamps = [];
        for (let t = 0.5; t < duration; t += 1) {
          timestamps.push(Math.min(t, duration - 0.1));
        }
        
        for (let i = 0; i < timestamps.length; i++) {
          const timestamp = timestamps[i];
          const framePath = path.join(tempDir, `frame_${i + 1}.jpg`);
          
          const frameCommand = `ffmpeg -i "${video_file}" -ss ${timestamp} -vframes 1 -y "${framePath}"`;
          await execAsync(frameCommand);

          const frameBuffer = await fs.readFile(framePath);
          const frameBase64 = frameBuffer.toString("base64");

          const prompt = `You are analyzing a screenshot from an AI-generated web page video. This is frame ${i + 1} of ${timestamps.length}, taken at ${timestamp.toFixed(1)} seconds into the video.

**Video Description:** ${description}

Please provide critical feedback on this web page state focusing on:
1. **Current State Analysis**: What is happening at this point in the video? Are animations/transitions working properly?
2. **Layout Quality**: How does the layout look at this moment? Are elements properly positioned?
3. **Visual Progress**: How does this frame compare to what you'd expect at this point in the video timeline?
4. **Content Readability**: Is the content clear and readable at this state?
5. **Design Consistency**: Does this frame maintain visual consistency with the overall design intent?
6. **Progression Assessment**: How well is this frame contributing to achieving the intended video description?

Remember: This web page was AI-generated. Focus on actionable feedback about this specific moment in the video timeline.`;

          const analysis = model.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: frameBase64,
                    },
                  },
                  { text: prompt },
                ],
              },
            ],
          });

          results.push({
            frame: `frame_${i + 1}`,
            timestamp: `${timestamp.toFixed(1)}s`,
            analysis: analysis,
          });
        }
      }

      // Execute all analyses in parallel
      const analyses = await Promise.all(
        results.map(async (result) => ({
          ...result,
          analysis: await result.analysis,
        }))
      );

      // Format the response
      let responseText = `**HTML Video Feedback Analysis**\n\n`;
      responseText += `**Video:** ${path.basename(video_file)}\n`;
      responseText += `**Analysis Mode:** ${mode}\n`;
      responseText += `**Video Description:** ${description}\n\n`;

      for (const analysis of analyses) {
        responseText += `## ${analysis.frame.toUpperCase()} FRAME (${
          analysis.timestamp
        })\n\n`;
        responseText += `${analysis.analysis.response.text()}\n\n`;
        responseText += `---\n\n`;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: responseText,
          },
        ],
      };
    } finally {
      // Clean up temporary files
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn("Failed to clean up temporary files:", cleanupError);
      }
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error analyzing video for HTML feedback: ${
            error instanceof Error ? error.message : String(error)
          }

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- Video file doesn't exist or is inaccessible
- GOOGLE_API_KEY environment variable not set
- Invalid video format or corrupted file
- Network issues connecting to Google AI API`,
        },
      ],
    };
  }
}
