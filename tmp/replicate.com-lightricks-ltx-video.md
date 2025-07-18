---
url: https://replicate.com/lightricks/ltx-video
title: lightricks/ltx-video | Run with an API on Replicate
description: LTX-Video is the first DiT-based video generation model capable of generating high-quality videos in real-time. It produces 24 FPS videos at a 768x512 resolution faster than they can be watched.
access_date: 2025-07-18T09:34:53.000Z
current_date: 2025-07-18T09:34:53.915Z
---

###  lightricks / ltx-video 

 LTX-Video is the first DiT-based video generation model capable of generating high-quality videos in real-time. It produces 24 FPS videos at a 768x512 resolution faster than they can be watched.

* Public
* 149K runs
* GitHub
* Weights
* License

Iterate in playground 

Run with an API 

Playground API Examples README Versions 

#### Examples

 View more 

#### Run time and cost

This model costs approximately $0.013 to run on Replicate, or 76 runs per $1, but this varies depending on your inputs. It is also open source and you can run it on your own computer with Docker.

 This model runs on Nvidia L40S GPU hardware. Predictions typically complete within 13 seconds.

#### Readme

## LTX-Video by Lightricks

This model card focuses on the model associated with the LTX-Video model, codebase available here.

LTX-Video is the first DiT-based video generation model capable of generating high-quality videos in real-time. It produces 24 FPS videos at a 768x512 resolution faster than they can be watched. Trained on a large-scale dataset of diverse videos, the model generates high-resolution videos with realistic and varied content. We provide a model for both text-to-video as well as image+text-to-video usecases

## Model Details

* **Developed by:** Lightricks
* **Model type:** Diffusion-based text-to-video and image-to-video generation model
* **Language(s):** English

## Usage

### Direct use

You can use the model for purposes under the license

### General tips:

* The model works on resolutions that are divisible by 32 and number of frames that are divisible by 8 + 1 (e.g. 257). In case the resolution or number of frames are not divisible by 32 or 8 + 1, the input will be padded with -1 and then cropped to the desired resolution and number of frames.
* The model works best on resolutions under 720 x 1280 and number of frames below 257.
* Prompts should be in English. The more elaborate the better. Good prompt looks like `The turquoise waves crash against the dark, jagged rocks of the shore, sending white foam spraying into the air. The scene is dominated by the stark contrast between the bright blue water and the dark, almost black rocks. The water is a clear, turquoise color, and the waves are capped with white foam. The rocks are dark and jagged, and they are covered in patches of green moss. The shore is lined with lush green vegetation, including trees and bushes. In the background, there are rolling hills covered in dense forest. The sky is cloudy, and the light is dim.`

### ComfyUI

To use our model with ComfyUI, please follow the instructions at a dedicated ComfyUI repo.

## Limitations

* This model is not intended or able to provide factual information.
* As a statistical model this checkpoint might amplify existing societal biases.
* The model may fail to generate videos that matches the prompts perfectly.
* Prompt following is heavily influenced by the prompting-style.