// Face detection in the browser with face-api.js (models live in /public/models).
// The studio scans event photos once and sends only face positions + descriptors to the server;
// guests use the same detector on their selfie.

import type * as FaceApiModule from "face-api.js";
import { cloudinaryUrl } from "./events";

type FaceApi = typeof FaceApiModule;

export interface FaceBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DetectedFace {
  box: FaceBox; // fractions of the photo's width/height
  descriptor: number[];
}

export interface Person {
  personId: string;
  photoCount: number;
  coverPublicId: string;
  coverBox: FaceBox;
}

let loader: Promise<FaceApi> | null = null;

// Loads face-api.js and its models once per page
export const loadFaceApi = () => {
  loader ??= (async () => {
    const faceapi = await import("face-api.js");
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    ]);
    return faceapi;
  })().catch((error) => {
    loader = null;
    throw error;
  });
  return loader;
};

// Faces smaller than this share of the photo width are background crowd; skip them
const MIN_FACE_WIDTH = 0.035;

export const detectFaces = async (input: HTMLImageElement | HTMLCanvasElement): Promise<DetectedFace[]> => {
  const faceapi = await loadFaceApi();
  const width = input instanceof HTMLImageElement ? input.naturalWidth : input.width;
  const height = input instanceof HTMLImageElement ? input.naturalHeight : input.height;

  const results = await faceapi
    .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  return results
    .map((r) => {
      const b = r.detection.box;
      return {
        box: { x: b.x / width, y: b.y / height, w: b.width / width, h: b.height / height },
        // 4 decimals is plenty for matching and keeps uploads small
        descriptor: Array.from(r.descriptor, (v) => Math.round(v * 10000) / 10000),
      };
    })
    .filter((f) => f.box.w >= MIN_FACE_WIDTH);
};

export const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });

// A 1200px copy is enough to find faces and much faster than the original
export const scanPhoto = async (url: string) => detectFaces(await loadImage(cloudinaryUrl(url, "c_limit,w_1200,q_auto")));

// CSS for an <img> that shows just the face area of a photo inside a square box.
// aspect = photo width / height (from the loaded image).
export const faceCropStyle = (box: FaceBox, aspect: number, padding = 0.7): React.CSSProperties => {
  // Square side as a share of the photo's width (sw) and height (sh)
  const sw = Math.min(1, Math.max(box.w, box.h / aspect) * (1 + padding));
  const sh = Math.min(1, sw * aspect);
  const cx = Math.min(1 - sw / 2, Math.max(sw / 2, box.x + box.w / 2));
  const cy = Math.min(1 - sh / 2, Math.max(sh / 2, box.y + box.h / 2));
  return {
    position: "absolute",
    width: `${100 / sw}%`,
    height: `${100 / sh}%`,
    maxWidth: "none",
    left: `${(-(cx - sw / 2) / sw) * 100}%`,
    top: `${(-(cy - sh / 2) / sh) * 100}%`,
  };
};
