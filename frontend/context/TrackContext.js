import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
// Xóa bỏ import không cần thiết
// import SoundIcon from "../images/commonicons/soundicon.svg";
// import Sound75Icon from "../images/commonicons/sound75icon.svg";
// import Sound25Icon from "../images/commonicons/sound25icon.svg";
// import MuteIcon from "../images/commonicons/muteicon.svg";
// const progressAndSoundBarAction = require('../lib/progressAndSoundBarAction');

const TrackContext = createContext();

// --- Web Audio API Setup ---
let audioContext = null; // Chỉ tạo một lần
let gainNode = null;     // Chỉ tạo một lần

export function TrackProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackQueue, setTrackQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef(null); // Thẻ <audio> hoặc <video>
  const sourceNodeRef = useRef(null); // Nguồn kết nối với audioRef.current
  // Refs cho các hàm để giải quyết phụ thuộc vòng
  let initializePlayerRef = useRef();
  let cleanupPlayerRef = useRef(); 

  // --- State quản lý bởi Context ---
  const [volume, setVolumeState] = useState(1); // Âm lượng hiện tại (0.0 - 1.0)
  const [isMuted, setIsMutedState] = useState(false); // Trạng thái mute
  const [currentTime, setCurrentTimeState] = useState(0); // Thời gian phát hiện tại (giây)
  const [duration, setDurationState] = useState(0); // Tổng thời gian bài hát (giây)
  const lastVolumeRef = useRef(1); // Lưu âm lượng trước khi mute

  // --- Khởi tạo Web Audio Context và Gain Node ---
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      // Đặt âm lượng ban đầu cho GainNode dựa trên state
      gainNode.gain.value = volume; 
      console.log(`AudioContext initialized. Initial state: ${audioContext?.state}, Initial gain: ${gainNode?.gain.value}`);
    }
    // Cleanup AudioContext khi component unmount (hiếm khi cần trong _app)
    // return () => {
    //   if (audioContext && audioContext.state !== 'closed') {
    //     audioContext.close();
    //     audioContext = null;
    //     gainNode = null;
    //     console.log("AudioContext closed.");
    //   }
    // };
  }, [volume]); // Thêm volume dependency để đảm bảo gainNode được cập nhật nếu state thay đổi trước khi context sẵn sàng

  // --- Định nghĩa các hàm CẬP NHẬT STATE (không phụ thuộc hàm khác) ---
  const updateProgress = useCallback(() => {
      if(audioRef.current){
          setCurrentTimeState(audioRef.current.currentTime);
      }
  },[]);

  const updateDuration = useCallback(() => {
      if (audioRef.current && !isNaN(audioRef.current.duration)) {
          setDurationState(audioRef.current.duration);
      } else {
          setDurationState(0); 
      }
  },[]);

  // --- Định nghĩa các hàm ĐIỀU KHIỂN CƠ BẢN (ít phụ thuộc) ---
  const setVolume = useCallback((newVolume) => {
    if (!gainNode || !audioContext) {
        console.error("setVolume failed: GainNode or AudioContext not ready");
        return;
    }
    console.log(`setVolume: Current audioContext state: ${audioContext.state}`);
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => console.log("AudioContext resumed in setVolume"));
        // Có thể cần chờ resume() hoàn thành trước khi đặt volume?
    }
    
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    
    // *** THAY ĐỔI: Sử dụng gán trực tiếp .value ***
    try {
        gainNode.gain.value = clampedVolume; 
    } catch (error) {
        console.error("Error setting gainNode.gain.value:", error);
    }
    // *** KẾT THÚC THAY ĐỔI ***

    setVolumeState(clampedVolume);
    setIsMutedState(clampedVolume === 0); 
    if (clampedVolume > 0) {
        lastVolumeRef.current = clampedVolume;
    }
    console.log(`WebAudio: Volume set attempt to ${clampedVolume}. Actual gainNode value AFTER direct set: ${gainNode.gain.value}`);
  }, []); 

  const toggleMute = useCallback(() => {
    if (!gainNode || !audioContext) {
        console.error("toggleMute failed: GainNode or AudioContext not ready");
        return;
    }
    console.log(`toggleMute: Current audioContext state: ${audioContext.state}`);
     if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => console.log("AudioContext resumed in toggleMute"));
        // Có thể cần chờ resume() hoàn thành trước khi đặt volume?
    }

    setIsMutedState(prevMuted => {
      const nextMuted = !prevMuted;
      let targetVolume;
      if (nextMuted) {
        lastVolumeRef.current = volume; 
        targetVolume = 0;
        console.log("WebAudio: Attempting to Mute");
      } else {
        targetVolume = lastVolumeRef.current || 1; 
        console.log(`WebAudio: Attempting to Unmute, restore volume to ${targetVolume}`);
      }
      
      // *** THAY ĐỔI: Sử dụng gán trực tiếp .value ***
      try {
        gainNode.gain.value = targetVolume;
      } catch (error) {
          console.error("Error setting gainNode.gain.value in toggleMute:", error);
      }
       // *** KẾT THÚC THAY ĐỔI ***
      
      setVolumeState(targetVolume);
      console.log(`WebAudio: Mute toggled. Actual gainNode value AFTER direct set: ${gainNode.gain.value}`);
      return nextMuted;
    });
  }, [volume]); 

  const seekTime = useCallback((time) => {
    if (audioRef.current && !isNaN(time)) {
      const newTime = Math.max(0, Math.min(time, duration || Infinity)); // Thêm || Infinity phòng trường hợp duration là 0
      audioRef.current.currentTime = newTime;
      setCurrentTimeState(newTime); 
      console.log(`Seek: Time set to ${newTime}`);
    }
  }, [duration]);
  
  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        if (audioContext && audioContext.state === 'suspended') {
             await audioContext.resume();
             console.log("AudioContext resumed on play.");
        }
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      }
    }
  }, [isPlaying, currentTrack]); 

  // --- Định nghĩa hàm PLAYTRACK (phụ thuộc initializePlayer, togglePlayPause) ---
  // (initializePlayer sẽ được định nghĩa ngay sau cleanupPlayer)
  // Forward declaration for initializePlayer - necessary because playTrack uses it
  const playTrack = useCallback(async (trackId) => {
    if (!trackId) return;
    try {
      const savedUserData = localStorage.getItem('spotify_user');
      let token = null;
      if (savedUserData) {
        try {
          const parsedData = JSON.parse(savedUserData);
          token = parsedData.token;
        } catch (e) {
          console.error("Error parsing user data from localStorage:", e);
        }
      }

      if (currentTrack && currentTrack.id === trackId && audioRef.current) {
        togglePlayPause();
        return;
      }

      const headers = {};
      if (token) { headers['Authorization'] = `Token ${token}`; }
      const response = await fetch(`http://localhost:8000/api/stream/${trackId}`, { headers });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        console.error("API Error:", errorMessage);
        alert(errorMessage);
        return; 
      }
      
      const data = await response.json();
      const streamUrl = data.stream_url;
      const fileType = data.file_type || 'mp3';
      const trackDetails = data.track_details;

      if (!streamUrl || !trackDetails) { throw new Error('Incomplete track data'); }

      // Lấy video_url từ track_details (nếu có)
      const videoUrl = trackDetails.video_url || null;
      console.log("Received video URL (if any):", videoUrl); // Log để kiểm tra

      const requiredElementType = fileType === 'mp4' ? 'video' : 'audio';
      if (!audioRef.current || audioRef.current.tagName.toLowerCase() !== requiredElementType) {
        if(initializePlayerRef.current) {
             initializePlayerRef.current(requiredElementType); 
        } else {
             console.error("initializePlayer function not yet available");
             return;
        }
      }
      
      if (!audioRef.current) { console.error("Failed initialize audio element"); return; }

      setCurrentTrack({
        id: trackDetails.id || trackId, 
        title: trackDetails.title || "Unknown Track", 
        artists: trackDetails.artists || [{ name: trackDetails.artist || "Unknown Artist" }], 
          track_cover_url: trackDetails.cover_image || trackDetails.album_cover_url || null, 
        duration_ms: trackDetails.duration_ms || 0, 
        stream_url: streamUrl, 
          fileType: fileType, 
          video_url: videoUrl
      });

      audioRef.current.src = streamUrl;
      audioRef.current.volume = 1; 
      audioRef.current.muted = false;
      
      // --- Bắt đầu khối try-catch cho việc play ---
      try {
          if (audioContext && audioContext.state === 'suspended') {
             await audioContext.resume();
             console.log("AudioContext resumed before play.");
          }
      await audioRef.current.play();
          setIsPlaying(true); // Đặt là true CHỈ KHI play() thành công
      } catch (error) {
          console.error('Error attempting to play audio:', error); // Log lỗi đầy đủ
          setIsPlaying(false); // Đảm bảo trạng thái là false nếu play lỗi

          // Xử lý lỗi cụ thể
          if (error.name === 'AbortError') {
              // Lỗi này thường do người dùng hủy hành động (ví dụ: click quá nhanh)
              // Không cần thông báo cho người dùng, chỉ cần log cảnh báo.
              console.warn("Play request was interrupted (likely by user action).");
          } else if (error.name === 'NotAllowedError') {
              // Lỗi do trình duyệt chặn tự động phát âm thanh
              alert("Browser prevented playback. Please click play or interact with the page first.");
          } else if (error.name === 'NotSupportedError') {
              // Lỗi do định dạng không được hỗ trợ
              alert("The audio format might not be supported by your browser.");
              setCurrentTrack(null); // Reset track nếu không hỗ trợ
              // Gọi cleanup qua ref nếu cần
              if (cleanupPlayerRef.current) cleanupPlayerRef.current();
          } else {
              // Các lỗi khác không mong muốn
              alert(`An unknown error occurred while trying to play: ${error.message}`);
              setCurrentTrack(null);
              // Gọi cleanup qua ref nếu cần
              if (cleanupPlayerRef.current) cleanupPlayerRef.current();
          }
      }
      // --- Kết thúc khối try-catch cho việc play ---
      
    } catch (error) { // Catch lỗi từ fetch hoặc xử lý data
        console.error('Error playing track (fetch/data stage):', error);
      alert(`An error occurred: ${error.message}`);
      setCurrentTrack(null);
      setIsPlaying(false);
        // Gọi cleanup qua ref
        if (cleanupPlayerRef.current) {
             cleanupPlayerRef.current(); 
        }
    }
  }, [currentTrack, togglePlayPause]); // Thêm cleanupPlayer dependency nếu nó được dùng trong catch
    
  // --- Định nghĩa các hàm PHỤ THUỘC playTrack ---
  const playNextTrack = useCallback(async () => {
    if (trackQueue.length === 0) return;
    const nextIndex = (currentIndex + 1) % trackQueue.length;
    setCurrentIndex(nextIndex);
    const nextTrack = trackQueue[nextIndex];
    if (nextTrack) { 
        await playTrack(nextTrack.id || nextTrack); 
    } else { console.warn("Next track undefined", nextIndex); }
  }, [trackQueue, currentIndex, playTrack]);

  const playPreviousTrack = useCallback(async () => {
    if (trackQueue.length === 0) return;
    let prevIndex;
    if (audioRef.current && audioRef.current.currentTime > 3) {
       seekTime(0); 
       if (!isPlaying) await togglePlayPause(); 
       return;
    } else {
      prevIndex = (currentIndex - 1 + trackQueue.length) % trackQueue.length;
    }
    setCurrentIndex(prevIndex);
    const prevTrack = trackQueue[prevIndex];
     if (prevTrack) { 
        await playTrack(prevTrack.id || prevTrack); 
    } else { console.warn("Previous track undefined", prevIndex); }
  }, [trackQueue, currentIndex, playTrack, isPlaying, togglePlayPause, seekTime]); 

   // --- Định nghĩa hàm xử lý KẾT THÚC BÀI HÁT (phụ thuộc playNextTrack) ---
   const handleTrackEnd = useCallback(() => {
    console.log("Track ended, attempting to play next.");
    playNextTrack(); // Bây giờ playNextTrack đã được định nghĩa
  }, [playNextTrack]);

  // --- Định nghĩa hàm CLEANUP (phụ thuộc updateProgress, updateDuration, handleTrackEnd) ---
  const cleanupPlayer = useCallback(() => {
    if (sourceNodeRef.current) {
        try {
             sourceNodeRef.current.disconnect(); 
        } catch (error) {
            console.warn("Error disconnecting previous source node:", error);
        }
        sourceNodeRef.current = null;
        console.log("Previous source node disconnected.");
    }
    if (audioRef.current) {
      audioRef.current.removeEventListener('timeupdate', updateProgress);
      audioRef.current.removeEventListener('loadedmetadata', updateDuration);
      audioRef.current.removeEventListener('ended', handleTrackEnd);
      audioRef.current.pause();
      audioRef.current.src = ''; 
      audioRef.current = null;
      console.log("Previous audio element cleaned up.");
    }
  }, [updateProgress, updateDuration, handleTrackEnd]); 

  // --- Định nghĩa hàm KHỞI TẠO PLAYER (phụ thuộc cleanupPlayer, update*, handleTrackEnd) ---
  const initializePlayer = useCallback((elementType) => {
    cleanupPlayer(); 
    if (typeof window !== 'undefined' && audioContext && gainNode) {
      if (elementType === 'video') {
        audioRef.current = document.createElement('video');
        audioRef.current.crossOrigin = "anonymous";
      } else {
        audioRef.current = new Audio();
        audioRef.current.crossOrigin = "anonymous";
      }
      
      // --- KHÔI PHỤC KẾT NỐI WEB AUDIO API ---
      try {
          // Kiểm tra xem sourceNode cũ có cần disconnect không (thường cleanupPlayer đã làm)
          if (sourceNodeRef.current) {
               console.warn("Source node already exists before creating new one. Should have been cleaned up.");
               try { sourceNodeRef.current.disconnect(); } catch(e){} 
          }
          sourceNodeRef.current = audioContext.createMediaElementSource(audioRef.current);
          sourceNodeRef.current.connect(gainNode);
          console.log("New audio element connected to Web Audio graph.");
      } catch (error) {
           console.error("Error creating/connecting MediaElementSource:", error);
          audioRef.current = null; 
          return; 
      }
      // console.log("Web Audio API connection TEMPORARILY BYPASSED for diagnosis."); // Xóa log bypass

      // Add event listeners for state updates
      audioRef.current.addEventListener('timeupdate', updateProgress);
      audioRef.current.addEventListener('loadedmetadata', updateDuration);
      audioRef.current.addEventListener('ended', handleTrackEnd);
      // Reset state
      setCurrentTimeState(0);
      setDurationState(0);
    } else { console.error("Cannot init player: Context/GainNode not ready."); }
  }, [cleanupPlayer, updateProgress, updateDuration, handleTrackEnd]); 

  // Gán hàm vào ref sau khi đã định nghĩa
  useEffect(() => {
      initializePlayerRef.current = initializePlayer;
      cleanupPlayerRef.current = cleanupPlayer; // Gán cleanupPlayer vào ref
  }, [initializePlayer, cleanupPlayer]);

  // --- useEffect for final cleanup on unmount ---
  useEffect(() => {
    // Gọi hàm cleanup qua ref khi unmount
    return () => {
        if (cleanupPlayerRef.current) {
            cleanupPlayerRef.current();
        }
    };
  }, []); // Chạy một lần khi mount

  // --- Cung cấp giá trị Context ---
  return (
    <TrackContext.Provider 
      value={{ 
        currentTrack, 
        isPlaying, 
        trackQueue,
        currentIndex,
        volume,      
        isMuted,     
        currentTime, 
        duration,    
        playTrack, 
        togglePlayPause,
        playNextTrack,
        playPreviousTrack,
        setTrackQueue,
        setCurrentIndex,
        setVolume,   
        toggleMute,  
        seekTime     
      }}
    >
      {children}
    </TrackContext.Provider>
  );
}

export const useTrack = () => useContext(TrackContext);