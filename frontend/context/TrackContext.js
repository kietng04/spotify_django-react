import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

const TrackContext = createContext();

export function TrackProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackQueue, setTrackQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef(null);

  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     audioRef.current = new Audio();

  //     audioRef.current.addEventListener('timeupdate', updateProgress);
  //     audioRef.current.addEventListener('loadedmetadata', updateDuration);
  //     audioRef.current.addEventListener('ended', handleTrackEnd);
  //     return () => {
  //       if (audioRef.current) {
  //         audioRef.current.removeEventListener('timeupdate', updateProgress);
  //         audioRef.current.removeEventListener('loadedmetadata', updateDuration);
  //         audioRef.current.removeEventListener('ended', handleTrackEnd);
  //         audioRef.current.pause();
  //       }
  //     };
  //   }
  // }, [handleTrackEnd]);

  

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

  const updateDuration = () => {
    const durationDisplay = document.getElementById('duration');
    if (durationDisplay && audioRef.current) {
      durationDisplay.textContent = formatTime(audioRef.current.duration);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  const playTrack = async (trackId) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (currentTrack && currentTrack.id === trackId) {
        togglePlayPause();
        return;
      }

      const response = await fetch(`http://localhost:8000/api/stream/${trackId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stream URL');
      }
      
      const data = await response.json();
    
      setCurrentTrack({
        id: trackId,
        name: data.track_details?.title || "Unknown Track",
        artistName: data.track_details?.artist || "Unknown Artist",
        thumbnail: data.track_details?.cover_image_url || null,
        duration: data.track_details?.duration_ms || 0
      });

      audioRef.current.src = data.stream_url;
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (playError) {
        console.error('Error playing audio:', playError);
        setIsPlaying(false);
      }
      
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

    
  const playNextTrack = useCallback(async () => {
    if (trackQueue.length === 0) return;
    
    const nextIndex = currentIndex + 1;
    if (nextIndex < trackQueue.length) {
      setCurrentIndex(nextIndex);
      const nextTrack = trackQueue[nextIndex];
      await playTrack(nextTrack.id || nextTrack);
    }
  }, [trackQueue, currentIndex, setCurrentIndex]);

  const handleTrackEnd = useCallback(() => {
    if (currentIndex < trackQueue.length - 1) {
      playNextTrack();
    } else {
      setIsPlaying(false);
    }
  }, [currentIndex, trackQueue.length, playNextTrack, setIsPlaying]);

  const togglePlayPause = async () => {
    if (!audioRef.current || !currentTrack) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };


  const playPreviousTrack = useCallback(async () => {
    if (trackQueue.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      
      const prevTrack = trackQueue[prevIndex];
      try {
        await playTrack(prevTrack.id || prevTrack);
      } catch (error) {
        console.error('Error playing previous track:', error);
      }
    } else {
      if (audioRef.current && audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
      }
    }
  }, [trackQueue, currentIndex, setCurrentIndex]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();

      audioRef.current.addEventListener('timeupdate', updateProgress);
      audioRef.current.addEventListener('loadedmetadata', updateDuration);
      audioRef.current.addEventListener('ended', handleTrackEnd);
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', updateProgress);
          audioRef.current.removeEventListener('loadedmetadata', updateDuration);
          audioRef.current.removeEventListener('ended', handleTrackEnd);
          audioRef.current.pause();
        }
      };
    }
  }, [handleTrackEnd]);

  return (
    <TrackContext.Provider 
      value={{ 
        currentTrack, 
        isPlaying, 
        trackQueue,
        currentIndex,
        playTrack, 
        togglePlayPause,
        playNextTrack,
        playPreviousTrack,
        setTrackQueue,
        setCurrentIndex,
        setCurrentTrack,
        setIsPlaying,
        audioRef
      }}
    >
      {children}
    </TrackContext.Provider>
  );
}

export const useTrack = () => useContext(TrackContext);