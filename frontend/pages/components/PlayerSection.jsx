import Image from "next/image";
import React, { useEffect, useState, useRef, useCallback } from "react";
import DummyMusicThumb from "../../images/commonimages/dummymusicthumb1.jpeg";
import HeartOutlineIcon from "../../images/commonicons/heartoutlineicon.svg";
import HeartIconGreen from "../../images/commonicons/hearticongreen.svg";
import ShuffleIcon from "../../images/commonicons/shuffleicon.svg";
import ShuffleIconGreen from "../../images/commonicons/shuffleicongreen.svg";
import PreviousIcon from "../../images/commonicons/previousicon.svg";
import PlayIcon from "../../images/commonicons/playicon.svg";
import PauseIcon from "../../images/commonicons/pauseicon.svg";
import NextIcon from "../../images/commonicons/nexticon.svg";
import RepeatIcon from "../../images/commonicons/repeaticon.svg";
import RepeatIconGreen from "../../images/commonicons/repeaticongreen.svg";
import LyricsIcon from "../../images/commonicons/lyricsicon.svg";
import QueueIcon from "../../images/commonicons/queueicon.svg";
import SoundIcon from "../../images/commonicons/soundicon.svg";
import Sound75Icon from "../../images/commonicons/sound75icon.svg";
import Sound25Icon from "../../images/commonicons/sound25icon.svg";
import MuteIcon from "../../images/commonicons/muteicon.svg";
import FullScreenIcon from "../../images/commonicons/fullscreenicon.svg";
import { FaVideo } from "react-icons/fa";
import { playPauseAction } from "../../lib/tools";
import { useTrack } from "../../context/TrackContext";
import { useAuth } from '../../context/AuthContext';
import { 
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box
} from '@chakra-ui/react';

// Hàm tiện ích định dạng thời gian (có thể chuyển ra file riêng)
const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
};

function PlayerSection() {
  const { 
    currentTrack,
    isPlaying,
    togglePlayPause,
    playNextTrack,
    playPreviousTrack,
    volume,
    isMuted,
    currentTime,
    duration,
    setVolume,
    toggleMute,
    seekTime
  } = useTrack();
  const { userData } = useAuth();
  
  const { isOpen: isVideoModalOpen, onOpen: onVideoModalOpen, onClose: onVideoModalClose } = useDisclosure();

  const [isLiked, setIsLiked] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  
  const checkLikeStatus = async (trackId) => {
    const token = userData?.token;
    if (!token) {
      return;
    }

    const userDataString = localStorage.getItem('spotify_user');
    let userId;
    try {
      const userDataLocal = JSON.parse(userDataString);
      userId = userDataLocal.user_id;
    } catch (error) {
      console.error('Error fetching user data from localStorage:', error);
      userId = userData?.user_id;
      if (!userId) return;
    }
    if (!userId) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/check-like-status/?user_id=${userId}&track_id=${trackId}`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.is_liked);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };
  
  useEffect(() => {
    if (currentTrack?.id) {
      checkLikeStatus(currentTrack.id);
    } else {
      setIsLiked(false);
    }
  }, [currentTrack?.id, userData?.token]);

  const handleLikeTrack = async () => {
    const token = userData?.token;
    if (!token) {
      console.error('No token available for liking track.');
      return;
    }

    const userDataString = localStorage.getItem('spotify_user');
    let userId;
    
    try {
      const userDataLocal = JSON.parse(userDataString);
      userId = userDataLocal.user_id;
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu người dùng từ localStorage:', error);
      userId = userData?.user_id;
      if (!userId) return;
    }
    if (!userId || !currentTrack?.id) {
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8000/api/liketrack/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          track_id: currentTrack.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update like status');
      }
      
      const data = await response.json();
      
      setIsLiked(data.action === 'like');
      
      console.log(`Track ${data.action === 'like' ? 'liked' : 'unliked'} successfully`);
    } catch (error) {
      console.error('Error updating like status:', error);
    }
  };

  useEffect(() => {
    if (seekBarRef.current && duration > 0) {
      const percentage = (currentTime / duration) * 100;
      seekBarRef.current.style.width = `${percentage}%`;
    } else if (seekBarRef.current) {
        seekBarRef.current.style.width = '0%';
    }
  }, [currentTime, duration]);

  useEffect(() => {
    if (soundBarRef.current && playerSoundIconRef.current) {
       const displayVolume = isMuted ? 0 : volume;
       soundBarRef.current.style.width = `${displayVolume * 100}%`;

       if (isMuted || displayVolume === 0) {
         playerSoundIconRef.current.src = MuteIcon.src;
       } else if (displayVolume <= 0.25) {
         playerSoundIconRef.current.src = Sound25Icon.src;
       } else if (displayVolume <= 0.75) {
         playerSoundIconRef.current.src = Sound75Icon.src;
       } else {
         playerSoundIconRef.current.src = SoundIcon.src;
       }
    }
  }, [volume, isMuted]);

  const handleSeek = useCallback((e) => {
      if (!seekBackgroundRef.current || duration <= 0) return;
      const rect = seekBackgroundRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const progressBarWidth = seekBackgroundRef.current.clientWidth;
      const seekPercentage = Math.max(0, Math.min(1, offsetX / progressBarWidth));
      const newTime = seekPercentage * duration;
      seekTime(newTime);
  }, [duration, seekTime]);

  const handleVolumeChange = useCallback((e) => {
      if (!soundBackgroundRef.current) return;
      const rect = soundBackgroundRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const progressBarWidth = soundBackgroundRef.current.clientWidth;
      const newVolume = Math.max(0, Math.min(1, offsetX / progressBarWidth));
      setVolume(newVolume);
  }, [setVolume]);

  const soundBarRef = useRef(null);
  const soundBarDotRef = useRef(null);
  const soundBackgroundRef = useRef(null);
  const seekBarRef = useRef(null);
  const seekBarDotRef = useRef(null);
  const seekBackgroundRef = useRef(null);
  const playerSoundIconRef = useRef(null);
  const modalVideoRef = useRef(null);

  // Effect để đồng bộ video trong modal
  useEffect(() => {
    const videoElement = modalVideoRef.current;

    // Hàm xử lý timeupdate từ modal
    const handleModalTimeUpdate = (event) => {
      seekTime(event.target.currentTime);
    };

    // Hàm xử lý volumechange từ modal
    const handleModalVolumeChange = (event) => {
      const newVolume = event.target.volume;
      const newMuted = event.target.muted;
      // Chỉ cập nhật context nếu khác trạng thái hiện tại để tránh vòng lặp vô hạn
      if (newVolume !== volume) {
        setVolume(newVolume);
      }
      if (newMuted !== isMuted) {
        toggleMute(); // toggleMute sẽ tự đảo trạng thái
      }
    };

    if (isVideoModalOpen && videoElement && currentTrack?.fileType === 'mp4') {
      // Đồng bộ trạng thái ban đầu khi modal mở
      videoElement.currentTime = currentTime;
      videoElement.volume = volume; // <<< Đồng bộ volume ban đầu
      videoElement.muted = false; // <<< Luôn bật tiếng cho modal

      // Đồng bộ play/pause ban đầu
      if (isPlaying) {
        videoElement.play().catch(err => console.warn("Modal video play failed:", err));
      } else {
        videoElement.pause();
      }

      // Thêm listeners
      videoElement.addEventListener('timeupdate', handleModalTimeUpdate);
      videoElement.addEventListener('volumechange', handleModalVolumeChange); // <<< Thêm listener volume

      // Cleanup: xóa listeners
      return () => {
        videoElement.removeEventListener('timeupdate', handleModalTimeUpdate);
        videoElement.removeEventListener('volumechange', handleModalVolumeChange); // <<< Xóa listener volume
      };
    }

    // Cleanup dự phòng
    return () => {
      if (videoElement) {
         videoElement.removeEventListener('timeupdate', handleModalTimeUpdate);
         videoElement.removeEventListener('volumechange', handleModalVolumeChange);
      }
    };
    // Thêm dependencies mới
  }, [isVideoModalOpen, currentTrack, currentTime, isPlaying, seekTime, volume, isMuted, setVolume, toggleMute]); 

  return (
    <>
      <div
        id="player_section"
        className="h-24 z-[100] bg-[#181919] border-t border-t-[#292928] overflow-hidden flex lg:w-full w-[850px] fixed bottom-0 left-0"
      >
        {/* Track info section */}
        <div className="w-[30%] md:flex h-full px-6 py-4 hidden">
          {currentTrack ? (
            <>
              {/* Conditionally render Video or Album artwork */}
              {currentTrack.fileType === 'mp4' && currentTrack.stream_url ? (
                <Box 
                  onClick={onVideoModalOpen}
                  cursor="pointer" 
                  className="h-full w-auto flex items-center justify-center bg-black"
                >
                  <video
                    src={currentTrack.stream_url}
                    width={60}
                    height={60}
                    className="h-full w-auto object-contain pointer-events-none"
                    autoPlay={isPlaying}
                    muted
                    playsInline
                    loop={isRepeat}
                    controls={false}
                  />
                </Box>
              ) : (
                <Image
                  src={currentTrack.track_cover_url || DummyMusicThumb}
                  alt={currentTrack.title || "Track artwork"}
                  width={60}
                  height={60}
                  priority={true}
                  className="h-full w-fit object-cover"
                />
              )}
              
              {/* Track info */}
              <div className="w-full h-full flex flex-col justify-center ml-4 overflow-hidden">
                <h1 className="text-sm font-book text-white hover:underline cursor-pointer truncate">
                  {currentTrack.title || 'Unknown Track'}
                </h1>
                <h1 className="text-xs text-[#B2B3B2] mt-1 truncate">
                  <span className="hover:text-white hover:underline cursor-pointer font-book">
                    {currentTrack.artists && currentTrack.artists.length > 0
                      ? currentTrack.artists.map(artist => artist.name).join(', ')
                      : "Unknown Artist"}
                  </span>
                </h1>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center">
              <p className="text-[#B2B3B2] text-sm">No track selected</p>
            </div>
          )}
          
         {/* Like button */}
        <div className="w-5 flex items-center">
          {isLiked ? (
            <Image
              onClick={handleLikeTrack}
              src={HeartIconGreen}
              alt="Heart Icon"
              priority={true}
              className="h-4 cursor-pointer fill-green-500 w-4"
            />
          ) : (
            <Image
              onClick={handleLikeTrack}
              src={HeartOutlineIcon}
              alt="Heart Outline Icon"
              priority={true}
              className="cursor-pointer opacity-70 hover:opacity-100"
            />
          )}
        </div>
        </div>
        
        {/* Player controls section */}
        <div className="w-[40%] flex flex-col h-full pl-6 py-4">
          <div className="h-[65%] w-full flex justify-center items-center">
            {/* Shuffle button */}
            {isShuffle ? (
              <Image
                onClick={() => setIsShuffle(false)}
                src={ShuffleIconGreen}
                alt="shuffle icon green"
                priority={true}
                className="mx-3"
              />
            ) : (
              <Image
                onClick={() => setIsShuffle(true)}
                src={ShuffleIcon}
                alt="shuffle icon"
                priority={true}
                className="opacity-30 hover:opacity-100 mx-3"
              />
            )}

            {/* Previous track button */}
            <Image
              src={PreviousIcon}
              alt="previous icon"
              priority={true}
              onClick={playPreviousTrack}
              className="opacity-70 hover:opacity-100 mx-3 cursor-pointer"
            />

            {/* Play/Pause button */}
            <div className="bg-white h-8 hover:scale-110 rounded-full w-8 p-2 flex items-center justify-center mx-3">
              <img
                id="player_section_playicon"
                src={isPlaying ? PauseIcon.src : PlayIcon.src}
                onClick={togglePlayPause}
                alt="play pause icon"
                className="cursor-pointer h-[16px] w-[16px]"
              />
            </div>

            {/* Next track button */}
            <Image
              src={NextIcon}
              alt="next icon"
              priority={true}
              onClick={playNextTrack}
              className="opacity-70 hover:opacity-100 mx-3 cursor-pointer"
            />
            
            {/* Repeat button */}
            {isRepeat ? (
              <Image
                onClick={() => setIsRepeat(false)}
                src={RepeatIconGreen}
                alt="repeat icon green"
                priority={true}
                className="mx-3"
              />
            ) : (
              <Image
                onClick={() => setIsRepeat(true)}
                src={RepeatIcon}
                alt="repeat icon"
                priority={true}
                className="opacity-30 hover:opacity-100 mx-3"
              />
            )}
          </div>
          
          {/* Progress bar section */}
          <div className="h-[35%] w-full flex justify-center items-center">
            <div className="w-[10%] h-full flex items-center justify-center px-2">
              <p
                id="current-time"
                className="font-light text-xs opacity-50 text-white"
              >
                {formatTime(currentTime)}
              </p>
            </div>
            <div
              id="seek_background"
              ref={seekBackgroundRef}
              onClick={handleSeek}
              className="sm:w-[90%] w-[70%] h-full flex items-center px-2 relative seek cursor-pointer"
            >
              <div className="w-full h-[0.22rem] relative bg-[#5F5C5D] rounded-full">
                <div
                  id="seek_bar"
                  ref={seekBarRef}
                  className="w-[0%] h-[0.22rem] absolute seek_bar bg-white rounded-full flex items-center justify-end pointer-events-none"
                >
                  <div
                    id="seek_bar_dot"
                    ref={seekBarDotRef}
                    className="w-3 h-3 bg-white rounded-full seek_bar_dot opacity-0 absolute -mr-[5px] pointer-events-none"
                  ></div>
                </div>
              </div>
            </div>
            <div className="w-[10%] h-full flex items-center justify-center px-2">
              <p
                id="duration"
                className="font-light text-xs opacity-50 text-white"
              >
                {formatTime(duration)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Right controls section */}
        <div className="w-[30%] flex justify-end items-center h-full px-10 py-4">
          <Image
            src={LyricsIcon}
            alt="lyrics icon"
            priority={true}
            className="mx-2 opacity-50 hover:opacity-100 cursor-pointer"
          />
          <Image
            src={QueueIcon}
            alt="queue icon"
            priority={true}
            className="mx-2 opacity-50 hover:opacity-100 cursor-pointer"
          />
          <img 
            ref={playerSoundIconRef}
            src={SoundIcon.src}
            id="player_sound_icon"
            alt="sound icon"
            onClick={toggleMute}
            className="mx-2 opacity-50 hover:opacity-100 player_sound_icon cursor-pointer h-[18px] w-[18px] my-auto"
          />
          <div
            id="sound_background"
            ref={soundBackgroundRef}
            onClick={handleVolumeChange}
            className="w-[40%] h-full flex items-center mx-2 relative sound cursor-pointer"
          >
            <div className="w-full h-[0.30rem] relative bg-[#5F5C5D] rounded-full pointer-events-none">
              <div
                id="sound_bar"
                ref={soundBarRef}
                className="w-[100%] h-[0.30rem] absolute sound_bar bg-white rounded-full flex items-center justify-end pointer-events-none"
              >
                <div 
                  ref={soundBarDotRef}
                  className="w-3 h-3 bg-white rounded-full sound_bar_dot opacity-0 absolute -right-25 pointer-events-none">
                </div>
              </div>
            </div>
          </div>
          <Image
            src={FullScreenIcon}
            alt="fullscreen icon"
            priority={true}
            className="mx-2 opacity-50 hover:opacity-100"
          />
        </div>
      </div>

      {/* Modal để hiển thị video phóng to */} 
      <Modal isOpen={isVideoModalOpen} onClose={onVideoModalClose} size="4xl" isCentered>
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="gray.900">
          <ModalCloseButton color="white" />
          <ModalBody p={0}>
            {currentTrack?.fileType === 'mp4' && currentTrack.stream_url && (
              <video
                ref={modalVideoRef}
                src={currentTrack.stream_url}
                width="100%"
                controls={true}
                loop={isRepeat}
                muted={false}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default PlayerSection;