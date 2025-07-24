import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const videoTransitionSchema = z.object({
  inputs: z.array(z.string()).min(2).describe("Array of absolute paths to input video files (minimum 2)"),
  output: z.string().describe("Absolute path for the output video file"),
  transition_type: z.enum([
    'fade', 'fadeblack', 'fadewhite', 'distance', 'wipeleft', 'wiperight', 'wipeup', 'wipedown',
    'slideleft', 'slideright', 'slideup', 'slidedown', 'smoothleft', 'smoothright', 'smoothup', 'smoothdown',
    'circlecrop', 'rectcrop', 'radial', 'pixelize', 'dissolve', 'diagtl', 'diagtr', 'diagbl', 'diagbr',
    'hlslice', 'hrslice', 'vuslice', 'vdslice', 'hblur', 'fadegrays', 'wipetl', 'wipetr', 'wipebl', 'wipebr',
    'squeezeh', 'squeezev', 'zoomin', 'hlwind', 'hrwind', 'vuwind', 'vdwind'
  ]).describe("Type of transition effect"),
  duration: z.number().min(0.1).max(10).default(1).describe("Duration of each transition in seconds (0.1-10s)"),
  offset_mode: z.enum(['auto', 'manual']).default('auto').describe("How to calculate transition timing"),
  manual_offsets: z.array(z.number()).optional().describe("Manual offset times in seconds for each transition (only used with manual offset_mode)"),
  easing: z.enum(['linear', 'easeinsine', 'easeoutsine', 'easeinoutsine', 'easeinquad', 'easeoutquad', 'easeinoutquad']).default('linear').describe("Easing function for transition timing"),
  verbose: z.boolean().optional().default(false).describe("Enable verbose output mode (default: false)"),
});

export async function videoTransition({
  inputs,
  output,
  transition_type,
  duration = 1,
  offset_mode = 'auto',
  manual_offsets,
  easing = 'linear',
  verbose = false,
}: z.infer<typeof videoTransitionSchema>) {
  try {
    // Validate all input files exist
    for (const input of inputs) {
      await fs.access(input);
    }
    
    // Ensure output directory exists
    await fs.mkdir(path.dirname(output), { recursive: true });
    
    if (inputs.length < 2) {
      throw new Error("At least 2 input videos are required for transitions");
    }
    
    // Validate manual offsets if provided
    if (offset_mode === 'manual') {
      if (!manual_offsets || manual_offsets.length !== inputs.length - 1) {
        throw new Error(`Manual offset mode requires exactly ${inputs.length - 1} offset values`);
      }
    }
    
    // Get video durations for auto offset calculation
    let videoDurations: number[] = [];
    if (offset_mode === 'auto') {
      for (const input of inputs) {
        const durationCmd = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${input}"`;
        const { stdout } = await execAsync(durationCmd);
        videoDurations.push(parseFloat(stdout.trim()));
      }
    }
    
    // Build input flags
    const inputFlags = inputs.map(input => `-i "${input}"`).join(' ');
    
    // Build xfade filter chain
    let filterComplex = '';
    let currentStream = '[0:v]';
    
    for (let i = 0; i < inputs.length - 1; i++) {
      const nextInput = `[${i + 1}:v]`;
      let offset: number;
      
      if (offset_mode === 'auto') {
        // Calculate offset as end of current video minus transition duration
        offset = videoDurations.slice(0, i + 1).reduce((sum, dur) => sum + dur, 0) - duration;
      } else {
        offset = manual_offsets![i];
      }
      
      const transitionStream = i === inputs.length - 2 ? '[outv]' : `[v${i + 1}]`;
      
      filterComplex += `${currentStream}${nextInput}xfade=transition=${transition_type}:duration=${duration}:offset=${offset}:easing=${easing}${transitionStream}`;
      
      if (i < inputs.length - 2) {
        filterComplex += ';';
        currentStream = `[v${i + 1}]`;
      }
    }
    
    // Build FFmpeg command
    const ffmpegCommand = `ffmpeg -y ${inputFlags} -filter_complex "${filterComplex}" -map "[outv]" -c:v libx264 -pix_fmt yuv420p "${output}"`;
    
    await execAsync(ffmpegCommand, { timeout: 600000, maxBuffer: 1024 * 1024 * 20 });
    
    // Calculate total duration
    let totalDuration: number;
    if (offset_mode === 'auto') {
      totalDuration = videoDurations.reduce((sum, dur) => sum + dur, 0) - (duration * (inputs.length - 1));
    } else {
      totalDuration = manual_offsets!.reduce((sum, offset) => sum + offset, 0) + duration;
    }
    
    if (verbose) {
      return {
        content: [
          {
            type: "text" as const,
            text: `🎬✨ **Video Transitions Complete**

**📁 Input Videos:** ${inputs.length} videos
${inputs.map((input, i) => `  ${i + 1}. ${path.basename(input)}`).join('\n')}

**📁 Output:** ${output}
**🎨 Transition:** ${transition_type}
**⏱️ Duration:** ${duration}s per transition
**📐 Easing:** ${easing}
**⚙️ Timing:** ${offset_mode === 'auto' ? 'Automatic based on video durations' : 'Manual offsets'}
${offset_mode === 'manual' && manual_offsets ? `**🎯 Offsets:** ${manual_offsets.join('s, ')}s` : ''}
**📏 Total Duration:** ~${totalDuration.toFixed(1)}s

✅ **Success!** ${inputs.length} videos combined with ${inputs.length - 1} ${transition_type} transitions.

**Available Transition Types:**
🔄 **Fade Effects:** fade, fadeblack, fadewhite, fadegrays, dissolve
🌊 **Wipe Effects:** wipeleft, wiperight, wipeup, wipedown, wipetl, wipetr, wipebl, wipebr
📱 **Slide Effects:** slideleft, slideright, slideup, slidedown, smoothleft, smoothright, smoothup, smoothdown
🎯 **Crop Effects:** circlecrop, rectcrop, radial
🔲 **Slice Effects:** hlslice, hrslice, vuslice, vdslice, diagtl, diagtr, diagbl, diagbr
💨 **Motion Effects:** squeezeh, squeezev, zoomin, distance, pixelize, hblur
🌪️ **Wind Effects:** hlwind, hrwind, vuwind, vdwind`
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Video transitions complete. ${inputs.length} videos with ${transition_type} transitions (~${totalDuration.toFixed(1)}s). Output: ${output}`
          }
        ]
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error creating video transitions: ${error instanceof Error ? error.message : String(error)}

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- One or more input videos don't exist or are inaccessible
- Output directory doesn't exist or lacks write permissions
- Transition duration too long relative to video lengths
- Invalid manual offset values
- Insufficient memory for processing large videos`
        }
      ]
    };
  }
}

export const advancedVideoEffectsSchema = z.object({
  input: z.string().describe("Absolute path to the input video file"),
  output: z.string().describe("Absolute path for the output video file"),
  effect_type: z.enum([
    'colorize', 'vintage', 'filmgrain', 'vignette', 'chromakey', 'edgedetect', 'emboss', 'negative',
    'sepia', 'thermal', 'night_vision', 'glitch', 'datamosh', 'rgb_shift', 'lens_flare', 'light_leak',
    'film_burn', 'old_tv', 'crt_monitor', 'hologram', 'matrix', 'cyberpunk', 'underwater', 'dream',
    'kaleidoscope', 'mirror', 'fisheye', 'barrel_distort', 'wave_distort', 'ripple', 'motion_blur',
    'zoom_blur', 'radial_blur', 'tilt_shift', 'bokeh', 'cross_hatch', 'oil_paint', 'cartoon',
    'posterize', 'solarize', 'threshold', 'duotone', 'split_tone', 'color_grade'
  ]).describe("Type of visual effect to apply"),
  intensity: z.number().min(0).max(2).default(1).describe("Effect intensity (0-2, where 1 is normal)"),
  color_primary: z.string().optional().describe("Primary color for effects that use colors (hex format: #FF0000)"),
  color_secondary: z.string().optional().describe("Secondary color for effects that use colors (hex format: #0000FF)"),
  preserve_audio: z.boolean().default(true).describe("Whether to preserve original audio"),
  verbose: z.boolean().optional().default(false).describe("Enable verbose output mode (default: false)"),
});

export async function advancedVideoEffects({
  input,
  output,
  effect_type,
  intensity = 1,
  color_primary = '#FF0000',
  color_secondary = '#0000FF',
  preserve_audio = true,
  verbose = false,
}: z.infer<typeof advancedVideoEffectsSchema>) {
  try {
    // Validate input file exists
    await fs.access(input);
    
    // Ensure output directory exists
    await fs.mkdir(path.dirname(output), { recursive: true });
    
    // Build effect filter based on type
    let videoFilter: string;
    
    switch (effect_type) {
      case 'colorize':
        videoFilter = `colorbalance=rs=${intensity * 0.3}:gs=${intensity * 0.2}:bs=${intensity * 0.1}`;
        break;
      case 'vintage':
        videoFilter = `curves=vintage,vignette=PI/4*${intensity}`;
        break;
      case 'filmgrain':
        videoFilter = `noise=alls=${intensity * 20}:allf=t`;
        break;
      case 'vignette':
        videoFilter = `vignette=PI/3*${intensity}`;
        break;
      case 'chromakey':
        videoFilter = `chromakey=${color_primary}:similarity=0.${Math.round(intensity * 3)}:blend=0.1`;
        break;
      case 'edgedetect':
        videoFilter = `edgedetect=low=${intensity * 0.1}:high=${intensity * 0.3}`;
        break;
      case 'emboss':
        videoFilter = `convolution='-2 -1 0 -1 1 1 0 1 2:-2 -1 0 -1 1 1 0 1 2:-2 -1 0 -1 1 1 0 1 2:-2 -1 0 -1 1 1 0 1 2'`;
        break;
      case 'negative':
        videoFilter = `negate`;
        break;
      case 'sepia':
        videoFilter = `colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131`;
        break;
      case 'thermal':
        videoFilter = `pseudocolor='if(between(val,0,0.25),lerp(0,1,(val-0)/0.25),if(between(val,0.25,0.5),lerp(1,3,(val-0.25)/0.25),if(between(val,0.5,0.75),lerp(3,4,(val-0.5)/0.25),lerp(4,5,(val-0.75)/0.25))))'`;
        break;
      case 'night_vision':
        videoFilter = `colorchannelmixer=.5:.5:.5:0:.5:.5:.5:0:.5:.5:.5,curves=green='0.5/0.58',noise=alls=${intensity * 10}:allf=t`;
        break;
      case 'glitch':
        videoFilter = `noise=alls=${intensity * 50}:allf=t+u,hue=s=${intensity * 2}`;
        break;
      case 'datamosh':
        videoFilter = `noise=alls=${intensity * 30}:allf=t,deflicker=mode=pm:size=5`;
        break;
      case 'rgb_shift':
        videoFilter = `split=3[r][g][b];[r]lutrgb=g=0:b=0,pad=iw+${Math.round(intensity * 5)}:ih+${Math.round(intensity * 5)}:${Math.round(intensity * 5)}:${Math.round(intensity * 5)}[rshift];[g]lutrgb=r=0:b=0,pad=iw+${Math.round(intensity * 5)}:ih+${Math.round(intensity * 5)}:0:${Math.round(intensity * 5)}[gshift];[b]lutrgb=r=0:g=0,pad=iw+${Math.round(intensity * 5)}:ih+${Math.round(intensity * 5)}:0:0[bshift];[rshift][gshift]blend=all_mode=addition[rg];[rg][bshift]blend=all_mode=addition`;
        break;
      case 'lens_flare':
        videoFilter = `lens_flare=lx=0.5:ly=0.5:lr=${intensity * 0.3}:lg=${intensity * 0.2}:lb=${intensity * 0.1}:la=${intensity * 0.8}`;
        break;
      case 'light_leak':
        videoFilter = `curves=red='0/0.1 0.5/0.6 1/1':green='0/0 0.5/0.7 1/0.9':blue='0/0.2 0.5/0.5 1/0.8',vignette=PI/6*${intensity}`;
        break;
      case 'film_burn':
        videoFilter = `curves=all='0/0.1 0.3/0.4 0.7/0.9 1/1',noise=alls=${intensity * 15}:allf=t`;
        break;
      case 'old_tv':
        videoFilter = `noise=alls=${intensity * 25}:allf=t,interlace=scan=tff,scale=iw*0.8:ih*0.8`;
        break;
      case 'crt_monitor':
        videoFilter = `scale=640:480,noise=alls=${intensity * 20}:allf=t,curves=all='0/0.05 1/0.95'`;
        break;
      case 'hologram':
        videoFilter = `colorchannelmixer=.2:.8:.2:0:.1:.9:.1:0:.3:.3:.9,noise=alls=${intensity * 15}:allf=t`;
        break;
      case 'matrix':
        videoFilter = `colorchannelmixer=0:1:0:0:0:1:0:0:0:1:0,noise=alls=${intensity * 10}:allf=t+u`;
        break;
      case 'cyberpunk':
        videoFilter = `curves=red='0/0.2 0.5/0.8 1/1':green='0/0 0.5/0.4 1/0.6':blue='0/0.6 0.5/0.9 1/1',vignette=PI/4*${intensity}`;
        break;
      case 'underwater':
        videoFilter = `colorchannelmixer=.4:.4:.8:0:.3:.5:.8:0:.2:.3:.9,curves=all='0/0.1 1/0.9'`;
        break;
      case 'dream':
        videoFilter = `gblur=sigma=${intensity * 2},colorbalance=rs=0.3:gs=0.2:bs=-0.1`;
        break;
      case 'kaleidoscope':
        videoFilter = `split=6[s0][s1][s2][s3][s4][s5];[s1]hflip[s1h];[s2]vflip[s2v];[s3]transpose=1[s3t];[s4]transpose=2[s4t];[s5]transpose=3[s5t];[s0][s1h][s2v][s3t][s4t][s5t]xstack=inputs=6:layout=0_0|w0_0|0_h0|w0_h0|2*w0_0|2*w0_h0:shortest=1`;
        break;
      case 'mirror':
        videoFilter = `split[left][right];[right]hflip[rightflipped];[left][rightflipped]hstack`;
        break;
      case 'fisheye':
        videoFilter = `lenscorrection=k1=${intensity * 0.5}:k2=${intensity * 0.1}`;
        break;
      case 'barrel_distort':
        videoFilter = `lenscorrection=k1=${intensity * -0.3}:k2=${intensity * 0.1}`;
        break;
      case 'wave_distort':
        videoFilter = `geq=lum='sin(X/${intensity * 50})*20+Y':cb=128:cr=128`;
        break;
      case 'ripple':
        videoFilter = `geq=lum='sin((X-W/2)*(X-W/2)+(Y-H/2)*(Y-H/2))/${intensity * 1000}*20+Y':cb=128:cr=128`;
        break;
      case 'motion_blur':
        videoFilter = `minterpolate=fps=25:mb_size=${Math.round(intensity * 16)}:search_param=${Math.round(intensity * 32)}`;
        break;
      case 'zoom_blur':
        videoFilter = `zoompan=z='zoom+${intensity * 0.001}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1,trim=duration=1`;
        break;
      case 'radial_blur':
        videoFilter = `gblur=sigma=${intensity * 3}:steps=1`;
        break;
      case 'tilt_shift':
        videoFilter = `split[main][blur];[blur]gblur=sigma=${intensity * 5}[blurred];[main][blurred]blend=all_expr='if(between(Y,H*0.3,H*0.7),A,B)'`;
        break;
      case 'bokeh':
        videoFilter = `gblur=sigma=${intensity * 4},unsharp=5:5:${intensity}:5:5:0`;
        break;
      case 'cross_hatch':
        videoFilter = `convolution='1 1 1 1 1 1 1 1 1:1 1 1 1 1 1 1 1 1:1 1 1 1 1 1 1 1 1:1 1 1 1 1 1 1 1 1'`;
        break;
      case 'oil_paint':
        videoFilter = `bilateral=sigmaS=${intensity * 20}:sigmaR=${intensity * 0.3}`;
        break;
      case 'cartoon':
        videoFilter = `bilateral=sigmaS=${intensity * 80}:sigmaR=${intensity * 0.8},edgedetect=low=0.1:high=0.4`;
        break;
      case 'posterize':
        videoFilter = `lutyuv=y='if(lt(val,16),16,if(lt(val,32),32,if(lt(val,48),48,if(lt(val,64),64,if(lt(val,80),80,if(lt(val,96),96,if(lt(val,112),112,if(lt(val,128),128,if(lt(val,144),144,if(lt(val,160),160,if(lt(val,176),176,if(lt(val,192),192,if(lt(val,208),208,if(lt(val,224),224,235)))))))))))))':u=128:v=128`;
        break;
      case 'solarize':
        videoFilter = `lutyuv=y='if(gte(val,128),255-val,val)':u=128:v=128`;
        break;
      case 'threshold':
        videoFilter = `lutyuv=y='if(gte(val,${Math.round(128 * intensity)}),255,0)':u=128:v=128`;
        break;
      case 'duotone':
        videoFilter = `colorchannelmixer=.299:.587:.114:0:.299:.587:.114:0:.299:.587:.114,pseudocolor='if(between(val,0,0.5),lerp(0,1,(val-0)/0.5),lerp(1,2,(val-0.5)/0.5))'`;
        break;
      case 'split_tone':
        videoFilter = `curves=shadows='0/0.2 0.3/0.4 1/1':highlights='0/0 0.7/0.6 1/0.8'`;
        break;
      case 'color_grade':
        videoFilter = `curves=red='0/0.1 0.5/0.6 1/0.9':green='0/0.05 0.5/0.55 1/0.95':blue='0/0.2 0.5/0.5 1/0.8',colorbalance=rs=${intensity * 0.2}:gs=${intensity * 0.1}:bs=${intensity * -0.1}`;
        break;
      default:
        throw new Error(`Unsupported effect type: ${effect_type}`);
    }
    
    // Build audio handling
    const audioOptions = preserve_audio ? '-c:a copy' : '-an';
    
    // Build FFmpeg command
    const ffmpegCommand = `ffmpeg -y -i "${input}" -vf "${videoFilter}" -c:v libx264 -pix_fmt yuv420p ${audioOptions} "${output}"`;
    
    await execAsync(ffmpegCommand, { timeout: 600000, maxBuffer: 1024 * 1024 * 20 });
    
    if (verbose) {
      return {
        content: [
          {
            type: "text" as const,
            text: `🎨✨ **Advanced Video Effect Applied**

**📁 Input:** ${input}
**📁 Output:** ${output}
**🎭 Effect:** ${effect_type}
**🎚️ Intensity:** ${intensity}/2.0
${color_primary && ['colorize', 'chromakey', 'duotone'].includes(effect_type) ? `**🎨 Primary Color:** ${color_primary}` : ''}
${color_secondary && ['duotone', 'split_tone'].includes(effect_type) ? `**🎨 Secondary Color:** ${color_secondary}` : ''}
**🎵 Audio:** ${preserve_audio ? 'Preserved' : 'Removed'}

✅ **Success!** Advanced ${effect_type} effect has been applied to your video.

**🎨 Color Effects:** colorize, vintage, sepia, thermal, night_vision, duotone, split_tone, color_grade
**🎭 Artistic Effects:** filmgrain, emboss, negative, cross_hatch, oil_paint, cartoon, posterize
**🌟 Sci-Fi Effects:** glitch, datamosh, rgb_shift, hologram, matrix, cyberpunk
**🌊 Distortion Effects:** fisheye, barrel_distort, wave_distort, ripple, kaleidoscope, mirror
**💫 Blur Effects:** motion_blur, zoom_blur, radial_blur, tilt_shift, bokeh, dream
**📺 Retro Effects:** old_tv, crt_monitor, film_burn, light_leak, lens_flare
**🔍 Detection Effects:** edgedetect, threshold, solarize, underwater, vignette`
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Advanced video effect applied (${effect_type}, intensity: ${intensity}). Output: ${output}`
          }
        ]
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Error applying video effect: ${error instanceof Error ? error.message : String(error)}

**Common Issues:**
- FFmpeg not installed (install via: brew install ffmpeg)
- Input video doesn't exist or is inaccessible
- Output directory doesn't exist or lacks write permissions
- Effect intensity too high for the video
- Invalid color format (use hex format: #FF0000)
- Insufficient memory for processing effects`
        }
      ]
    };
  }
}