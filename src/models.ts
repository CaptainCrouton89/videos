export interface VideoModelConfig {
  version: string;
  type: "text-to-video" | "image-to-video" | "both";
  maxDuration: number;
  resolutions: string[];
  hasAudio: boolean;
  defaultParams: Record<string, any>;
}

export const VIDEO_MODELS: Record<string, VideoModelConfig> = {
  // Google Veo Models (2025)
  "veo-3": {
    version: "google/veo-3",
    type: "text-to-video",
    maxDuration: 30,
    resolutions: ["720p", "1080p", "4K"],
    hasAudio: true,
    defaultParams: {
      duration: 5,
      aspect_ratio: "16:9",
      enhance_prompt: true,
      generate_audio: true,
      person_generation: "allow_all",
    },
  },
  "veo-3-fast": {
    version: "google/veo-3-fast",
    type: "text-to-video",
    maxDuration: 30,
    resolutions: ["720p", "1080p", "4K"],
    hasAudio: true,
    defaultParams: {
      duration: 5,
      aspect_ratio: "16:9",
      enhance_prompt: true,
      generate_audio: true,
      person_generation: "allow_all",
    },
  },
  "veo-2": {
    version: "google/veo-2",
    type: "text-to-video",
    maxDuration: 30,
    resolutions: ["720p", "1080p", "4K"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      resolution: "720p",
      fps: 24,
      guidance_scale: 7.5,
      num_inference_steps: 50,
    },
  },

  // Tencent HunyuanVideo (2025)
  "hunyuan-video": {
    version: "tencent/hunyuan-video",
    type: "text-to-video",
    maxDuration: 10,
    resolutions: ["720p", "1280p"],
    hasAudio: false,
    defaultParams: {
      video_size: "720x1280",
      video_length: 129,
      inference_steps: 50,
      guidance_scale: 6,
      flow_reverse: false,
      cpu_offload: true,
    },
  },

  // Genmo Mochi-1 (2025)
  "mochi-1": {
    version: "genmoai/mochi-1",
    type: "text-to-video",
    maxDuration: 5.4,
    resolutions: ["480p"],
    hasAudio: false,
    defaultParams: {
      num_frames: 31,
      height: 480,
      width: 848,
      num_inference_steps: 64,
      guidance_scale: 4.5,
      fps: 30,
    },
  },

  // LTX Video (2025)
  "ltx-video": {
    version: "lightricks/ltx-video",
    type: "text-to-video",
    maxDuration: 10,
    resolutions: ["768p"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      fps: 24,
      resolution: "768x512",
    },
  },

  // Pyramid Flow (2025)
  "pyramid-flow": {
    version: "zsxkib/pyramid-flow",
    type: "both",
    maxDuration: 10,
    resolutions: ["768p"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      resolution: "768p",
      flow_steps: 50,
    },
  },

  // ByteDance Seedance Models (2025)
  "seedance-pro": {
    version: "bytedance/seedance-1-pro",
    type: "both",
    maxDuration: 10,
    resolutions: ["480p", "720p", "1080p"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      resolution: "480p",
      mode: "text-to-video",
    },
  },
  "seedance-lite": {
    version: "bytedance/seedance-1-lite",
    type: "both",
    maxDuration: 10,
    resolutions: ["480p", "720p"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      resolution: "480p",
      mode: "text-to-video",
    },
  },

  // MiniMax Hailuo Models (2025)
  "hailuo-2": {
    version: "minimax/hailuo-02",
    type: "both",
    maxDuration: 10,
    resolutions: ["720p", "1080p"],
    hasAudio: false,
    defaultParams: {
      duration: 6,
      resolution: "720p",
    },
  },
  "minimax-video": {
    version: "minimax/video-01",
    type: "text-to-video",
    maxDuration: 6,
    resolutions: ["720p"],
    hasAudio: false,
    defaultParams: {
      duration: 6,
      resolution: "720p",
      fps: 25,
    },
  },
  "minimax-director": {
    version: "minimax/video-01-director",
    type: "both",
    maxDuration: 10,
    resolutions: ["720p", "1080p"],
    hasAudio: false,
    defaultParams: {
      duration: 6,
      resolution: "720p",
      camera_movement: "static",
    },
  },

  // Kuaishou Kling Models (2025)
  "kling-v2.1-master": {
    version: "kwaivgi/kling-v2.1-master",
    type: "both",
    maxDuration: 10,
    resolutions: ["720p", "1080p"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      resolution: "720p",
      motion_intensity: 5,
    },
  },
  "kling-v1.6-pro": {
    version: "kwaivgi/kling-v1.6-pro",
    type: "both",
    maxDuration: 10,
    resolutions: ["1080p"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      resolution: "1080p",
    },
  },

  // Luma Ray Models (2025)
  "ray-flash-2": {
    version: "luma/ray-flash-2-720p",
    type: "both",
    maxDuration: 10,
    resolutions: ["720p"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      resolution: "720p",
    },
  },
  "ray-2": {
    version: "luma/ray-2-720p",
    type: "both",
    maxDuration: 10,
    resolutions: ["720p"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      resolution: "720p",
    },
  },
  "luma-ray": {
    version: "luma/ray",
    type: "both",
    maxDuration: 10,
    resolutions: ["720p", "1080p"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      resolution: "720p",
    },
  },

  // Alibaba WAN Models (2025)
  "wan-t2v-720p": {
    version: "wavespeedai/wan-2.1-t2v-720p",
    type: "text-to-video",
    maxDuration: 5,
    resolutions: ["720p"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      resolution: "720p",
      fps: 25,
      guide_scale: 4,
      steps: 50,
    },
  },
  "wan-i2v-720p": {
    version: "wavespeedai/wan-2.1-i2v-720p",
    type: "image-to-video",
    maxDuration: 5,
    resolutions: ["720p"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      resolution: "720p",
      fps: 25,
      guide_scale: 4,
      steps: 50,
    },
  },
  "wan-t2v-480p": {
    version: "wavespeedai/wan-2.1-t2v-480p",
    type: "text-to-video",
    maxDuration: 5,
    resolutions: ["480p"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      resolution: "480p",
      fps: 25,
      guide_scale: 4,
      steps: 50,
    },
  },
  "wan-i2v-480p": {
    version: "wavespeedai/wan-2.1-i2v-480p",
    type: "image-to-video",
    maxDuration: 5,
    resolutions: ["480p"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      resolution: "480p",
      fps: 25,
      guide_scale: 4,
      steps: 50,
    },
  },

  // PixVerse Models (2025)
  "pixverse-v4.5": {
    version: "pixverse/pixverse-v4.5",
    type: "both",
    maxDuration: 8,
    resolutions: ["540p", "720p", "1080p"],
    hasAudio: false,
    defaultParams: {
      duration: 5,
      resolution: "720p",
    },
  },
};