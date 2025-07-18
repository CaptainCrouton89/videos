---
url: https://replicate.com/genmoai/mochi-1
title: genmoai/mochi-1 | Run with an API on Replicate
description: Mochi 1 preview is an open video generation model with high-fidelity motion and strong prompt adherence in preliminary evaluation
access_date: 2025-07-18T09:34:50.000Z
current_date: 2025-07-18T09:34:50.403Z
---

###  genmoai / mochi-1 

 Mochi 1 preview is an open video generation model with high-fidelity motion and strong prompt adherence in preliminary evaluation

* Public
* 2.9K runs
* GitHub
* Weights
* License

Iterate in playground 

Run with an API 

Playground API Examples README Versions 

#### Examples

 View more 

#### Run time and cost

This model costs approximately $0.42 to run on Replicate, or 2 runs per $1, but this varies depending on your inputs. It is also open source and you can run it on your own computer with Docker.

 This model runs on Nvidia H100 GPU hardware. Predictions typically complete within 5 minutes. The predict time for this model varies significantly based on the inputs.

#### Readme

# Mochi 1

Blog | Hugging Face | Playground | Careers

A state of the art video generation model by Genmo.

![board](IMAGE) 

## Overview

Mochi 1 preview is an open state-of-the-art video generation model with high-fidelity motion and strong prompt adherence in preliminary evaluation. This model dramatically closes the gap between closed and open video generation systems. We’re releasing the model under a permissive Apache 2.0 license. Try this model for free on our playground.

## Model Architecture

Mochi 1 represents a significant advancement in open-source video generation, featuring a 10 billion parameter diffusion model built on our novel Asymmetric Diffusion Transformer (AsymmDiT) architecture. Trained entirely from scratch, it is the largest video generative model ever openly released. And best of all, it’s a simple, hackable architecture. Additionally, we are releasing an inference harness that includes an efficient context parallel implementation. 

Alongside Mochi, we are open-sourcing our video AsymmVAE. We use an asymmetric encoder-decoder structure to build an efficient high quality compression model. Our AsymmVAE causally compresses videos to a 128x smaller size, with an 8x8 spatial and a 6x temporal compression to a 12-channel latent space. 

### AsymmVAE Model Specs

| Params  Count | Enc Base  Channels | Dec Base  Channels | Latent  Dim | Spatial  Compression | Temporal  Compression |
| ------------- | ------------------ | ------------------ | ----------- | -------------------- | --------------------- |
| 362M          | 64                 | 128                | 12          | 8x8                  | 6x                    |

An AsymmDiT efficiently processes user prompts alongside compressed video tokens by streamlining text processing and focusing neural network capacity on visual reasoning. AsymmDiT jointly attends to text and visual tokens with multi-modal self-attention and learns separate MLP layers for each modality, similar to Stable Diffusion 3\. However, our visual stream has nearly 4 times as many parameters as the text stream via a larger hidden dimension. To unify the modalities in self-attention, we use non-square QKV and output projection layers. This asymmetric design reduces inference memory requirements. Many modern diffusion models use multiple pretrained language models to represent user prompts. In contrast, Mochi 1 simply encodes prompts with a single T5-XXL language model.

### AsymmDiT Model Specs

| Params  Count | Num  Layers | Num  Heads | Visual  Dim | Text  Dim | Visual  Tokens | Text  Tokens |
| ------------- | ----------- | ---------- | ----------- | --------- | -------------- | ------------ |
| 10B           | 48          | 24         | 3072        | 1536      | 44520          | 256          |

## Hardware Requirements

The repository supports both multi-GPU operation (splitting the model across multiple graphics cards) and single-GPU operation, though it requires approximately 60GB VRAM when running on a single GPU. While ComfyUI can optimize Mochi to run on less than 20GB VRAM, this implementation prioritizes flexibility over memory efficiency. When using this repository, we recommend using at least 1 H100 GPU.

## Safety

Genmo video models are general text-to-video diffusion models that inherently reflect the biases and preconceptions found in their training data. While steps have been taken to limit NSFW content, organizations should implement additional safety protocols and careful consideration before deploying these model weights in any commercial services or products.

## Limitations

Under the research preview, Mochi 1 is a living and evolving checkpoint. There are a few known limitations. The initial release generates videos at 480p today. In some edge cases with extreme motion, minor warping and distortions can also occur. Mochi 1 is also optimized for photorealistic styles so does not perform well with animated content. We also anticipate that the community will fine-tune the model to suit various aesthetic preferences.

## Related Work

* ComfyUI-MochiWrapper adds ComfyUI support for Mochi. The integration of Pytorch’s SDPA attention was taken from their repository.
* mochi-xdit is a fork of this repository and improve the parallel inference speed with xDiT.

## BibTeX

```
@misc{genmo2024mochi,
      title={Mochi 1},
      author={Genmo Team},
      year={2024},
      publisher = {GitHub},
      journal = {GitHub repository},
      howpublished={\url{https://github.com/genmoai/models}}
}

```