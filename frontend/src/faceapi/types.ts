export type EmotionModel = FaceApiModel | FaceMeshModel;

export type FaceApiModel = {
    type: 'face-api';
    detectEmotion: (video: HTMLVideoElement) => Promise<string | null>;
  };

export type FaceMeshModel = {
  type: 'facemesh';
  estimateFaces: (input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) => Promise<Array<{
    scaledMesh: Array<[number, number, number]>;
  }>>;
};
  