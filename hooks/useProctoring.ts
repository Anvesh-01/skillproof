import { useEffect, useRef, useState } from 'react';

interface ProctoringOptions {
  examId: string;
  userId: string;
  onViolation?: (type: string, severity: string) => void;
}

export function useProctoring({ examId, userId, onViolation }: ProctoringOptions) {
  const [isActive, setIsActive] = useState(false);
  const [violations, setViolations] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Log violation to backend
  const logViolation = async (eventType: string, severity: string, metadata?: any) => {
    try {
      await fetch('/api/proctoring/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          userId,
          eventType,
          severity,
          metadata,
        }),
      });

      const violation = { eventType, severity, timestamp: new Date(), metadata };
      setViolations(prev => [...prev, violation]);
      onViolation?.(eventType, severity);
    } catch (error) {
      console.error('Error logging violation:', error);
    }
  };

  // Initialize camera and face detection
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
      }

      // Start face detection
      startFaceDetection();

      // Start audio detection
      startAudioDetection(stream);

    } catch (error) {
      console.error('Camera access denied:', error);
      logViolation('camera_access_denied', 'high');
    }
  };

  // Face detection (simplified - would use face-api.js in production)
  const startFaceDetection = () => {
    let noFaceCount = 0;

    detectionIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Draw video frame to canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      // Get image data for analysis
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Simple brightness check (placeholder for real face detection)
      const hasContent = checkForContent(imageData);

      if (!hasContent) {
        noFaceCount++;
        if (noFaceCount > 3) {
          logViolation('face_not_detected', 'high');
          noFaceCount = 0;
        }
      } else {
        noFaceCount = 0;
      }
    }, 2000); // Check every 2 seconds
  };

  // Simple content detection
  const checkForContent = (imageData: ImageData): boolean => {
    let totalBrightness = 0;
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      totalBrightness += brightness;
    }

    const avgBrightness = totalBrightness / (pixels.length / 4);
    return avgBrightness > 20; // Threshold for detecting content
  };

  // Audio/Noise detection
  const startAudioDetection = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      microphone.connect(analyser);
      analyser.fftSize = 256;

      let noiseCount = 0;

      const detectNoise = () => {
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        // Noise threshold
        if (average > 50) {
          noiseCount++;
          if (noiseCount > 3) {
            logViolation('sound_detected', 'medium', { level: average });
            noiseCount = 0;
          }
        } else {
          noiseCount = 0;
        }

        requestAnimationFrame(detectNoise);
      };

      detectNoise();
    } catch (error) {
      console.error('Audio detection error:', error);
    }
  };

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        logViolation('tab_switch', 'high');
      }
    };

    const handleWindowBlur = () => {
      if (isActive) {
        logViolation('window_blur', 'medium');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isActive]);

  // Cleanup
  const stopProctoring = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setIsActive(false);
  };

  useEffect(() => {
    return () => {
      stopProctoring();
    };
  }, []);

  return {
    startCamera,
    stopProctoring,
    isActive,
    violations,
    videoRef,
    canvasRef,
  };
}
