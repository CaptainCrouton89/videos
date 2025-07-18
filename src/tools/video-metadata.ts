import { z } from "zod";
import { promises as fs } from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const getVideoMetadataSchema = z.object({
  file_path: z.string().describe("Absolute path to the video file"),
});

export async function getVideoMetadata({
  file_path,
}: z.infer<typeof getVideoMetadataSchema>) {
  try {
    // Check if file exists
    await fs.access(file_path);
    
    // Execute FFprobe command to get comprehensive metadata
    const ffprobeCommand = `ffprobe -v quiet -print_format json -show_format -show_streams "${file_path}"`;
    const { stdout, stderr } = await execAsync(ffprobeCommand);
    
    if (stderr) {
      throw new Error(`FFprobe error: ${stderr}`);
    }

    const metadata = JSON.parse(stdout);
    
    // Extract video stream information
    const videoStream = metadata.streams.find((stream: any) => stream.codec_type === 'video');
    const audioStream = metadata.streams.find((stream: any) => stream.codec_type === 'audio');
    const format = metadata.format;

    if (!videoStream) {
      throw new Error("No video stream found in the file");
    }

    // Calculate precise duration
    const duration = parseFloat(format.duration || videoStream.duration || '0');
    
    // Extract video properties
    const width = parseInt(videoStream.width || '0');
    const height = parseInt(videoStream.height || '0');
    const aspectRatio = width && height ? `${width}:${height}` : 'unknown';
    const fps = videoStream.r_frame_rate ? eval(videoStream.r_frame_rate) : 'unknown';
    const videoCodec = videoStream.codec_name || 'unknown';
    const videoBitrate = videoStream.bit_rate ? parseInt(videoStream.bit_rate) : null;
    
    // Determine orientation
    const orientation = width > height ? 'landscape' : height > width ? 'portrait' : 'square';
    
    // Extract audio properties if available
    let audioProperties = null;
    if (audioStream) {
      audioProperties = {
        codec: audioStream.codec_name || 'unknown',
        sample_rate: audioStream.sample_rate ? parseInt(audioStream.sample_rate) : null,
        channels: audioStream.channels || null,
        bitrate: audioStream.bit_rate ? parseInt(audioStream.bit_rate) : null,
        channel_layout: audioStream.channel_layout || 'unknown'
      };
    }

    // Format file size
    const fileSizeBytes = parseInt(format.size || '0');
    const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

    return {
      content: [
        {
          type: "text" as const,
          text: `📹 **Video Metadata Analysis**

**📁 File Information:**
- Path: ${file_path}
- Size: ${fileSizeMB} MB (${fileSizeBytes.toLocaleString()} bytes)
- Duration: ${duration.toFixed(3)} seconds (${Math.floor(duration / 60)}:${(duration % 60).toFixed(3).padStart(6, '0')})

**🎬 Video Properties:**
- Resolution: ${width}x${height}
- Aspect Ratio: ${aspectRatio}
- Orientation: ${orientation}
- FPS: ${typeof fps === 'number' ? fps.toFixed(2) : fps}
- Codec: ${videoCodec}
${videoBitrate ? `- Video Bitrate: ${(videoBitrate / 1000).toFixed(0)} kbps` : ''}

${audioProperties ? `**🎵 Audio Properties:**
- Codec: ${audioProperties.codec}
- Sample Rate: ${audioProperties.sample_rate ? `${audioProperties.sample_rate} Hz` : 'unknown'}
- Channels: ${audioProperties.channels || 'unknown'}
- Channel Layout: ${audioProperties.channel_layout}
${audioProperties.bitrate ? `- Audio Bitrate: ${(audioProperties.bitrate / 1000).toFixed(0)} kbps` : ''}` : '**🔇 Audio:** No audio stream detected'}

**📊 Format Information:**
- Container: ${format.format_name || 'unknown'}
- Container Long Name: ${format.format_long_name || 'unknown'}
${format.bit_rate ? `- Overall Bitrate: ${(parseInt(format.bit_rate) / 1000).toFixed(0)} kbps` : ''}

**🎯 Quick Stats:**
- Is Landscape: ${orientation === 'landscape' ? 'Yes' : 'No'}
- Is Portrait: ${orientation === 'portrait' ? 'Yes' : 'No'}
- Has Audio: ${audioProperties ? 'Yes' : 'No'}
- Video Stream Count: ${metadata.streams.filter((s: any) => s.codec_type === 'video').length}
- Audio Stream Count: ${metadata.streams.filter((s: any) => s.codec_type === 'audio').length}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error analyzing video metadata: ${error instanceof Error ? error.message : String(error)}

**Common Issues:**
- FFprobe not installed (install via: brew install ffmpeg)
- File path doesn't exist or is inaccessible
- File is not a valid video format
- Insufficient permissions to read the file`
        }
      ]
    };
  }
}