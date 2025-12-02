"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Volume2, VolumeX } from "lucide-react";

export default function RetroHero() {
  const gridColor = "#ff0000"; // Red grids
  const showScanlines = true;
  const glowEffect = true;
  const [isMuted, setIsMuted] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasInteractedRef = useRef(false);
  const isMutedRef = useRef(true);
  const hasStartedRef = useRef(false);

  // Sync refs with state
  useEffect(() => {
    isMutedRef.current = isMuted;
    hasStartedRef.current = hasStarted;
  }, [isMuted, hasStarted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Handle audio errors
    const handleError = (e: Event) => {
      console.error("Audio error:", audio.error);
      if (audio.error) {
        const error = audio.error;
        let errorMessage = "Unknown audio error";
        
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMessage = "Audio loading was aborted";
            break;
          case error.MEDIA_ERR_NETWORK:
            errorMessage = "Network error - check if F1.mp3 exists in public folder";
            break;
          case error.MEDIA_ERR_DECODE:
            errorMessage = "Audio decode error - file may be corrupted";
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Audio format not supported or file not found at /F1.mp3";
            break;
        }
        console.warn("Audio error:", errorMessage, "Error code:", error.code);
      }
    };

    const handleCanPlay = () => {
      console.log("Audio can play - readyState:", audio.readyState);
    };

    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);
    
    // Set volume to maximum
    audio.volume = 1;
    
    // Pre-load the audio so it's ready when user interacts
    audio.load();

    return () => {
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, []);

  const toggleMute = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      // Unmute - start playing
      setIsMuted(false);
      
      try {
        // Ensure audio is loaded
        if (audio.readyState < 2) {
          audio.load();
          // Wait a moment for loading
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Try to play
        await audio.play();
        setHasStarted(true);
        console.log("Audio unmuted and playing");
      } catch (error) {
        console.log("Could not play audio on unmute:", error);
      }
    } else {
      // Mute - pause audio
      audio.pause();
      setIsMuted(true);
      console.log("Audio muted");
    }
  };

  const handleUserInteraction = (e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent event from bubbling if it's a click on interactive elements
    if (e && (e.target as HTMLElement).closest('a, button')) {
      return;
    }
    
    if (!hasInteractedRef.current && !hasStartedRef.current && !isMutedRef.current) {
      hasInteractedRef.current = true;
      const audio = audioRef.current;
      if (audio) {
        console.log("Direct interaction - attempting to play audio, readyState:", audio.readyState);
        audio.volume = 1;
        
        // CRITICAL: Call play() immediately without any async delays
        // This must happen synchronously in response to the user gesture
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              hasStartedRef.current = true;
              isMutedRef.current = false;
              setHasStarted(true);
              setIsMuted(false);
              console.log("✅ Audio started via direct interaction!");
            })
            .catch((error) => {
              console.error("❌ Could not play audio on direct interaction:", error);
              // Reset the flag so user can try again
              hasInteractedRef.current = false;
            });
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!hasInteractedRef.current) {
      handleUserInteraction(e);
    }
  };

  return (
    <div 
      className="relative w-full h-screen overflow-hidden"
      onClick={handleUserInteraction}
      onMouseMove={handleMouseMove}
      onTouchStart={handleUserInteraction}
    >
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src="/F1.mp3"
        loop
        preload="auto"
        playsInline
      />

      {/* Mute Button - Top Right */}
      <button
        onClick={toggleMute}
        className="absolute top-6 right-6 z-20 p-3 bg-black/50 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-black/70 hover:border-white/40 transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <VolumeX size={24} className="text-white" />
        ) : (
          <Volume2 size={24} className="text-white" />
        )}
      </button>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        {/* Text Content */}
        <div className="flex flex-col items-center justify-center text-center mb-16">
          {/* Top line: < D;SS THAT > */}
          <div className="text-white font-bold text-3xl md:text-4xl lg:text-5xl mb-4 tracking-wider font-sans">
            &lt; D;SS THAT &gt;
          </div>
          
          {/* Bottom line: {DSA} */}
          <div className="text-white font-bold text-6xl md:text-7xl lg:text-8xl xl:text-9xl tracking-wider font-sans">
            &#123;DSA&#125;
          </div>
        </div>

        {/* Buttons Container */}
        <div className="flex flex-col sm:flex-row gap-6 mt-8">
          {/* Resources Button */}
          <a 
            href="https://drive.google.com/drive/folders/1P3AOR1Zk3MzKz8hFL6VKXD45GtVBHt6l" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative px-10 py-4 bg-transparent border-2 border-white text-white font-bold text-lg uppercase tracking-wider overflow-hidden transition-all duration-300 hover:text-black hover:shadow-[0_0_40px_#ffffff] hover:scale-105 active:scale-95 inline-block text-center"
          >
            <span className="relative z-10 transition-colors duration-300">Resources</span>
            <span className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          </a>

          {/* Ask your doubt Button */}
          <Link 
            href="/doubt"
            className="group relative px-10 py-4 bg-transparent border-2 border-white text-white font-bold text-lg uppercase tracking-wider overflow-hidden transition-all duration-300 hover:text-black hover:shadow-[0_0_40px_#ffffff] hover:scale-105 active:scale-95 inline-block text-center"
          >
            <span className="relative z-10 transition-colors duration-300">Ask your doubt</span>
            <span className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          </Link>
        </div>
      </div>
    </div>
  );
}