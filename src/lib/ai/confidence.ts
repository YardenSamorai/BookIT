import type { DataQuality } from "./types";

export interface ConfidenceFactors {
  sampleSize: number;
  minSampleRequired: number;
  consistencyWeeks: number;
  totalWeeksObserved: number;
  recencyWeight: number;
  dataCompleteness: number;
}

export function computeConfidence(f: ConfidenceFactors): number {
  if (f.sampleSize < f.minSampleRequired) return 0;

  const sampleScore = Math.min(1, f.sampleSize / (f.minSampleRequired * 3));
  const consistencyScore =
    f.totalWeeksObserved > 0
      ? f.consistencyWeeks / f.totalWeeksObserved
      : 0;

  return (
    sampleScore * 0.3 +
    consistencyScore * 0.3 +
    f.recencyWeight * 0.2 +
    f.dataCompleteness * 0.2
  );
}

/**
 * Computes effect size as a 0-1 score.
 * Returns 0 if the deviation is below the minimum meaningful delta.
 */
export function computeEffectSize(
  observed: number,
  baseline: number,
  minMeaningfulDelta: number,
  maxDelta: number,
): number {
  const delta = Math.abs(observed - baseline);
  if (delta < minMeaningfulDelta) return 0;
  if (maxDelta <= minMeaningfulDelta) return 1;
  return Math.min(1, (delta - minMeaningfulDelta) / (maxDelta - minMeaningfulDelta));
}

export function toDataQuality(confidence: number): DataQuality {
  if (confidence >= 0.7) return "strong";
  if (confidence >= 0.45) return "moderate";
  if (confidence > 0) return "weak";
  return "insufficient";
}
