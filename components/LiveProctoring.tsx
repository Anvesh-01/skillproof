"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, Mic, Eye, AlertTriangle } from "lucide-react";

interface ProctoringProps {
  examId: string;
  onViolation?: (violation: string) => void;
}

export default function LiveProctoring({ examId, onViolation }: ProctoringProps) {
  const [cameraStatus, setCameraStatus] = useState<'inactive' | 'active' | 'error'>('inactive');
  const [micStatus, setMicStatus] = useState<'inactive' | 'active' | 'error'>('inactive');
  const [faceDetectionStatus, setFaceDetectionStatus] = useState<'inactive' | 'ready' | 'detecting'>('inactive');
  const [violations, setViolations] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize Camera and Microphone
  useEffect(() => {
    initializeMedia();

    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeMedia = async () => {
    try {
      // Request camera and microphone access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      setStream(mediaStream);

      // Set video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Check tracks
      const videoTrack = mediaStream.getVideoTracks()[0];
      const audioTrack = mediaStream.getAudioTracks()[0];

      if (videoTrack && videoTrack.enabled) {
        setCameraStatus('active');
      }

      if (audioTrack && audioTrack.enabled) {
        setMicStatus('active');
      }

      setFaceDetectionStatus('ready');

      // Start face detection simulation
      startFaceDetection();

    } catch (error) {
      console.error('Error accessing media devices:', error);
      setCameraStatus('error');
      setMicStatus('error');
      
      if (error instanceof Error) {
        alert(`Camera/Microphone access denied: ${error.message}\n\nPlease allow camera and microphone access to continue with the exam.`);
      }
    }
  };

  // Simulate face detection (you can integrate real face detection libraries here)
  const startFaceDetection = () => {
    setFaceDetectionStatus('detecting');
    
    // Simple interval-based detection simulation
    const detectionInterval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        // Here you would integrate actual face detection
        // For now, we'll just mark it as detecting
        detectFace();
      }
    }, 2000);

    // Cleanup
    return () => clearInterval(detectionInterval);
  };

  const detectFace = () => {
    // Placeholder for actual face detection logic
    // You can integrate libraries like:
    // - face-api.js
    // - TensorFlow.js with face detection models
    // - MediaPipe Face Detection
    
    // For now, just log
    console.log('Face detection check...');
  };

  // Log violation
  const logViolation = async (type: string) => {
    const newViolationCount = violations + 1;
    setViolations(newViolationCount);

    if (onViolation) {
      onViolation(type);
    }

    // Send to API
    try {
      await fetch('/api/proctoring/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          userId: 'current-user-id', // Replace with actual user ID
          eventType: type,
          severity: 'medium',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error logging violation:', error);
    }
  };

  // Detect tab/window changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('tab_switch');
      }
    };

    const handleBlur = () => {
      logViolation('window_blur');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [violations]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Live Monitoring</h3>
      </div>

      {/* Video Feed */}
      <div className="relative mb-4 bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {cameraStatus === 'inactive' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Camera Initializing...</p>
            </div>
          </div>
        )}

        {cameraStatus === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900">
            <div className="text-center text-white">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Camera Access Denied</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Indicators */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Camera</span>
          </div>
          <span className={`text-sm font-semibold ${
            cameraStatus === 'active' ? 'text-green-600' : 
            cameraStatus === 'error' ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            {cameraStatus === 'active' ? 'Active' : 
             cameraStatus === 'error' ? 'Error' : 
             'Inactive'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Microphone</span>
          </div>
          <span className={`text-sm font-semibold ${
            micStatus === 'active' ? 'text-green-600' : 
            micStatus === 'error' ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            {micStatus === 'active' ? 'Active' : 
             micStatus === 'error' ? 'Error' : 
             'Inactive'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Face Detection</span>
          </div>
          <span className={`text-sm font-semibold ${
            faceDetectionStatus === 'detecting' ? 'text-green-600' : 
            faceDetectionStatus === 'ready' ? 'text-blue-600' : 
            'text-gray-500'
          }`}>
            {faceDetectionStatus === 'detecting' ? 'Detecting' : 
             faceDetectionStatus === 'ready' ? 'Ready' : 
             'Inactive'}
          </span>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Violations Detected</span>
            <span className={`text-2xl font-bold ${
              violations === 0 ? 'text-green-600' : 
              violations < 3 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {violations}
            </span>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Your exam session is being monitored. Multiple violations may affect your final score.
          </p>
        </div>
      </div>
    </div>
  );
}