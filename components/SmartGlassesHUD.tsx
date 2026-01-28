import React, { useEffect, useRef, useState, useCallback } from 'react';

interface VideoDevice {
  deviceId: string;
  label: string;
}

const SmartGlassesHUD: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize and list devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request initial permission to expose labels
        await navigator.mediaDevices.getUserMedia({ video: true });
        
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`
          }));

        setDevices(videoInputs);

        // Attempt to auto-select the "back" camera or an external USB one if identifiable
        // Smart glasses often appear as external USB cameras.
        if (videoInputs.length > 0) {
          // Heuristic: On Android, external cameras might appear last or have specific names
          // For now, default to the last one found as it's often the external/USB one added
          setSelectedDeviceId(videoInputs[videoInputs.length - 1].deviceId);
        }
      } catch (err) {
        console.error("Error listing devices:", err);
        setError("PERMISSION DENIED: Could not access camera system.");
      }
    };

    getDevices();
  }, []);

  // Handle stream start/stop
  const startStream = useCallback(async () => {
    if (!selectedDeviceId) return;

    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: selectedDeviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError(null);
      }
    } catch (err) {
      console.error("Stream Error:", err);
      setError("CONNECTION FAILED: UVC Device not accessible or busy.");
      setIsStreaming(false);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    if (selectedDeviceId) {
      startStream();
    }
  }, [selectedDeviceId, startStream]);

  return (
    <div className="h-full flex flex-col relative">
      {/* Main Viewport */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {!isStreaming && !error && (
          <div className="text-cyan-800 animate-pulse text-sm">INITIALIZING OPTICAL SENSORS...</div>
        )}
        
        {error && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-6 text-center">
            <div className="border border-red-600 p-4 rounded bg-red-900/20 max-w-sm">
              <h3 className="text-red-500 font-bold mb-2">SYSTEM ERROR</h3>
              <p className="text-red-300 text-sm mb-4">{error}</p>
              <div className="text-xs text-gray-400 text-left space-y-2">
                <p>Troubleshooting for UVC/Smart Glasses:</p>
                <ul className="list-disc pl-4">
                  <li>Ensure OTG is enabled on your Android settings.</li>
                  <li>Reconnect the USB-C cable.</li>
                  <li>Browser may require a refresh to detect new USB devices.</li>
                </ul>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-mono uppercase rounded w-full"
              >
                Reboot System
              </button>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`max-w-full max-h-full object-contain ${isStreaming ? 'opacity-100' : 'opacity-0'}`}
          style={{ transform: 'scaleX(1)' }} // Assuming rear/external cam, no mirror needed usually
        />

        {/* HUD Overlay Elements */}
        <div className="absolute inset-0 pointer-events-none border-[1px] border-cyan-500/30 m-2 rounded-lg">
          {/* Corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500"></div>

          {/* Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center opacity-50">
            <div className="w-[1px] h-full bg-cyan-400/50"></div>
            <div className="h-[1px] w-full bg-cyan-400/50 absolute"></div>
            <div className="w-2 h-2 border border-cyan-400 rounded-full bg-transparent z-10"></div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-gray-900 border-t border-cyan-900 p-4 space-y-4 z-20">
        
        {/* Device Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-cyan-600 uppercase tracking-widest">Input Source (UVC)</label>
          <select 
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="bg-black border border-cyan-800 text-cyan-400 text-xs p-2 rounded focus:outline-none focus:border-cyan-500 font-mono"
          >
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label.toUpperCase()}
              </option>
            ))}
            {devices.length === 0 && <option>SCANNING FOR DEVICES...</option>}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-3">
           <button 
             onClick={startStream}
             className="border border-cyan-700 text-cyan-500 hover:bg-cyan-900/30 py-3 rounded text-xs font-bold uppercase tracking-wider transition-colors"
           >
             Refresh Feed
           </button>
        </div>

        {/* Footer Info */}
        <div className="text-[9px] text-gray-600 text-center font-mono">
          WEB-UVC BRIDGE v1.0.5 | CAMERA ONLY MODE
        </div>
      </div>
    </div>
  );
};

export default SmartGlassesHUD;