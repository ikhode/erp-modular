import {AlertCircle, Camera, CheckCircle, Eye, Smile} from 'lucide-react';
import * as faceapi from 'face-api.js';
import {useEffect, useRef, useState} from 'react';
import {supabase} from '../lib/supabase';

interface FaceAuthProps {
    onAuthenticated: () => void;
    onRoleSet: (role: string) => void;
    userId?: string;
    mode?: 'auth' | 'register';
}

type LivenessStep = 'neutral' | 'blink' | 'smile' | 'complete';

export default function FaceAuth({ onAuthenticated, onRoleSet, userId, mode = 'auth' }: FaceAuthProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [livenessStep, setLivenessStep] = useState<LivenessStep>('neutral');
    const [livenessInstructions, setLivenessInstructions] = useState('Look at the camera');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Load face-api models
    useEffect(() => {
        const loadModels = async () => {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
                await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
                await faceapi.nets.faceExpressionNet.loadFromUri('/models');
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

    // Función para detectar parpadeo
    const detectBlink = (landmarks: faceapi.FaceLandmarks68): boolean => {
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const leftEAR = getEyeAspectRatio(leftEye);
        const rightEAR = getEyeAspectRatio(rightEye);
        const ear = (leftEAR + rightEAR) / 2;

        return ear < 0.25;
    };

    // Función para calcular la relación de aspecto del ojo
    const getEyeAspectRatio = (eye: faceapi.Point[]): number => {
        const a = faceapi.euclideanDistance([eye[1].x, eye[1].y], [eye[5].x, eye[5].y]);
        const b = faceapi.euclideanDistance([eye[2].x, eye[2].y], [eye[4].x, eye[4].y]);
        const c = faceapi.euclideanDistance([eye[0].x, eye[0].y], [eye[3].x, eye[3].y]);
        return (a + b) / (2 * c);
    };

    // Función para detectar sonrisa
    const detectSmile = (expressions: faceapi.FaceExpressions): boolean => {
        return expressions.happy > 0.7;
    };

    const performLivenessCheck = async (): Promise<boolean> => {
        if (!videoRef.current) return false;

        const detection = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (!detection) return false;

        const { landmarks, expressions } = detection;

        switch (livenessStep) {
            case 'blink':
                return detectBlink(landmarks);
            case 'smile':
                return detectSmile(expressions);
            default:
                return true;
        }
    };

    const advanceLivenessStep = () => {
        switch (livenessStep) {
            case 'neutral':
                setLivenessStep('blink');
                setLivenessInstructions('Please blink your eyes');
                break;
            case 'blink':
                setLivenessStep('smile');
                setLivenessInstructions('Please smile');
                break;
            case 'smile':
                setLivenessStep('complete');
                setLivenessInstructions('Verification complete');
                break;
        }
    };

    const authenticateWithBackend = async (faceDescriptor: Float32Array): Promise<boolean> => {
        // In development mode, mock the authentication
        if (import.meta.env.DEV) {
            console.log('🔧 Development mode: Mocking face authentication (HTTPS not required)');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
        }

        try {
            const { data, error } = await supabase.functions.invoke('face-auth', {
                body: {
                    action: 'authenticate',
                    faceDescriptor: Array.from(faceDescriptor),
                    userId: userId
                }
            });

            if (error) {
                console.error('Face auth error:', error);
                return false;
            }

            return data?.match ?? false;
        } catch (err) {
            console.error('Error calling face auth function:', err);
            return false;
        }
    };

    const registerWithBackend = async (faceDescriptor: Float32Array): Promise<boolean> => {
        // In development mode, mock the registration
        if (import.meta.env.DEV) {
            console.log('🔧 Development mode: Mocking face registration (HTTPS not required)');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
        }

        try {
            const { data, error } = await supabase.functions.invoke('face-auth', {
                body: {
                    action: 'register',
                    faceDescriptor: Array.from(faceDescriptor),
                    userId: userId
                }
            });

            if (error) {
                console.error('Face register error:', error);
                return false;
            }

            return data?.success ?? false;
        } catch (err) {
            console.error('Error calling face register function:', err);
            return false;
        }
    };

    const handleStartScan = async () => {
        if (!modelsLoaded) {
            setError('Face recognition models not loaded yet');
            return;
        }

        if (!userId) {
            setError('User not authenticated. Please login first.');
            return;
        }

        setIsScanning(true);
        setError(null);
        setLivenessStep('neutral');
        setLivenessInstructions('Look at the camera');

        await startVideo();

        // Wait for video to load
        if (videoRef.current) {
            videoRef.current.onloadedmetadata = async () => {
                try {
                    // Paso 1: Verificación de rostro neutral
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const neutralDetection = await faceapi.detectSingleFace(
                        videoRef.current!,
                        new faceapi.TinyFaceDetectorOptions()
                    ).withFaceLandmarks().withFaceDescriptor();

                    if (!neutralDetection) {
                        throw new Error('No face detected');
                    }

                    advanceLivenessStep();

                    // Paso 2: Verificación de parpadeo
                    let blinkDetected = false;
                    for (let i = 0; i < 50; i++) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        if (await performLivenessCheck()) {
                            blinkDetected = true;
                            break;
                        }
                    }

                    if (!blinkDetected) {
                        throw new Error('Blink not detected');
                    }

                    advanceLivenessStep();

                    // Paso 3: Verificación de sonrisa
                    let smileDetected = false;
                    for (let i = 0; i < 50; i++) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        if (await performLivenessCheck()) {
                            smileDetected = true;
                            break;
                        }
                    }

                    if (!smileDetected) {
                        throw new Error('Smile not detected');
                    }

                    advanceLivenessStep();

                    // Paso 4: Autenticación final
                    const finalDetection = await faceapi.detectSingleFace(
                        videoRef.current!,
                        new faceapi.TinyFaceDetectorOptions()
                    ).withFaceLandmarks().withFaceDescriptor();

                    if (!finalDetection) {
                        throw new Error('Face lost during verification');
                    }

                    // Enviar descriptor al backend para comparación segura o registro
                    if (mode === 'register') {
                        const isRegistered = await registerWithBackend(finalDetection.descriptor);
                        if (isRegistered) {
                            setIsScanning(false);
                            setIsAuthenticated(true);
                            stopVideo();
                            setTimeout(() => {
                                onAuthenticated();
                            }, 1000);
                        } else {
                            throw new Error('Face registration failed');
                        }
                    } else {
                        const isAuthenticatedResult = await authenticateWithBackend(finalDetection.descriptor);
                        if (isAuthenticatedResult) {
                            setIsScanning(false);
                            setIsAuthenticated(true);
                            stopVideo();
                            setTimeout(() => {
                                onRoleSet('user');
                                onAuthenticated();
                            }, 1000);
                        } else {
                            throw new Error('Face not recognized');
                        }
                    }

                } catch (err) {
                    setIsScanning(false);
                    setError(err instanceof Error ? err.message : 'Authentication failed');
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
                        ) : livenessStep === 'blink' ? (
                            <Eye className="w-10 h-10 text-blue-600" />
                        ) : livenessStep === 'smile' ? (
                            <Smile className="w-10 h-10 text-blue-600" />
                        ) : (
                            <Camera className="w-10 h-10 text-blue-600" />
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {mode === 'register' ? 'Face Registration' : 'Face Authentication'}
                    </h1>

                    <p className="text-gray-600 mb-4">
                        {error ? error : isAuthenticated
                            ? (mode === 'register' ? 'Registration successful!' : 'Authentication successful!')
                            : livenessInstructions
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
                                    {livenessStep === 'complete' ? (mode === 'register' ? 'Registering...' : 'Authenticating...') : 'Verifying...'}
                                </div>
                            ) : (
                                mode === 'register' ? 'Start Face Registration' : 'Start Face Verification'
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