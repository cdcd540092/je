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
  const [showHelp, setShowHelp] = useState(false);

  // Function to fetch and update devices
  const fetchDevices = useCallback(async (autoSelect: boolean = false) => {
    try {
      // Check permissions implicitly by seeing if labels exist
      const tempDevices = await navigator.mediaDevices.enumerateDevices();
      const hasLabels = tempDevices.some(d => d.label && d.label.length > 0);

      if (!hasLabels) {
        // Request initial permission if missing
        await navigator.mediaDevices.getUserMedia({ video: true });
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`
        }));

      setDevices(videoInputs);

      // Auto-select logic:
      // If we are asking to autoSelect (e.g. after plug in) OR no device is currently selected
      if (videoInputs.length > 0) {
        if (autoSelect || !selectedDeviceId) {
           // Default to the last device (usually external USB/Glasses on Android)
           const targetId = videoInputs[videoInputs.length - 1].deviceId;
           // Only update if different to avoid stream flicker
           if (targetId !== selectedDeviceId) {
             setSelectedDeviceId(targetId);
           }
        }
      } else {
        setError("NO CAMERA DETECTED. Connect Glasses via OTG.");
      }
    } catch (err) {
      console.error("Error listing devices:", err);
      setError("PERMISSION DENIED. Please allow camera access in browser settings.");
    }
  }, [selectedDeviceId]);

  // Initial load and Hot-plug listener
  useEffect(() => {
    fetchDevices(false);

    const handleDeviceChange = () => {
      console.log("Device change detected (Hot-plug), refreshing...");
      // When devices change (plug/unplug), force auto-select
      fetchDevices(true);
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [fetchDevices]);

  // Handle stream start/stop
  const startStream = useCallback(async () => {
    if (!selectedDeviceId) return;

    try {
      // Stop previous tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }

      console.log(`Attempting to stream from: ${selectedDeviceId}`);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: selectedDeviceId },
          // UVC glasses often support 720p (1280x720) best. 
          // 1080p can cause bandwidth issues on some USB-C/OTG adapters.
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError(null);
      }
    } catch (err: any) {
      console.error("Stream Error:", err);
      if (err.name === 'NotReadableError') {
        setError("DEVICE BUSY: Camera is used by another app or disconnected.");
      } else if (err.name === 'OverconstrainedError') {
        setError("FORMAT ERROR: Resolution not supported by glasses.");
      } else {
        setError(`CONNECTION FAILED: ${err.message || 'Unknown error'}`);
      }
      setIsStreaming(false);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    if (selectedDeviceId) {
      startStream();
    }
  }, [selectedDeviceId, startStream]);

  // Cycle to next camera (easier for mobile users than dropdown)
  const cycleCamera = () => {
    if (devices.length <= 1) return;
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    setSelectedDeviceId(devices[nextIndex].deviceId);
  };

  return (
    <div className="h-full flex flex-col relative w-full touch-none">
      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-[60] bg-black/95 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-gray-900 border border-cyan-500/50 rounded-lg p-6 max-w-sm w-full shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <h3 className="text-cyan-400 text-lg font-bold mb-4 tracking-wider border-b border-cyan-900 pb-2">CONNECTION GUIDE</h3>
            <ol className="space-y-3 text-sm text-gray-300 font-mono list-decimal pl-4">
              <li>Connect glasses to phone USB-C port.</li>
              <li>Wait for Android pop-up asking to open browser/app.</li>
              <li>If asked, Allow <b>Camera Access</b> permissions.</li>
              <li>If screen is black, tap <b>REFRESH FEED</b>.</li>
              <li>If wrong camera, tap <b>CYCLE CAM</b>.</li>
            </ol>
            <button 
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded uppercase tracking-widest transition-colors"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {!isStreaming && !error && (
          <div className="text-cyan-800 animate-pulse text-sm font-mono">INITIALIZING OPTICAL SENSORS...</div>
        )}
        
        {error && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-6 text-center">
            <div className="border border-red-600 p-4 rounded bg-red-900/20 max-w-sm w-full shadow-[0_0_20px_rgba(220,38,38,0.5)]">
              <h3 className="text-red-500 font-bold mb-2 tracking-widest">SYSTEM ERROR</h3>
              <p className="text-red-300 text-sm mb-4 font-mono">{error}</p>
              <div className="text-xs text-gray-400 text-left space-y-2 border-t border-red-900/50 pt-2">
                <p>Troubleshooting:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Check USB-C/OTG connection.</li>
                  <li>Close other camera apps.</li>
                  <li>Replug the glasses.</li>
                </ul>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-3 bg-red-700 hover:bg-red-600 text-white text-xs font-bold font-mono uppercase rounded w-full active:scale-95 transition-transform"
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
          style={{ transform: 'scaleX(1)' }} // Usually standard for external cams
        />

        {/* HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none border-[1px] border-cyan-500/30 m-2 rounded-lg">
          {/* Top Right Help Button (Clickable) */}
          <div className="absolute top-4 right-4 pointer-events-auto z-40">
            <button 
              onClick={() => setShowHelp(true)}
              className="w-8 h-8 rounded-full border border-cyan-500 text-cyan-500 flex items-center justify-center hover:bg-cyan-900/50 transition-colors font-mono font-bold"
            >
              ?
            </button>
          </div>

          {/* Corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500"></div>

          {/* Center Target */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center opacity-40">
            <div className="w-[1px] h-full bg-cyan-400"></div>
            <div className="h-[1px] w-full bg-cyan-400 absolute"></div>
            <div className="w-4 h-4 border border-cyan-400 rounded-full bg-transparent z-10 box-border"></div>
          </div>
        </div>
      </div>

      {/* Controls Bar - Mobile Optimized */}
      <div className="bg-gray-900 border-t border-cyan-900 p-4 z-20 shrink-0 safe-pb">
        <div className="flex flex-row gap-3 items-center">
          
          {/* Main Action Button */}
          <button 
            onClick={startStream}
            className="flex-1 bg-cyan-900/40 border border-cyan-600 text-cyan-400 py-3 px-2 rounded hover:bg-cyan-800/50 active:bg-cyan-700 transition-colors text-xs font-bold uppercase tracking-wider h-12 flex items-center justify-center"
          >
            Refresh Feed
          </button>

          {/* Cycle Camera Button (Better for mobile) */}
          <button 
             onClick={cycleCamera}
             className="flex-1 bg-gray-800 border border-gray-600 text-cyan-200 py-3 px-2 rounded hover:bg-gray-700 active:bg-gray-600 transition-colors text-xs font-bold uppercase tracking-wider h-12 flex items-col justify-center items-center gap-1"
           >
             <span className="text-[9px] text-gray-400 block">CAM:</span>
             <span className="truncate max-w-[80px]">
               {devices.find(d => d.deviceId === selectedDeviceId)?.label.slice(0, 8) || 'AUTO'}
             </span>
             <span className="text-cyan-500 ml-1">↻</span>
           </button>
        </div>

        {/* Device Select (Hidden on very small screens if needed, but kept for precision) */}
        <div className="mt-3">
          <select 
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="w-full bg-black border border-cyan-900 text-gray-400 text-[10px] p-2 rounded focus:outline-none font-mono"
          >
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <style>{`
        .safe-pb {
          padding-bottom: env(safe-area-inset-bottom, 16px);
        }
      `}</style>
    </div>
  );
};

export default SmartGlassesHUD;