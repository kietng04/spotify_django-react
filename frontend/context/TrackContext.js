// frontend/context/TrackContext.js
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

// Create the context
const TrackContext = createContext();

export function TrackProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackQueue, setTrackQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef(null);

  // Initialize audio on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      
      // Set up audio event listeners
      audioRef.current.addEventListener('timeupdate', updateProgress);
      audioRef.current.addEventListener('loadedmetadata', updateDuration);
      audioRef.current.addEventListener('ended', handleTrackEnd);
      
      // Clean up when component unmounts
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', updateProgress);
          audioRef.current.removeEventListener('loadedmetadata', updateDuration);
          audioRef.current.removeEventListener('ended', handleTrackEnd);
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, []);

  // Update progress bar as audio plays
  const updateProgress = () => {
    const progressBar = document.getElementById('seek_bar');
    const timeDisplay = document.getElementById('current-time');
    
    if (progressBar && audioRef.current) {
      const percentage = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      progressBar.style.width = `${percentage}%`;
      
      if (timeDisplay) {
        timeDisplay.textContent = formatTime(audioRef.current.currentTime);
      }
    }
  };

  // Update duration display when metadata loads
  const updateDuration = () => {
    const durationDisplay = document.getElementById('duration');
    if (durationDisplay && audioRef.current) {
      durationDisplay.textContent = formatTime(audioRef.current.duration);
    }
  };

  // Format seconds to mm:ss format
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  // Handle track end
  const handleTrackEnd = () => {
    playNextTrack();
  };

  // Play a track by ID
  const playTrack = async (trackId) => {
    try {
      // Stop current playback
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // If same track is playing, just toggle pause/play
      if (currentTrack && currentTrack.id === trackId) {
        togglePlayPause();
        return;
      }
      
      // Fetch track details and stream URL
      const response = await fetch(`http://localhost:8000/api/stream/${trackId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stream URL');
      }
      
      const data = await response.json();
      
      // Update current track state with new track data
      setCurrentTrack({
        id: trackId,
        name: data.track_details?.title || "Unknown Track",
        artistName: data.track_details?.artist || "Unknown Artist",
        thumbnail: data.track_details?.cover_image_url || null,
        duration: data.track_details?.duration_ms || 0
      });
      
      // Set audio source and play
      audioRef.current.src = data.stream_url;
      audioRef.current.play();
      setIsPlaying(true);
      
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Play next track in queue
  const playNextTrack = () => {
    if (trackQueue.length > 0 && currentIndex < trackQueue.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      playTrack(trackQueue[nextIndex].id);
    }
  };

  // Play previous track in queue
  const playPreviousTrack = () => {
    if (trackQueue.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      playTrack(trackQueue[prevIndex].id);
    }
  };

  // Return the context provider with all needed values
  return (
    <TrackContext.Provider 
      value={{ 
        currentTrack, 
        isPlaying, 
        playTrack, 
        togglePlayPause,
        playNextTrack,
        playPreviousTrack,
        audioRef
      }}
    >
      {children}
    </TrackContext.Provider>
  );
}

export const useTrack = () => useContext(TrackContext);