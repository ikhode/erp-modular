import {useEffect, useRef, useState} from 'react';
import {AlertCircle, Camera, CheckCircle} from 'lucide-react';
import * as faceapi from 'face-api.js';

interface FaceAuthProps {
  onAuthenticated: () => void;
  onRoleSet: (role: string) => void;
}

export default function FaceAuth({ onAuthenticated, onRoleSet }: FaceAuthProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/');
        await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/');
        await faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/');
        setModelsLoaded(true);
      } catch (err) {
        console.error('Error loading face-api models:', err);
        setError('Error loading face recognition models');
      }
    };
    loadModels();
  }, []);

  // Start video stream
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Error accessing camera');
    }
  };

  // Stop video stream
  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleStartScan = async () => {
    if (!modelsLoaded) {
      setError('Face recognition models not loaded yet');
      return;
    }

    setIsScanning(true);
    setError(null);
    await startVideo();

    // Wait for video to load
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = async () => {
        // Detect face
        const detection = await faceapi.detectSingleFace(
          videoRef.current!,
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptor();

        if (detection) {
          // Face detected, authenticate
          setIsScanning(false);
          setIsAuthenticated(true);
          stopVideo();

          // Simulate role assignment (in real app, match against stored faces)
          setTimeout(() => {
            onRoleSet('admin');
            onAuthenticated();
          }, 1000);
        } else {
          setIsScanning(false);
          setError('No face detected. Please try again.');
          stopVideo();
        }
      };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            {error ? (
              <AlertCircle className="w-10 h-10 text-red-600" />
            ) : isAuthenticated ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <Camera className="w-10 h-10 text-blue-600" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Face Authentication
          </h1>
          
          <p className="text-gray-600 mb-8">
            {error ? error : isAuthenticated
              ? 'Authentication successful!'
              : 'Please position your face in front of the camera'
            }
          </p>

          {!modelsLoaded && (
            <div className="text-blue-600 mb-4">
              Loading face recognition models...
            </div>
          )}

          {!isAuthenticated && modelsLoaded && (
            <div className="mb-4">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full rounded-lg border-2 border-gray-200"
                style={{ display: isScanning ? 'block' : 'none' }}
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </div>
          )}

          {!isAuthenticated && modelsLoaded && (
            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {isScanning ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Scanning...
                </div>
              ) : (
                'Start Face Scan'
              )}
            </button>
          )}

          {isAuthenticated && (
            <div className="text-green-600 font-medium">
              Redirecting to dashboard...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}