import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const concatenateSegmentsSchema = z.object({
  inputs: z.array(z.string()).describe("Array of absolute paths to input video files and/or image files"),
  output: z.string().describe("Absolute path for the output video file"),
  image_durations: z.array(z.number()).optional().describe("Array of durations in seconds for each image input (default: 2 seconds each)"),
  re_encode: z.boolean().optional().describe("Re-encode videos for compatibility (default: true for mixed inputs)"),
  fps: z.number().optional().describe("Frame rate for the output video (default: 25)"),
  resolution: z.string().optional().describe("Output resolution in WIDTHxHEIGHT format (default: auto)"),
  verbose: z.boolean().optional().default(false).describe("Enable verbose output mode (default: false)"),
});

export async function concatenateSegments({
  inputs,
  output,
  image_durations,
  re_encode,
  fps = 25,
  resolution,
  verbose = false,
}: z.infer<typeof concatenateSegmentsSchema>) {
  try {
    // Validate all input files exist
    for (const input of inputs) {
      await fs.access(input);
    }
    
    // Ensure output directory exists
    await fs.mkdir(path.dirname(output), { recursive: true });
    
    // Detect file types
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'];
    
    const inputTypes = inputs.map(input => {
      const ext = path.extname(input).toLowerCase();
      if (imageExtensions.includes(ext)) return 'image';
      if (videoExtensions.includes(ext)) return 'video';
      return 'unknown';
    });
    
    const hasImages = inputTypes.includes('image');
    const hasVideos = inputTypes.includes('video');
    const hasMixed = hasImages && hasVideos;
    
    // Set default re_encode based on mixed inputs
    if (re_encode === undefined) {
      re_encode = hasMixed || hasImages;
    }
    
    // Set default image durations
    if (!image_durations) {
      const imageCount = inputTypes.filter(type => type === 'image').length;
      image_durations = new Array(imageCount).fill(2);
    }
    
    let imageDurationIndex = 0;
    
    if (re_encode || hasMixed) {
      // Use filter_complex for mixed inputs or re-encoding
      const inputFlags = [];
      const filterParts = [];
      
      // Process each input
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const type = inputTypes[i];
        
        if (type === 'image') {
          const duration = image_durations[imageDurationIndex] || 2;
          imageDurationIndex++;
          inputFlags.push(`-loop 1 -t ${duration} -i "${input}"`);
          
          // Scale and format image
          if (resolution) {
            filterParts.push(`[${i}:v]scale=${resolution},setsar=1,fps=${fps},format=yuv420p,setpts=PTS-STARTPTS[v${i}]`);
          } else {
            filterParts.push(`[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1:black,setsar=1,fps=${fps},format=yuv420p,setpts=PTS-STARTPTS[v${i}]`);
          }
        } else if (type === 'video') {
          inputFlags.push(`-i "${input}"`);
          
          // Scale and format video
          if (resolution) {
            filterParts.push(`[${i}:v]scale=${resolution},setsar=1,fps=${fps},format=yuv420p,setpts=PTS-STARTPTS[v${i}]`);
          } else {
            filterParts.push(`[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1:black,setsar=1,fps=${fps},format=yuv420p,setpts=PTS-STARTPTS[v${i}]`);
          }
          
          // Only handle audio streams if they exist (will be checked by FFmpeg)
          // We'll filter these out later if they don't exist
        }
      }
      
      // Build concatenation filter
      const videoInputs = inputs.map((_, i) => `[v${i}]`).join('');
      
      // For video-only inputs (no audio), just concatenate video streams
      filterParts.push(`${videoInputs}concat=n=${inputs.length}:v=1:a=0[outv]`);
      
      const filterComplex = filterParts.join(';');
      const ffmpegCommand = `ffmpeg -y ${inputFlags.join(' ')} -filter_complex "${filterComplex}" -map "[outv]" -c:v libx264 -r ${fps} "${output}"`;
      
      await execAsync(ffmpegCommand, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 });
    } else {
      // Use concat demuxer for faster concatenation (videos only, same format)
      const tempListFile = path.join(path.dirname(output), 'concat_list.txt');
      const listContent = inputs.map(input => `file '${input}'`).join('\n');
      
      await fs.writeFile(tempListFile, listContent);
      
      const ffmpegCommand = `ffmpeg -y -f concat -safe 0 -i "${tempListFile}" -c copy "${output}"`;
      await execAsync(ffmpegCommand, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 });
      
      // Clean up temp file
      await fs.unlink(tempListFile);
    }
    
    // Build type summary
    const typeSummary = [];
    if (hasImages) typeSummary.push(`${inputTypes.filter(t => t === 'image').length} images`);
    if (hasVideos) typeSummary.push(`${inputTypes.filter(t => t === 'video').length} videos`);
    
    if (verbose) {
      return {
        content: [
          {
            type: "text" as const,
            text: `🔗 **Media Concatenation Complete**

**📁 Input Files:** ${inputs.length} files (${typeSummary.join(', ')})
${inputs.map((input, index) => `  ${index + 1}. ${path.basename(input)} (${inputTypes[index]})`).join('\n')}

**📁 Output:** ${output}
**⚙️ Method:** ${re_encode ? 'Re-encode with filter_complex (compatible with mixed formats)' : 'Copy streams (faster, videos only)'}
${hasImages ? `**🖼️ Image Settings:**\n- Default Duration: ${image_durations[0]}s per image\n- Frame Rate: ${fps} fps` : ''}
${resolution ? `**📏 Resolution:** ${resolution}` : ''}

✅ **Success!** ${inputs.length} files have been joined into a single video.

**Supported Formats:**
- Images: JPG, PNG, GIF, BMP, TIFF, WebP
- Videos: MP4, AVI, MOV, MKV, WMV, FLV, WebM`
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Media concatenation complete. ${inputs.length} files joined. Output: ${output}`
          }
        ]
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error concatenating media: ${error instanceof Error ? error.message : String(error)}

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- One or more input files don't exist or are inaccessible
- Output directory doesn't exist or lacks write permissions
- Videos have different formats/codecs (try re_encode: true)
- Insufficient disk space for output file
- Unsupported file formats`
        }
      ]
    };
  }
}

export const imagesToVideoSchema = z.object({
  images: z.array(z.string()).describe("Array of absolute paths to image files"),
  durations: z.array(z.number()).optional().describe("Array of durations in seconds for each image (default: 2 seconds each)"),
  output: z.string().describe("Absolute path for the output video file"),
  fps: z.number().optional().describe("Frame rate of the output video (default: 25)"),
  resolution: z.string().optional().describe("Output resolution in WIDTHxHEIGHT format (default: auto from first image)"),
  audio_input: z.string().optional().describe("Optional audio file to add to the video"),
  transition_duration: z.number().optional().describe("Duration of crossfade transition between images in seconds (default: 0)"),
  loop_audio: z.boolean().optional().describe("Loop audio to match video duration (default: false)"),
  verbose: z.boolean().optional().default(false).describe("Enable verbose output mode (default: false)"),
});

export async function imagesToVideo({
  images,
  durations,
  output,
  fps = 25,
  resolution,
  audio_input,
  transition_duration = 0,
  loop_audio = false,
  verbose = false,
}: z.infer<typeof imagesToVideoSchema>) {
  try {
    // Validate all image files exist
    for (const image of images) {
      await fs.access(image);
    }
    
    if (audio_input) {
      await fs.access(audio_input);
    }
    
    // Ensure output directory exists
    await fs.mkdir(path.dirname(output), { recursive: true });
    
    // Set default durations if not provided
    if (!durations) {
      durations = new Array(images.length).fill(2);
    } else if (durations.length !== images.length) {
      throw new Error("Number of durations must match number of images");
    }
    
    // Calculate total video duration
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    
    // Build filter complex for image sequence
    let filterParts = [];
    let inputFlags = [];
    
    // Add image inputs
    for (let i = 0; i < images.length; i++) {
      inputFlags.push(`-loop 1 -t ${durations[i]} -i "${images[i]}"`);
    }
    
    // Add audio input if provided
    if (audio_input) {
      inputFlags.push(`-i "${audio_input}"`);
    }
    
    // Build scale and format filters for each image
    for (let i = 0; i < images.length; i++) {
      if (resolution) {
        filterParts.push(`[${i}:v]scale=${resolution},setsar=1,fps=${fps},format=yuv420p,setpts=PTS-STARTPTS[v${i}]`);
      } else {
        filterParts.push(`[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1:black,setsar=1,fps=${fps},format=yuv420p,setpts=PTS-STARTPTS[v${i}]`);
      }
    }
    
    // Build concatenation filter
    const videoInputs = images.map((_, i) => `[v${i}]`).join('');
    if (transition_duration > 0) {
      // Add crossfade transitions
      let transitionFilter = videoInputs;
      for (let i = 0; i < images.length - 1; i++) {
        const offset = durations.slice(0, i + 1).reduce((sum, dur) => sum + dur, 0) - transition_duration;
        transitionFilter += `xfade=transition=fade:duration=${transition_duration}:offset=${offset}`;
        if (i < images.length - 2) transitionFilter += ',';
      }
      filterParts.push(`${transitionFilter}[video]`);
    } else {
      filterParts.push(`${videoInputs}concat=n=${images.length}:v=1:a=0[video]`);
    }
    
    // Build complete filter complex
    const filterComplex = filterParts.join(';');
    
    // Build FFmpeg command
    let ffmpegCommand = `ffmpeg -y ${inputFlags.join(' ')}`;
    
    // Add audio handling
    if (audio_input) {
      const audioIndex = images.length;
      if (loop_audio) {
        ffmpegCommand += ` -filter_complex "${filterComplex};[${audioIndex}:a]aloop=loop=-1:size=2e+09[audio]" -map "[video]" -map "[audio]" -t ${totalDuration} -c:a aac`;
      } else {
        ffmpegCommand += ` -filter_complex "${filterComplex}" -map "[video]" -map ${audioIndex}:a -t ${totalDuration} -c:a aac`;
      }
    } else {
      ffmpegCommand += ` -filter_complex "${filterComplex}" -map "[video]"`;
    }
    
    ffmpegCommand += ` -c:v libx264 -pix_fmt yuv420p -r ${fps} "${output}"`;
    
    await execAsync(ffmpegCommand, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 });
    
    if (verbose) {
      return {
        content: [
          {
            type: "text" as const,
            text: `🖼️➡️🎬 **Images to Video Conversion Complete**

**📁 Input Images:** ${images.length} images
${images.map((img, i) => `  ${i + 1}. ${path.basename(img)} (${durations![i]}s)`).join('\n')}

**📁 Output:** ${output}
**⚙️ Settings:**
- Total Duration: ${totalDuration}s
- Frame Rate: ${fps} fps
- Resolution: ${resolution || 'Auto (1920x1080 with padding)'}
- Transition: ${transition_duration > 0 ? `${transition_duration}s crossfade` : 'None'}
${audio_input ? `- Audio: ${path.basename(audio_input)} ${loop_audio ? '(looped)' : ''}` : '- Audio: None'}

✅ **Success!** ${images.length} images have been converted to video.

**Use Cases:**
- Create slideshows from photo collections
- Generate video content from still images
- Build animated presentations
- Convert image sequences to video format`
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Images to video conversion complete. ${images.length} images, ${totalDuration}s duration. Output: ${output}`
          }
        ]
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error creating video from images: ${error instanceof Error ? error.message : String(error)}

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- One or more image files don't exist or are inaccessible
- Output directory doesn't exist or lacks write permissions
- Audio file doesn't exist (if specified)
- Invalid image formats or corrupted files
- Insufficient disk space for output video`
        }
      ]
    };
  }
}