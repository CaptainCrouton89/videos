import { z } from "zod";

export const calculateDesiredCutsSchema = z.object({
  cutRatePerMinute: z
    .number()
    .positive()
    .describe("Target cut rate in cuts per minute (e.g., 15 for 15 cuts/min)"),
  audioLenSeconds: z
    .number()
    .positive()
    .describe("Length of the audio in seconds"),
});

export async function calculateDesiredCuts(
  args: z.infer<typeof calculateDesiredCutsSchema>
) {
  const { cutRatePerMinute, audioLenSeconds } = args;

  const desiredCuts = (cutRatePerMinute * audioLenSeconds) / 60.0;

  const result = {
    desiredCuts,
    desiredCutsRounded: Math.round(desiredCuts),
    desiredCutsCeiling: Math.ceil(desiredCuts),
    audioLenMinutes: audioLenSeconds / 60,
    message: `For ${audioLenSeconds} seconds of audio at ${cutRatePerMinute} cuts/min: ${desiredCuts.toFixed(2)} cuts (rounded: ${Math.round(desiredCuts)}, ceiling: ${Math.ceil(desiredCuts)})`,
  };

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}