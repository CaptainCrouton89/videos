import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const separateAudioAndVideoSchema = z.object({
  input: z.string().describe("Absolute path to the input video file"),
  video_output: z.string().describe("Absolute path for the pure video output file (no audio)"),
  audio_output: z.string().describe("Absolute path for the pure audio output file"),
  audio_format: z.enum(['mp3', 'wav', 'aac', 'flac']).optional().describe("Audio format (default: mp3)"),
});

export async function separateAudioAndVideo({
  input,
  video_output,
  audio_output,
  audio_format = 'mp3',
}: z.infer<typeof separateAudioAndVideoSchema>) {
  try {
    // Validate input file exists
    await fs.access(input);
    
    // Ensure output directories exist
    await fs.mkdir(path.dirname(video_output), { recursive: true });
    await fs.mkdir(path.dirname(audio_output), { recursive: true });
    
    // Extract video without audio
    const videoCommand = `ffmpeg -i "${input}" -c:v copy -an "${video_output}"`;
    
    // Extract audio without video
    const audioCodec = audio_format === 'mp3' ? 'mp3' : audio_format === 'wav' ? 'pcm_s16le' : audio_format === 'aac' ? 'aac' : 'flac';
    const audioCommand = `ffmpeg -i "${input}" -vn -c:a ${audioCodec} "${audio_output}"`;
    
    // Execute both commands
    await Promise.all([
      execAsync(videoCommand),
      execAsync(audioCommand)
    ]);
    
    return {
      content: [
        {
          type: "text" as const,
          text: `🎬🎵 **Audio and Video Separation Complete**

**📁 Input:** ${input}
**📁 Video Output:** ${video_output} (no audio)
**📁 Audio Output:** ${audio_output} (${audio_format.toUpperCase()})

**⚙️ Processing:**
- Video: Copied original video stream, removed audio
- Audio: Extracted to ${audio_format.toUpperCase()} format using ${audioCodec} codec

✅ **Success!** Audio and video tracks have been separated into individual files.

**Use Cases:**
- Create silent video for background use
- Extract audio for podcasts or music
- Separate tracks for individual editing
- Convert audio to different formats`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error separating audio and video: ${error instanceof Error ? error.message : String(error)}

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- Input file doesn't exist or is inaccessible
- Output directories don't exist or lack write permissions
- Input file has no audio stream (for audio extraction)
- Input file has no video stream (for video extraction)`
        }
      ]
    };
  }
}

export const mergeAudioAndVideoSchema = z.object({
  video_input: z.string().describe("Absolute path to the input video file"),
  audio_input: z.string().describe("Absolute path to the input audio file"),
  output: z.string().describe("Absolute path for the merged output video file"),
  replace_audio: z.boolean().optional().describe("Replace existing audio in video (default: true)"),
  trim_to_match: z.enum(['video', 'audio', 'none']).optional().describe("Trim to match duration: 'video' (trim audio to video length), 'audio' (trim video to audio length), 'none' (no trimming, default)"),
});

export async function mergeAudioAndVideo({
  video_input,
  audio_input,
  output,
  replace_audio = true,
  trim_to_match = 'none',
}: z.infer<typeof mergeAudioAndVideoSchema>) {
  try {
    // Validate input files exist
    await fs.access(video_input);
    await fs.access(audio_input);
    
    // Ensure output directory exists
    await fs.mkdir(path.dirname(output), { recursive: true });
    
    // Get duration of both files if trimming is needed
    let videoDuration = 0;
    let audioDuration = 0;
    
    if (trim_to_match !== 'none') {
      // Get video duration
      const videoProbeCommand = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${video_input}"`;
      const { stdout: videoStdout } = await execAsync(videoProbeCommand);
      videoDuration = parseFloat(videoStdout.trim());
      
      // Get audio duration
      const audioProbeCommand = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audio_input}"`;
      const { stdout: audioStdout } = await execAsync(audioProbeCommand);
      audioDuration = parseFloat(audioStdout.trim());
    }
    
    // Build FFmpeg command based on options
    let ffmpegCommand = `ffmpeg -i "${video_input}" -i "${audio_input}"`;
    
    // Add trimming options if specified
    if (trim_to_match === 'video') {
      // Trim audio to match video duration
      ffmpegCommand += ` -t ${videoDuration}`;
    } else if (trim_to_match === 'audio') {
      // Trim video to match audio duration
      ffmpegCommand += ` -t ${audioDuration}`;
    }
    
    // Add stream mapping and encoding options
    if (replace_audio) {
      // Replace existing audio with new audio
      ffmpegCommand += ` -c:v copy -c:a aac -map 0:v:0 -map 1:a:0`;
    } else {
      // Mix new audio with existing audio
      ffmpegCommand += ` -filter_complex "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=3" -c:v copy -c:a aac`;
    }
    
    ffmpegCommand += ` "${output}"`;
    
    await execAsync(ffmpegCommand);
    
    // Build summary information
    const processingMethod = replace_audio ? 'Replaced existing audio' : 'Mixed new audio with existing audio';
    const durationInfo = trim_to_match === 'video' ? `Trimmed to video duration: ${videoDuration.toFixed(2)}s` :
                         trim_to_match === 'audio' ? `Trimmed to audio duration: ${audioDuration.toFixed(2)}s` :
                         'No duration trimming applied';
    
    return {
      content: [
        {
          type: "text" as const,
          text: `🎬🎵 **Audio and Video Merge Complete**

**📁 Video Input:** ${video_input}
**📁 Audio Input:** ${audio_input}
**📁 Output:** ${output}

**⚙️ Processing:**
- Audio Handling: ${processingMethod}
- Duration Handling: ${durationInfo}
- Video Codec: Copy (no re-encoding)
- Audio Codec: AAC

${trim_to_match !== 'none' ? `**📏 Duration Information:**
- Video Duration: ${videoDuration.toFixed(2)}s
- Audio Duration: ${audioDuration.toFixed(2)}s
- Final Duration: ${trim_to_match === 'video' ? videoDuration.toFixed(2) : audioDuration.toFixed(2)}s` : ''}

✅ **Success!** Audio and video have been merged successfully.

**Use Cases:**
- Add background music to video
- Replace poor quality audio with better recording
- Add narration or voiceover to existing video
- Combine separately recorded audio and video tracks`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error merging audio and video: ${error instanceof Error ? error.message : String(error)}

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- Input files don't exist or are inaccessible
- Output directory doesn't exist or lacks write permissions
- Incompatible audio/video formats
- Insufficient disk space for output file
- Audio or video file is corrupted or invalid`
        }
      ]
    };
  }
}