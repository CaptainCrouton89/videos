---
url: https://replicate.com/blog/wan-21-generate-videos-with-an-api
title: Wan2.1: generate videos with an API – Replicate blog
description: Wan2.1 is the most capable open-source video generation model, producing coherent and high-quality outputs. Learn how to run it in the cloud with a single line of code.
access_date: 2025-07-18T09:15:49.000Z
current_date: 2025-07-18T09:15:49.751Z
---

* Replicate
* Blog

#  Wan2.1: generate videos with an API 

Posted March 5, 2025 by 
* zeke

If you’ve been following the AI video space lately, you’ve probably noticed that it’s exploding. New models are coming out every week with better outputs, higher resolution, and faster generation speeds.

Wan2.1 is the newest and most capable open-source video model. It was released last week, and it’s topping the leaderboards.

There’s a lot to like about Wan2.1:

* It’s fast on Replicate. A 5s video takes 39s at 480p, or 150s at 720p.
* It’s open source, both the model weights and the code. The community is already building tools to enhance it.
* It produces stunning videos with real-world accuracy.
* It’s small enough to run on consumer GPUs.

In this post we’ll cover the new models and how to run them with an API.

## Model flavors

The model is available on Replicate in a number of different flavors:

* Wan 2.1 text to video, 480p – wavespeedai/wan-2.1-t2v-480p (14 billion parameters)
* Wan 2.1 image to video, 480p – wavespeedai/wan-2.1-i2v-480p (14 billion parameters)
* Wan 2.1 text to video, 720p – wavespeedai/wan-2.1-t2v-720p (14 billion parameters)
* Wan 2.1 image to video, 720p – wavespeedai/wan-2.1-i2v-720p (14 billion parameters)
* Wan 2.1 text to video, 480p – wan-video/wan-2.1-1.3b (1.3 billion parameters)

The 480p models are great for experimentation because they run faster.

Use 720p if you need a higher resolution.

The 1.3b models are smaller, and designed to run on consumer GPUs.

## Real-world accuracy

The 14b model excels at real-world physics, and you can push it to do things most other models struggle with:

* Hands: The model handles hand details well, showing individual fingers, skin textures, and details like rings.
* Drawing Animation: It turns static drawings into short video clips.
* Physics: When prompted to create a video of a giraffe hanging upside down from a tree, the model depicts the tree branch bending under the weight.
* Hair movement: In videos featuring people, the hair is rendered accurately, showing individual strands moving as people turn their heads.
* Object interactions: It can accurately render multiple objects interacting within the same space.
* Crowds: When rendering scenes with large crowds, each thing remains distinct, creating a coherent scene.

## Run Wan2.1 with an API

Every model on Replicate has a scalable cloud API, and Wan2.1 is no exception.

Here’s a code snippet for running the Wan2.1 text-to-video model using the Replicate JavaScript client:

Copy 

```
import Replicate from "replicate";

const replicate = new Replicate()
const model = "wavespeedai/wan-2.1-i2v-480p"
const input = {
  image: "https://replicate.delivery/pbxt/MZZyui7brAbh1d2AsyPtgPIByUwzSv6Uou8objC7zXEjLySc/1a8nt7yw5drm80cn05r89mjce0.png",
  prompt: "A woman is talking",
}

const output = await replicate.run(model, { input })
console.log(output)
```

The code for the _image-to-video_ model is nearly identical. Just omit the `image` input when calling the model:

Copy 

```
import Replicate from "replicate"

const replicate = new Replicate()
const model = "wavespeedai/wan-2.1-t2v-480p";
const input = {
  prompt: "A woman is talking"
}
const output = await replicate.run(model, { input })

console.log(output.url())
```

## Experiment with settings

The Wavespeed Wan2.1 models also expose a number of different settings for you to experiment with.

Try experimenting with `guide_scale`, `shift` and `steps`. We’ve found that a lower `guide_scale` and `shift` (about 4 and 2) can give lovely realistic videos.

## A community effort

This model wouldn’t exist without the work of numerous open-source contributors. We’re using WavespeedAI’s optimizations to bring you the fastest generations in the world.

Big shout-outs to Alibaba for open sourcing the model, and to @chengzeyi and @wavespeed\_ai for working with us to bring you these speeds. ⚡️

Next: Wan2.1 parameter sweep