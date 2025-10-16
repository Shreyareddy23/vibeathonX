import * as faceapi from 'face-api.js';
import { FaceApiModel } from './types';

// Use the same CDN as Game.tsx
const MODEL_CDN_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

export async function loadFaceApi(): Promise<FaceApiModel> {
  // Load only the required models
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_CDN_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_CDN_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_CDN_URL);

  return {
    type: 'face-api',
    detectEmotion: async (video: HTMLVideoElement) => {
      try {
        if (!video || video.readyState < 2) {
          return null;
        }
        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5
        });
        const result = await faceapi
          .detectSingleFace(video, options)
          .withFaceExpressions();
        if (!result?.expressions) {
          return null;
        }
        const expressions = result.expressions;
        const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          const [emotion] = sorted[0];
          return emotion;
        }
        return null;
      } catch (error) {
        console.error('Error detecting emotion:', error);
        return null;
      }
    }
  };
}
