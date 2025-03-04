import { createContext, useContext, useState, useEffect, useRef } from 'react';

const AudioContext = createContext();

export function AudioProvider({ children }) {
  // Use ref instead of state to avoid hydration issues
  const audioRef = useRef(null);
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackInfo, setTrackInfo] = useState(null);

  // Initialize audio on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
    }
  }, []);

  const playTrack = async (trackId) => {
    // Check if we're in a browser environment with audio support
    if (!audioRef.current) return;
    
    try {
      // If same track is clicked and playing, pause it
      if (currentTrackId === trackId && isPlaying && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      // If different track or same track but paused
      if (currentTrackId !== trackId) {
        // Fetch stream URL for the track
        const response = await fetch(`http://localhost:8000/api/stream/${trackId}`);
        if (!response.ok) throw new Error('Failed to fetch stream URL');
        
        const data = await response.json();
        
        // Update track info
        setTrackInfo(data.track_details);
        
        // Set audio source
        audioRef.current.src = data.stream_url;
        setCurrentTrackId(trackId);
      }
      
      // Play audio
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error("Playback failed:", error);
          });
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Clean up audio element on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  return (
    <AudioContext.Provider value={{ 
      currentTrackId, 
      isPlaying, 
      trackInfo,
      playTrack, 
      pauseTrack 
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}
