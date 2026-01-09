import React, { useState } from 'react';
import { Camera, CheckCircle } from 'lucide-react';

interface FaceAuthProps {
  onAuthenticated: () => void;
  onRoleSet: (role: string) => void;
}

export default function FaceAuth({ onAuthenticated, onRoleSet }: FaceAuthProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleStartScan = () => {
    setIsScanning(true);
    
    // Simulate face scanning process
    setTimeout(() => {
      setIsScanning(false);
      setIsAuthenticated(true);
      
      // Simulate successful authentication after a brief delay
      setTimeout(() => {
        onRoleSet('admin'); // Set default role
        onAuthenticated();
      }, 1000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            {isAuthenticated ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <Camera className="w-10 h-10 text-blue-600" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Face Authentication
          </h1>
          
          <p className="text-gray-600 mb-8">
            {isAuthenticated 
              ? 'Authentication successful!' 
              : 'Please authenticate to access the system'
            }
          </p>

          {!isAuthenticated && (
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