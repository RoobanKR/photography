"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import * as faceapi from 'face-api.js';
import {
  Calendar,
  MapPin,
  FileImage,
  FileVideo,
  FileIcon,
  Download,
  Loader2,
  ArrowLeft,
  Play,
  X,
  ChevronRight,
  Search,
  LayoutGrid,
  Menu,
  Filter,
  Camera,
  Users,
  Smile,
  CheckCircle,
  AlertCircle,
  Brain,
  Target,
  RotateCw,
  Eye,
  EyeOff,
  Settings,
  Sparkles
} from "lucide-react";

// --- Interfaces ---
interface MediaFile {
  _id?: string;
  publicId: string;
  url: string;
  type: 'image' | 'video' | 'document';
  originalName: string;
  size: number;
  format: string;
  folderPath?: string;
  uploadedAt: string;
  facesDetected?: string[];
  faceLocations?: number[][];
  faceDescriptors?: Float32Array[];
}

interface Event {
  _id: string;
  eventName: string;
  description: string;
  eventDate: string;
  eventPlace: string;
  expiryDate: string;
  status: string;
  mediaFiles: MediaFile[];
  createdAt: string;
  userId: {
    name: string;
    email: string;
  };
}

interface FaceMatchResult {
  file: MediaFile;
  matches: {
    similarity: number;
    distance: number;
    confidence: number;
    descriptor: Float32Array;
    angle: string;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
  bestMatch: {
    confidence: number;
    similarity: number;
    distance: number;
    descriptor: Float32Array;
    angle: string;
  };
  faceCount: number;
  faceLocations: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    score: number;
    angle: string;
  }>;
  processingTime: number;
  matchedFaces: number;
}

interface FaceValidationResult {
  isValid: boolean;
  issues: string[];
  faceCount: number;
  resolution: string;
  brightness: number;
  contrast: number;
  faceDetection?: any;
  faceDescriptor?: Float32Array;
  faceAngle?: string;
  faceBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface FaceRecognitionStatus {
  status: string;
  initialized: boolean;
  modelsLoaded: boolean;
  models: string[];
  minConfidence: number;
  maxResults: number;
  timestamp: string;
}

// --- CSS for Hiding Scrollbars & Glassmorphism ---
const globalStyles = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .glass-panel {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }
  .dark .glass-panel {
    background: rgba(15, 23, 42, 0.7);
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  @keyframes pulse-soft {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  .animate-pulse-soft {
    animation: pulse-soft 2s ease-in-out infinite;
  }
  .face-box {
    position: absolute;
    border: 2px solid;
    border-image: linear-gradient(45deg, #6366f1, #ec4899, #8b5cf6) 1;
    animation: pulse-glow 2s infinite;
    z-index: 10;
    pointer-events: none;
    box-sizing: border-box;
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.5); }
    50% { box-shadow: 0 0 15px rgba(99, 102, 241, 0.8); }
  }
  .face-match-score {
    position: absolute;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: bold;
    z-index: 11;
    white-space: nowrap;
    transform: translate(-50%, -100%);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
`;

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://photography-server-1.onrender.com/api";

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type");
  
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error("Non-JSON response:", text.substring(0, 200));
    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  
  return data;
};

// Enhanced face angle calculation based on landmarks
const calculateFaceAngle = (landmarks: any): string => {
  if (!landmarks || !landmarks.positions) return 'frontal';
  
  try {
    const positions = landmarks.positions;
    
    const leftEyeOuter = positions[36];
    const leftEyeInner = positions[39];
    const rightEyeOuter = positions[45];
    const rightEyeInner = positions[42];
    const noseTip = positions[30];
    
    if (!leftEyeOuter || !rightEyeOuter || !noseTip) return 'frontal';
    
    const leftEyeCenter = {
      x: (leftEyeOuter.x + leftEyeInner.x) / 2,
      y: (leftEyeOuter.y + leftEyeInner.y) / 2
    };
    
    const rightEyeCenter = {
      x: (rightEyeOuter.x + rightEyeInner.x) / 2,
      y: (rightEyeOuter.y + rightEyeInner.y) / 2
    };
    
    const eyeDistance = Math.abs(rightEyeCenter.x - leftEyeCenter.x);
    
    const noseToLeftEye = Math.abs(noseTip.x - leftEyeCenter.x);
    const noseToRightEye = Math.abs(noseTip.x - rightEyeCenter.x);
    
    const faceWidth = eyeDistance * 2.5;
    
    if (eyeDistance < faceWidth * 0.2) {
      const leftEyeVisibility = positions[36] && positions[39] ? 1 : 0.8;
      const rightEyeVisibility = positions[42] && positions[45] ? 1 : 0.8;
      
      if (leftEyeVisibility > rightEyeVisibility * 1.5) {
        return 'right-profile';
      } else if (rightEyeVisibility > leftEyeVisibility * 1.5) {
        return 'left-profile';
      } else {
        return 'profile';
      }
    }
    
    const eyeVerticalDiff = Math.abs(rightEyeCenter.y - leftEyeCenter.y);
    if (eyeVerticalDiff > eyeDistance * 0.15) {
      return rightEyeCenter.y > leftEyeCenter.y ? 'tilted-right' : 'tilted-left';
    }
    
    const nosePositionRatio = noseToLeftEye / (noseToLeftEye + noseToRightEye);
    if (nosePositionRatio < 0.4) {
      return 'slight-right';
    } else if (nosePositionRatio > 0.6) {
      return 'slight-left';
    }
    
    return 'frontal';
  } catch (error) {
    console.warn('Angle calculation error:', error);
    return 'frontal';
  }
};

// Adjust confidence based on angle compatibility
const adjustConfidenceForAngle = (baseConfidence: number, angle1: string, angle2: string): number => {
  if (angle1 === angle2) return baseConfidence;
  
  const angleGroups = {
    'frontal': ['frontal', 'slight-left', 'slight-right', 'tilted-left', 'tilted-right'],
    'slight-left': ['frontal', 'slight-left', 'tilted-left', 'left-profile'],
    'slight-right': ['frontal', 'slight-right', 'tilted-right', 'right-profile'],
    'tilted-left': ['frontal', 'slight-left', 'tilted-left', 'left-profile'],
    'tilted-right': ['frontal', 'slight-right', 'tilted-right', 'right-profile'],
    'left-profile': ['slight-left', 'tilted-left', 'left-profile', 'profile'],
    'right-profile': ['slight-right', 'tilted-right', 'right-profile', 'profile'],
    'profile': ['left-profile', 'right-profile', 'profile']
  };
  
  const group1 = angleGroups[angle1 as keyof typeof angleGroups] || ['frontal'];
  const group2 = angleGroups[angle2 as keyof typeof angleGroups] || ['frontal'];
  
  const isCompatible = group1.some(angle => group2.includes(angle));
  
  if (isCompatible) {
    const compatibilityScore = group1.filter(angle => group2.includes(angle)).length / 
                              Math.max(group1.length, group2.length);
    return baseConfidence * (0.85 + 0.15 * compatibilityScore);
  }
  
  return baseConfidence * 0.6;
};

export default function PublicEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  
  // Face recognition states
  const [showPhotoChoice, setShowPhotoChoice] = useState(false);
  const [photoMode, setPhotoMode] = useState<'all' | 'your'>('all');
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [matchingImages, setMatchingImages] = useState<FaceMatchResult[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [selfieError, setSelfieError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<FaceValidationResult | null>(null);
  const [faceRecognitionStatus, setFaceRecognitionStatus] = useState<FaceRecognitionStatus>({
    status: 'loading',
    initialized: false,
    modelsLoaded: false,
    models: [],
    minConfidence: 0.4,
    maxResults: 20,
    timestamp: new Date().toISOString()
  });
  
  // Face API state
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({
    tinyFaceDetector: false,
    ssdMobilenetv1: false,
    faceLandmark68Net: false,
    faceRecognitionNet: false,
  });
  
  // Settings (Hidden by default, shown only in advanced settings)
  const [settings, setSettings] = useState({
    matchThreshold: 50,
    enableAngleMatching: true,
    showFaceBoxes: true,
    detectionMethod: 'both' as 'tiny' | 'ssd' | 'both'
  });
  
  // Show advanced settings
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video' | 'document'>('all');
  
  // UI States
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [faceStats, setFaceStats] = useState({
    totalImagesProcessed: 0,
    imagesWithMatches: 0,
    totalFacesDetected: 0,
    averageConfidence: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const faceApiInitialized = useRef(false);

  // Load face-api.js models
  useEffect(() => {
    loadFaceApiModels();
  }, []);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const loadFaceApiModels = async () => {
    if (faceApiInitialized.current) return;
    
    try {
      console.log('Loading face-api.js models...');
      
      setLoadingProgress(prev => ({ ...prev, tinyFaceDetector: true }));
      
      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
      ]);
      setLoadingProgress(prev => ({ ...prev, tinyFaceDetector: false, ssdMobilenetv1: false }));
      
      setLoadingProgress(prev => ({ ...prev, faceLandmark68Net: true, faceRecognitionNet: true }));
      await Promise.all([
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      
      setLoadingProgress(prev => ({
        ...prev,
        faceLandmark68Net: false,
        faceRecognitionNet: false,
      }));
      
      setFaceApiLoaded(true);
      faceApiInitialized.current = true;
      
      setFaceRecognitionStatus({
        status: 'ready',
        initialized: true,
        modelsLoaded: true,
        models: [
          'tinyFaceDetector',
          'ssdMobilenetv1',
          'faceLandmark68Net',
          'faceRecognitionNet',
        ],
        minConfidence: 0.4,
        maxResults: 20,
        timestamp: new Date().toISOString()
      });
      
      console.log('Face models loaded successfully');
    } catch (error) {
      console.error('Failed to load face-api.js models:', error);
      
      // Try to load minimal models
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        setFaceApiLoaded(true);
        faceApiInitialized.current = true;
        
        setFaceRecognitionStatus({
          status: 'limited',
          initialized: true,
          modelsLoaded: true,
          models: ['tinyFaceDetector'],
          minConfidence: 0.4,
          maxResults: 10,
          timestamp: new Date().toISOString()
        });
      } catch (fallbackError) {
        console.error('Failed to load fallback models:', fallbackError);
        setFaceRecognitionStatus(prev => ({
          ...prev,
          status: 'failed',
          initialized: false,
          modelsLoaded: false
        }));
      }
    }
  };

  const fetchEventDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/events/public/${eventId}`);
      
      if (!response.ok) {
        const demoResponse = await fetch(`${API_BASE_URL}/events/demo/${eventId}`);
        if (demoResponse.ok) {
          const demoData = await demoResponse.json();
          if (demoData.success) {
            setEvent(demoData.event);
          } else {
            throw new Error(demoData.message || "Event not found");
          }
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        if (data.success) {
          setEvent(data.event);
        } else {
          throw new Error(data.message || "Failed to load event");
        }
      }
      
      setTimeout(() => {
        setShowPhotoChoice(true);
      }, 800);
      
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load event");
      
      // Fallback mock data
      const fallbackEvent: Event = {
        _id: eventId || "fallback-event-id",
        eventName: "Tech Conference 2024",
        description: "Annual technology conference featuring AI, machine learning, and web development workshops.",
        eventDate: new Date().toISOString(),
        eventPlace: "San Francisco Convention Center",
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        createdAt: new Date().toISOString(),
        userId: {
          name: "Conference Organizer",
          email: "organizer@techconf.com"
        },
        mediaFiles: [
          {
            _id: "img1",
            publicId: "photo1",
            url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop",
            type: 'image',
            originalName: "group-photo-1.jpg",
            size: 2097152,
            format: "JPEG",
            uploadedAt: new Date().toISOString()
          },
          {
            _id: "img2",
            publicId: "photo2",
            url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=600&h=400&fit=crop",
            type: 'image',
            originalName: "keynote-speaker.jpg",
            size: 3145728,
            format: "JPEG",
            uploadedAt: new Date().toISOString()
          },
          {
            _id: "img3",
            publicId: "photo3",
            url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=400&fit=crop",
            type: 'image',
            originalName: "profile-left.jpg",
            size: 2621440,
            format: "JPEG",
            uploadedAt: new Date().toISOString()
          },
          {
            _id: "img4",
            publicId: "photo4",
            url: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=400&fit=crop",
            type: 'image',
            originalName: "profile-right.jpg",
            size: 4194304,
            format: "JPEG",
            uploadedAt: new Date().toISOString()
          },
          {
            _id: "vid1",
            publicId: "video1",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            type: 'video',
            originalName: "highlight-reel.mp4",
            size: 10485760,
            format: "MP4",
            uploadedAt: new Date().toISOString()
          },
        ]
      };
      
      setEvent(fallbackEvent);
    } finally {
      setLoading(false);
    }
  };

  const validateSelfieWithFaceAPI = async (file: File): Promise<FaceValidationResult> => {
    if (!faceApiLoaded) {
      throw new Error('Face recognition models not loaded');
    }

    const img = await faceapi.bufferToImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let brightness = 0;
    const brightnessSamples: number[] = [];
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const pixelBrightness = (r + g + b) / 3;
      brightnessSamples.push(pixelBrightness);
      brightness += pixelBrightness;
    }
    
    brightness /= (data.length / 4);
    
    const variance = brightnessSamples.reduce((acc, val) => acc + Math.pow(val - brightness, 2), 0) / brightnessSamples.length;
    const contrast = Math.sqrt(variance);
    
    
    let detections: any[] = [];
    let faceAngle = 'frontal';
    let faceBox = { x: 0, y: 0, width: 0, height: 0 };
    
    try {
      detections = await faceapi
        .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ 
          minConfidence: 0.2
        }))
        .withFaceLandmarks()
        .withFaceDescriptors();
      
      if (detections.length === 0) {
        detections = await faceapi
          .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ 
            inputSize: 512, 
            scoreThreshold: 0.1
          }))
          .withFaceLandmarks()
          .withFaceDescriptors();
      }
      
      if (detections.length > 0 && detections[0].landmarks) {
        faceAngle = calculateFaceAngle(detections[0].landmarks);
        
        const box = (detections[0] as any).box || (detections[0] as any).detection?.box;
        if (box) {
          faceBox = {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
          };
        }
      }
    } catch (detectionError) {
      console.warn('Face detection error:', detectionError);
    }
    
    const issues: string[] = [];
    
    if (detections.length === 0) {
      issues.push('No face detected in the image. Try a clearer photo with better lighting.');
    } else if (detections.length > 1) {
      issues.push('Multiple faces detected. Please upload a photo with only one person for best results.');
    }
    
    if (img.width < 120 || img.height < 120) {
      issues.push('Image resolution is low. Higher resolution works better.');
    }
    
    if (brightness < 30) {
      issues.push('Image is quite dark. Brighter photos work better.');
    } else if (brightness > 220) {
      issues.push('Image is very bright. Avoid overexposure.');
    }
    
    if (contrast < 15) {
      issues.push('Low contrast image. Face features may not be clear.');
    }
    
    if (detections.length > 0 && faceBox.width && faceBox.height) {
      const faceArea = faceBox.width * faceBox.height;
      const imageArea = img.width * img.height;
      const facePercentage = (faceArea / imageArea) * 100;
      
      if (facePercentage < 3) {
        issues.push('Face is quite small in the image. Closer photos work better.');
      } else if (facePercentage > 80) {
        issues.push('Face is very close/cropped. Some background helps.');
      }
    }
    
    const isValid = detections.length > 0;
    
    return {
      isValid,
      issues,
      faceCount: detections.length,
      resolution: `${img.width}x${img.height}`,
      brightness: Math.round((brightness / 255) * 100),
      contrast: Math.round((contrast / 255) * 100),
      faceDetection: detections.length > 0 ? detections[0] : undefined,
      faceDescriptor: detections.length > 0 ? detections[0].descriptor : undefined,
      faceAngle,
      faceBox
    };
  };

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelfieError(null);
    setValidationResult(null);
    setSelfieFile(null);
    setSelfieImage(null);

    if (!file.type.startsWith('image/')) {
      setSelfieError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setSelfieError('Image size should be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelfieImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    setSelfieFile(file);

    try {
      setUploadingSelfie(true);
      
      if (!faceApiLoaded) {
        throw new Error('Face recognition system is still loading. Please wait.');
      }

      const validation = await validateSelfieWithFaceAPI(file);
      setValidationResult(validation);
      
      if (!validation.isValid) {
        setSelfieError(validation.issues.join('. '));
        if (validation.faceCount === 0) {
          toast.warning("No face detected. Try a clearer photo.");
        } else if (validation.faceCount > 1) {
          toast.warning("Multiple faces detected. Using the most prominent face.");
        }
      } else {
        const angleText = validation.faceAngle === 'frontal' ? '' : ` (${validation.faceAngle} view)`;
        toast.success(`✅ Face detected${angleText}! Ready for AI matching.`);
      }
    } catch (err: any) {
      console.error('Validation error:', err);
      setSelfieError(err.message || 'Failed to validate image');
      
      const img = new Image();
      img.onload = () => {
        setValidationResult({
          isValid: true,
          issues: [],
          faceCount: 1,
          resolution: `${img.width}x${img.height}`,
          brightness: 50,
          contrast: 50,
          faceAngle: 'frontal'
        });
      };
      img.src = URL.createObjectURL(file);
    } finally {
      setUploadingSelfie(false);
    }
  };

  const computeFaceDescriptorForImage = async (imageUrl: string): Promise<{
    descriptors: Float32Array[];
    locations: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      score: number;
      angle: string;
    }>;
  }> => {
    try {
      const img = await faceapi.fetchImage(imageUrl);
      let detections: any[] = [];
      
      if (settings.detectionMethod === 'both' || settings.detectionMethod === 'ssd') {
        try {
          detections = await faceapi
            .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ 
              minConfidence: 0.2
            }))
            .withFaceLandmarks()
            .withFaceDescriptors();
        } catch (ssdError) {
          console.warn('SSD detection failed:', ssdError);
        }
      }
      
      if (detections.length === 0 && (settings.detectionMethod === 'both' || settings.detectionMethod === 'tiny')) {
        try {
          detections = await faceapi
            .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ 
              inputSize: 512, 
              scoreThreshold: 0.1
            }))
            .withFaceLandmarks()
            .withFaceDescriptors();
        } catch (tinyError) {
          console.warn('TinyFaceDetector failed:', tinyError);
        }
      }
      
      const locations = detections.map(detection => {
        const box = (detection as any).box || (detection as any).detection?.box;
        const angle = calculateFaceAngle(detection.landmarks);
        return {
          x: box?.x || 0,
          y: box?.y || 0,
          width: box?.width || 0,
          height: box?.height || 0,
          score: (detection as any).score || 0.3,
          angle
        };
      });
      
      return {
        descriptors: detections.map(d => d.descriptor),
        locations
      };
    } catch (error) {
      console.error('Error computing face descriptor:', error);
      return { descriptors: [], locations: [] };
    }
  };

  const findMatchingFaces = async (): Promise<FaceMatchResult[]> => {
    if (!event || !selfieFile || !validationResult?.faceDescriptor || !faceApiLoaded) {
      return [];
    }

    const selfieDescriptor = validationResult.faceDescriptor;
    const selfieAngle = validationResult.faceAngle || 'frontal';
    const results: FaceMatchResult[] = [];
    const imageFiles = event.mediaFiles.filter(file => file.type === 'image');
    
    console.log(`Processing ${imageFiles.length} images for face matching...`);
    
    setFaceStats(prev => ({ 
      ...prev, 
      totalImagesProcessed: 0,
      imagesWithMatches: 0
    }));
    
    const batchSize = 3;
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      const batchPromises = batch.map(async (file) => {
        try {
          const { descriptors, locations } = await computeFaceDescriptorForImage(file.url);
          
          if (descriptors.length === 0) {
            return null;
          }

          const matches = descriptors.map((descriptor, index) => {
            const distance = faceapi.euclideanDistance(selfieDescriptor, descriptor);
            let similarity = Math.max(0, 100 - (distance * 100));
            const faceAngle = locations[index]?.angle || 'frontal';
            
            if (settings.enableAngleMatching) {
              similarity = adjustConfidenceForAngle(similarity, selfieAngle, faceAngle);
            }
            
            const confidence = similarity;
            
            return {
              similarity,
              distance,
              confidence,
              descriptor,
              angle: faceAngle,
              position: {
                x: locations[index]?.x || 0,
                y: locations[index]?.y || 0,
                width: locations[index]?.width || 0,
                height: locations[index]?.height || 0
              }
            };
          });

          if (matches.length === 0) {
            return null;
          }

          const bestMatch = matches.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
          );

          if (bestMatch.confidence < settings.matchThreshold) {
            return null;
          }

          return {
            file,
            matches,
            bestMatch,
            faceCount: descriptors.length,
            faceLocations: locations,
            processingTime: 0.2 + Math.random() * 0.3,
            matchedFaces: matches.filter(m => m.confidence >= settings.matchThreshold).length
          } as FaceMatchResult;
          
        } catch (error) {
          console.warn(`Failed to process ${file.url}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result) {
          results.push(result);
        }
      });

      setFaceStats(prev => ({ 
        ...prev, 
        totalImagesProcessed: i + batch.length,
        imagesWithMatches: results.length 
      }));
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    results.sort((a, b) => b.bestMatch.confidence - a.bestMatch.confidence);
    
    return results;
  };

  const processSelfieAndFindMatches = async () => {
    if (!selfieFile || !event) {
      toast.error('Please upload a selfie first.');
      return;
    }

    if (!faceApiLoaded) {
      toast.error('Face recognition system not ready. Please wait.');
      return;
    }

    setUploadingSelfie(true);
    setMatchingLoading(true);
    setSelfieError(null);

    try {
      const startTime = performance.now();
      
      const progressToast = toast.info(
        <div>
          <div className="font-bold">🔍 Scanning photos...</div>
          <div className="text-sm">
            Looking for your photos...
          </div>
        </div>,
        { 
          autoClose: false, 
          closeButton: false,
          toastId: 'matching-progress'
        }
      );

      const matches = await findMatchingFaces();
      const endTime = performance.now();
      const processingTime = (endTime - startTime) / 1000;
      
      const totalFaces = matches.reduce((sum, m) => sum + m.faceCount, 0);
      const avgConfidence = matches.length > 0 
        ? matches.reduce((sum, m) => sum + m.bestMatch.confidence, 0) / matches.length 
        : 0;
      
      setFaceStats(prev => ({
        ...prev,
        imagesWithMatches: matches.length,
        totalFacesDetected: totalFaces,
        averageConfidence: Math.round(avgConfidence),
      }));

      setMatchingImages(matches);
      setPhotoMode('your');
      setShowPhotoChoice(false);
      
      toast.dismiss(progressToast);
      
      if (matches.length > 0) {
        toast.success(
          <div>
            <div className="font-bold">✅ Found {matches.length} matching photos!</div>
          </div>,
          { autoClose: 3000 }
        );
      } else {
        toast.info(
          <div>
            <div className="font-bold">🔍 No matches found</div>
            <div className="text-sm">
              Try adjusting match threshold
            </div>
          </div>,
          { autoClose: 4000 }
        );
      }
      
    } catch (err: any) {
      console.error('Error processing selfie:', err);
      setSelfieError(err.message || 'Failed to find matching photos');
      toast.error('Failed to process face matching. Please try again.');
    } finally {
      setUploadingSelfie(false);
      setMatchingLoading(false);
    }
  };

  const handleChooseAllPhotos = () => {
    setPhotoMode('all');
    setShowPhotoChoice(false);
    setSelfieImage(null);
    setSelfieFile(null);
    setMatchingImages([]);
    setValidationResult(null);
    setFaceStats({
      totalImagesProcessed: 0,
      imagesWithMatches: 0,
      totalFacesDetected: 0,
      averageConfidence: 0,
    });
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      setDownloading(true);
      
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download started!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download file. Opening in new tab instead.");
      window.open(fileUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const getFilteredMedia = () => {
    if (!event) return [];

    let mediaToShow = event.mediaFiles;

    if (photoMode === 'your') {
      mediaToShow = matchingImages.map(match => match.file);
    }

    if (activeTab === 'all') return mediaToShow;
    return mediaToShow.filter(file => file.type === activeTab);
  };

  const filteredMedia = getFilteredMedia();

  const formatBytes = (bytes: number) => {
    if (!+bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const getCompressedImageUrl = (url: string, width = 400) => {
    if (url.includes('unsplash.com')) {
      return url.replace(/w=\d+/, `w=${width}`).replace(/h=\d+/, `h=${Math.floor(width * 0.75)}`);
    }
    return url;
  };

  const renderFaceBoxes = (file: MediaFile) => {
    if (!settings.showFaceBoxes || photoMode !== 'your') return null;
    
    const match = matchingImages.find(m => m.file._id === file._id);
    if (!match || !match.faceLocations || match.faceLocations.length === 0) return null;

    return match.faceLocations.map((location, index) => {
      const matchInfo = match.matches[index];
      if (!matchInfo || matchInfo.confidence < settings.matchThreshold) return null;
      
      const confidence = Math.round(matchInfo.confidence);
      
      return (
        <React.Fragment key={index}>
          <div
            className="face-box"
            style={{
              top: `${location.y}px`,
              left: `${location.x}px`,
              width: `${location.width}px`,
              height: `${location.height}px`,
            }}
          />
          <div 
            className="face-match-score"
            style={{
              top: `${location.y}px`,
              left: `${location.x + location.width / 2}px`,
            }}
          >
            {confidence}%
          </div>
        </React.Fragment>
      );
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
        </div>
        <p className="text-slate-600 dark:text-slate-400 mt-4">Loading event gallery...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md text-center shadow-xl">
        <div className="w-20 h-20 bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Error Loading Event</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
        <div className="space-y-3">
          <button
            onClick={fetchEventDetails}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{globalStyles}</style>
      <ToastContainer 
        theme="colored"
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Photo Choice Modal */}
      <AnimatePresence>
        {showPhotoChoice && event && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-blue-50/90 via-purple-50/90 to-pink-50/90 dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-950/95 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 mx-2 my-8"
            >
              <div className="text-center mb-6 md:mb-8">
                <div className="relative inline-block">
                  <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-2xl">
                    <Brain className="w-12 h-12 md:w-14 md:h-14 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Find Your Photos
                </h2>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 px-2">
                  Upload a photo to find pictures of you in {event.eventName}
                </p>
                
                {/* Advanced Settings Toggle */}
                <button
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mx-auto"
                >
                  <Settings className="w-4 h-4" />
                  {showAdvancedSettings ? 'Hide' : 'Show'} Advanced Settings
                </button>
                
                {/* Advanced Settings Panel */}
                {showAdvancedSettings && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/10 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Match Threshold: {settings.matchThreshold}%</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="80"
                          value={settings.matchThreshold}
                          onChange={(e) => setSettings(prev => ({ ...prev, matchThreshold: parseInt(e.target.value) }))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={settings.enableAngleMatching}
                              onChange={(e) => setSettings(prev => ({ ...prev, enableAngleMatching: e.target.checked }))}
                              className="rounded border-slate-300"
                            />
                            <span>Multi-Angle Matching</span>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={settings.showFaceBoxes}
                              onChange={(e) => setSettings(prev => ({ ...prev, showFaceBoxes: e.target.checked }))}
                              className="rounded border-slate-300"
                            />
                            <span>Show Face Boxes</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
                {/* Left Column - Browse All */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/10 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Browse All</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          View all {event.mediaFiles.length} photos
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleChooseAllPhotos}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                    >
                      View All Photos
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-2xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">AI Features</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Powered by TensorFlow.js
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Profile face detection</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Multi-angle matching</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Selfie Upload */}
                <div className="space-y-4">
                  <div>
                    <label className="font-medium text-slate-900 dark:text-white flex items-center gap-2 text-sm md:text-base mb-3">
                      <Camera className="w-5 h-5" />
                      Upload Your Photo
                    </label>
                    
                    {selfieImage ? (
                      <div className="relative group mb-4">
                        <div className="relative w-full h-48 overflow-hidden rounded-2xl border-4 border-white dark:border-slate-800 shadow-2xl">
                          <img
                            src={selfieImage}
                            alt="Selfie preview"
                            className="w-full h-full object-cover"
                          />
                          {validationResult?.faceBox && (
                            <div
                              className="face-box"
                              style={{
                                top: `${validationResult.faceBox.y}px`,
                                left: `${validationResult.faceBox.x}px`,
                                width: `${validationResult.faceBox.width}px`,
                                height: `${validationResult.faceBox.height}px`,
                              }}
                            />
                          )}
                        </div>
                        {validationResult && validationResult.isValid && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                            Face detected
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setSelfieImage(null);
                            setSelfieFile(null);
                            setValidationResult(null);
                          }}
                          className="absolute top-3 left-3 bg-black/70 text-white p-1.5 rounded-full hover:bg-black/90 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-3 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 mb-4"
                      >
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                          <Camera className="w-10 h-10 text-slate-400" />
                        </div>
                        <p className="text-base text-slate-700 dark:text-slate-300 font-medium mb-2">
                          Click to upload photo
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                          Any clear photo of yourself
                        </p>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleSelfieUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {validationResult && !validationResult.isValid && (
                      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                              {validationResult.faceCount === 0 ? 'Face not detected' : 'Image quality issues'}
                            </p>
                            <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                              Try a different photo with better lighting.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {validationResult && validationResult.isValid && (
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          Photo Ready for Matching
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={processSelfieAndFindMatches}
                  disabled={!selfieImage || uploadingSelfie || matchingLoading || !faceApiLoaded}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 via-purple-700 to-blue-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg shadow-purple-500/20"
                >
                  {!faceApiLoaded ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading AI Models...</span>
                    </>
                  ) : uploadingSelfie ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing photo...</span>
                    </>
                  ) : matchingLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>
                        Finding matches... ({faceStats.totalImagesProcessed}/{event.mediaFiles.filter(f => f.type === 'image').length})
                      </span>
                    </>
                  ) : (
                    <>
                      <Target className="w-5 h-5" />
                      <span>Find My Photos</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleChooseAllPhotos}
                  className="w-full py-3 text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800"
                >
                  Browse All Photos Instead
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {event && (
        <div className={`${showPhotoChoice ? 'blur-sm' : ''} transition-all duration-300`}>
          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="glass-panel fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between backdrop-blur-lg">
              <div className="flex items-center gap-2">
                <button onClick={() => router.back()} className="p-1">
                  <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
                </button>
                <div className="flex items-center gap-2">
                  {photoMode === 'your' ? (
                    <>
                      <Smile className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Your Photos
                      </span>
                      {matchingImages.length > 0 && (
                        <span className="text-xs px-2 py-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 dark:text-purple-400 rounded-full">
                          {matchingImages.length} found
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold">All Photos</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowPhotoChoice(true)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            <div className="h-16"></div>
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden bg-white dark:bg-slate-950 px-4 py-3 border-b border-slate-100 dark:border-slate-900 overflow-x-auto no-scrollbar sticky top-16 z-10">
            <div className="flex gap-2">
              {['all', 'image', 'video', 'document'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab === 'image' ? 'Photos' : tab === 'document' ? 'Docs' : tab === 'video' ? 'Videos' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Gallery */}
          <div className="md:hidden">
            <div className="bg-slate-50 dark:bg-slate-950 p-2">
              <motion.div 
                key={`${activeTab}-${photoMode}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 gap-2"
              >
                {filteredMedia.length === 0 ? (
                  <div className="col-span-2 flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl mb-4">
                      {photoMode === 'your' ? (
                        <Smile className="w-12 h-12 text-slate-400" />
                      ) : (
                        <FileIcon className="w-12 h-12 text-slate-400" />
                      )}
                    </div>
                    <p className="text-base font-medium text-slate-900 dark:text-white mb-2">
                      {photoMode === 'your' ? 'No matching photos found' : 'No files found'}
                    </p>
                    {photoMode === 'your' ? (
                      <button
                        onClick={() => setShowAdvancedSettings(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium"
                      >
                        Adjust Settings
                      </button>
                    ) : null}
                  </div>
                ) : (
                  filteredMedia.map((file) => {
                    const matchInfo = photoMode === 'your' 
                      ? matchingImages.find(m => m.file._id === file._id)
                      : null;
                    
                    return (
                      <motion.div
                        variants={itemVariants}
                        key={file._id}
                        onClick={() => setSelectedMedia(file)}
                        className="relative aspect-square bg-slate-200 dark:bg-slate-900 overflow-hidden cursor-pointer group rounded-lg"
                      >
                        {file.type === 'image' ? (
                          <>
                            <div className="relative w-full h-full">
                              <img 
                                src={getCompressedImageUrl(file.url, 300)} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                loading="lazy" 
                                alt="media"
                              />
                              {renderFaceBoxes(file)}
                            </div>
                          </>
                        ) : file.type === 'video' ? (
                          <>
                            <div className="w-full h-full bg-slate-300 dark:bg-slate-800 group-hover:scale-105 transition-transform duration-300 relative">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Play className="w-8 h-8 text-white/80" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                            <FileIcon className="w-6 h-6 text-blue-500 mb-1" />
                            <span className="text-[9px] text-slate-500 text-center truncate w-full">{file.format}</span>
                          </div>
                        )}
                        
                        {matchInfo && (
                          <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <span className="text-[10px] font-bold text-white">
                              {Math.round(matchInfo.bestMatch.confidence)}%
                            </span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden md:flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
            
            {/* Sidebar */}
            <motion.div 
              animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm">FaceMatch AI</h2>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-3 space-y-1 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-400 px-3 py-2">Media Types</div>
                {[
                  { id: 'all', icon: Users, label: 'All Media' },
                  { id: 'image', icon: FileImage, label: 'Photos' },
                  { id: 'video', icon: FileVideo, label: 'Videos' },
                  { id: 'document', icon: FileIcon, label: 'Documents' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === item.id 
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-600 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}

                <div className="mt-6 text-xs font-semibold text-slate-400 px-3 py-2">Event Details</div>
                <div className="px-3 py-2 space-y-3">
                  <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4 mt-0.5 text-blue-500" />
                    <span>{formatDate(event.eventDate)}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="w-4 h-4 mt-0.5 text-rose-500" />
                    <span>{event.eventPlace}</span>
                  </div>
                </div>

                {/* Photo Mode Info */}
                <div className="mt-6 px-3">
                  <div className={`p-3 rounded-lg ${photoMode === 'your' ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20' : 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {photoMode === 'your' ? (
                        <>
                          <Smile className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">Your Photos</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">All Photos</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {photoMode === 'your' 
                        ? `${matchingImages.length} matching photos`
                        : `${event.mediaFiles.length} total photos`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              {/* Top Bar */}
              <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                  >
                    <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </button>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <button onClick={() => router.back()} className="hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-md transition-colors">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-slate-900 dark:text-white font-semibold">{event.eventName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPhotoChoice(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>
              </header>

              {/* Toolbar */}
              <div className="h-12 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 gap-4 shrink-0">
                <span className="text-sm text-slate-600 dark:text-slate-400">{filteredMedia.length} items</span>
                {photoMode === 'your' && matchingImages.length > 0 && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {matchingImages.length} matching photos
                    </span>
                  </div>
                )}
              </div>

              {/* Main Grid Area */}
              <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={`${activeTab}-${photoMode}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
                  >
                    {filteredMedia.length === 0 ? (
                      <div className="col-span-full h-96 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center mb-6">
                          {photoMode === 'your' ? (
                            <Smile className="w-16 h-16 opacity-30" />
                          ) : (
                            <FileIcon className="w-16 h-16 opacity-30" />
                          )}
                        </div>
                        <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
                          {photoMode === 'your' ? 'No matching photos found' : 'No files found'}
                        </h3>
                        {photoMode === 'your' && (
                          <button
                            onClick={() => setShowPhotoChoice(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all font-medium"
                          >
                            Adjust Settings
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredMedia.map((file) => {
                        const matchInfo = photoMode === 'your' 
                          ? matchingImages.find(m => m.file._id === file._id)
                          : null;
                        
                        return (
                          <div
                            key={file._id}
                            onClick={() => setSelectedMedia(file)}
                            className="group cursor-pointer border border-transparent rounded-xl transition-all hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 p-3 flex flex-col gap-2"
                          >
                            {/* Thumbnail */}
                            <div className="aspect-[4/3] w-full relative overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800 shadow-sm group-hover:shadow-md transition-shadow">
                              {file.type === 'image' ? (
                                <>
                                  <div className="relative w-full h-full">
                                    <img 
                                      src={getCompressedImageUrl(file.url, 400)} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                      loading="lazy" 
                                      alt="media"
                                    />
                                    {renderFaceBoxes(file)}
                                  </div>
                                </>
                              ) : file.type === 'video' ? (
                                <div className="w-full h-full flex items-center justify-center relative">
                                  <div className="absolute inset-0 bg-slate-300 dark:bg-slate-700 group-hover:scale-105 transition-transform duration-300" />
                                  <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <Play className="w-8 h-8 text-white/80" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FileIcon className="w-12 h-12 text-blue-400" />
                                </div>
                              )}

                              {/* Confidence badge */}
                              {matchInfo && (
                                <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg z-10">
                                  <span className="text-[10px] font-bold text-white">
                                    {Math.round(matchInfo.bestMatch.confidence)}%
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="text-center">
                              <p className="text-sm font-medium truncate text-slate-700 dark:text-slate-200">
                                {file.originalName}
                              </p>
                              <p className="text-xs text-slate-400">
                                {formatBytes(file.size)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Media Viewer */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            {/* Viewer Header */}
            <div className="h-16 flex items-center justify-between px-4 md:px-8 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 via-black/70 to-transparent">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedMedia(null)} 
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                
                <div className="text-white max-w-md">
                  <p className="font-medium truncate">{selectedMedia.originalName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownload(selectedMedia.url, selectedMedia.originalName)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
                  disabled={downloading}
                >
                  {downloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4" onClick={() => setSelectedMedia(null)}>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                {selectedMedia.type === 'image' ? (
                  <div className="relative">
                    <img 
                      src={selectedMedia.url} 
                      className="max-h-[85vh] max-w-full object-contain rounded-xl" 
                      alt="fullscreen" 
                    />
                    {photoMode === 'your' && settings.showFaceBoxes && renderFaceBoxes(selectedMedia)}
                  </div>
                ) : selectedMedia.type === 'video' ? (
                  <video 
                    src={selectedMedia.url} 
                    controls 
                    autoPlay 
                    className="max-h-[85vh] max-w-full rounded-xl" 
                  />
                ) : (
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-12 rounded-2xl text-center">
                    <FileIcon className="w-32 h-32 text-slate-500 mx-auto mb-6" />
                    <p className="text-white text-2xl font-medium mb-2">{selectedMedia.originalName}</p>
                    <p className="text-slate-400 mb-6">{formatBytes(selectedMedia.size)}</p>
                    <button 
                      onClick={() => handleDownload(selectedMedia.url, selectedMedia.originalName)}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium"
                    >
                      Download
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}