---
url: https://replicate.com/tencent/hunyuan-video
title: tencent/hunyuan-video | Run with an API on Replicate
description: A state-of-the-art text-to-video generation model capable of creating high-quality videos with realistic motion from text descriptions
access_date: 2025-07-18T09:34:46.000Z
current_date: 2025-07-18T09:34:46.464Z
---

###  tencent / hunyuan-video 

 A state-of-the-art text-to-video generation model capable of creating high-quality videos with realistic motion from text descriptions

* Public
* 108.4K runs
* GitHub
* Weights
* Paper
* License

Iterate in playground 

Run with an API 

Playground API Examples README Versions 

#### Examples

 View more 

#### Run time and cost

This model costs approximately $1.22 to run on Replicate, or 0 runs per $1, but this varies depending on your inputs. It is also open source and you can run it on your own computer with Docker.

 This model runs on 4x Nvidia H100 GPU hardware. Predictions typically complete within 4 minutes. The predict time for this model varies significantly based on the inputs.

#### Readme

# HunyuanVideo Text-to-Video Generation Model 🎬

HunyuanVideo is an advanced text-to-video generation model that can create high-quality videos from text descriptions. It features a comprehensive framework that integrates image-video joint model training and efficient infrastructure for large-scale model training and inference.

This deployment is parallelized across multiple GPUs using context parallel attention from the awesome ParaAttention repo.

## Model Description ✨

This model is trained on a spatial-temporally compressed latent space and uses a large language model for text encoding. According to professional human evaluation results, HunyuanVideo outperforms previous state-of-the-art models in terms of text alignment, motion quality, and visual quality.

Key features:

* 🎨 High-quality video generation from text descriptions
* 📐 Support for various aspect ratios and resolutions
* ✍️ Advanced prompt handling with a built-in rewrite system
* 🎯 Stable motion generation and temporal consistency

## Predictions Examples 💫

The model works well for prompts like: - “A cat walks on the grass, realistic style” - “A drone shot of mountains at sunset” - “A flower blooming in timelapse”

## Limitations ⚠️

* Generation time increases with video length and resolution
* Higher resolutions require more GPU memory
* Some complex motions may require prompt engineering for best results

## Citation 📚

If you use this model in your research, please cite:

```
@misc{kong2024hunyuanvideo,
      title={HunyuanVideo: A Systematic Framework For Large Video Generative Models}, 
      author={Weijie Kong, et al.},
      year={2024},
      archivePrefix={arXiv},
      primaryClass={cs.CV}
}

```