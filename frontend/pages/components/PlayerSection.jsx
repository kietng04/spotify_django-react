import Image from "next/image";
import React, { useEffect, useState } from "react";
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
import { playPauseAction } from "../../lib/tools";
import progressAndSoundBarAction from "../../lib/progressAndSoundBarAction";
import { useTrack } from "../../context/TrackContext";

function PlayerSection() {
  const [isLiked, setIsLiked] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  
  const { 
    currentTrack, 
    isPlaying, 
    togglePlayPause, 
    playNextTrack, 
    playPreviousTrack 
  } = useTrack();

  useEffect(() => {
    progressAndSoundBarAction.init(
      SoundIcon,
      Sound25Icon,
      Sound75Icon,
      MuteIcon
    );
  }, []);
  const checkLikeStatus = async (trackId) => {
    if (!trackId) return;
    

    const userDataString = localStorage.getItem('spotify_user');
    let userId;
    try {
      const userData = JSON.parse(userDataString);
      userId = userData.user_id;
    }
    catch (error) {
      console.error('Error fetching user data:', error);
      return;
    }
    if (!userId) return;
    
    try {
      const response = await fetch(`http:localhost:8000/api/check-like-status/?user_id=${userId}&track_id=${trackId}`, {
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
  }, [currentTrack?.id]);

  const handleLikeTrack = async () => {

    const userDataString = localStorage.getItem('spotify_user');
    let userId;
    
    try {
      const userData = JSON.parse(userDataString);
      userId = userData.user_id;
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu người dùng:', error);
      return;
    }
    if (!userId || !currentTrack?.id) {
      return;
    }
    
    try {
      const response = await fetch('http:localhost:8000/api/liketrack/', {
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
    setIsLiked(false);
  }, [currentTrack?.id]);

  const handlePlayPause = () => {
    togglePlayPause();

    const playerSectionPlayIcon = document.getElementById("player_section_playicon");
    if (playerSectionPlayIcon) {
      playerSectionPlayIcon.src = isPlaying ? PlayIcon.src : PauseIcon.src;
    }
  };

  return (
    <div
      id="player_section"
      className="h-24 z-[100] bg-[#181919] border-t border-t-[#292928] overflow-scroll flex lg:w-full w-[850px] fixed bottom-0 left-0"
    >
      {/* Hidden audio element - managed by TrackContext */}
      <div className="hidden">
        <audio id="player_audio"></audio>
      </div>

      {/* Track info section */}
      <div className="w-[30%] md:flex h-full px-6 py-4 hidden">
        {currentTrack ? (
          <>
            {/* Album artwork */}
            <Image
              src={currentTrack.thumbnail || DummyMusicThumb}
              alt={currentTrack.name || "Track artwork"}
              width={60}
              height={60}
              priority={true}
              className="h-full w-fit"
            />
            
            {/* Track info */}
            <div className="w-full h-full flex flex-col justify-center ml-4">
              <h1 className="text-sm font-book text-white hover:underline cursor-pointer">
                {currentTrack.name}
              </h1>
              <h1 className="text-xs text-[#B2B3B2] mt-1">
                <span className="hover:text-white hover:underline cursor-pointer font-book">
                  {currentTrack.artistName || "Unknown Artist"}
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
            <Image
              id="player_section_playicon"
              src={isPlaying ? PauseIcon : PlayIcon}
              onClick={handlePlayPause}
              alt="play pause icon"
              priority={true}
              className="cursor-pointer"
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
          <div className="w-[5%] h-full flex items-center justify-center px-2">
            <p
              id="current-time"
              className="font-light text-xs opacity-50 text-white"
            >
              0:00
            </p>
          </div>
          <div
            id="seek_background"
            className="sm:w-[90%] w-[70%] h-full flex items-center px-2 relative seek"
          >
            <div className="w-full h-[0.22rem] relative bg-[#5F5C5D] rounded-full">
              <div
                id="seek_bar"
                className="w-[0%] h-[0.22rem] absolute seek_bar bg-white rounded-full flex items-center justify-end"
              >
                <div
                  id="seek_bar_dot"
                  className="w-3 h-3 bg-white rounded-full seek_bar_dot opacity-0 absolute -mr-[5px]"
                ></div>
              </div>
            </div>
          </div>
          <div className="w-[5%] h-full flex items-center justify-center px-2">
            <p
              id="duration"
              className="font-light text-xs opacity-50 text-white"
            >
              0:00
            </p>
          </div>
        </div>
      </div>
      
      {/* Right controls section */}
      <div className="w-[30%] flex justify-end h-full px-10 py-4">
        <Image
          src={LyricsIcon}
          alt="lyrics icon"
          priority={true}
          className="mx-2 opacity-50 hover:opacity-100"
        />
        <Image
          src={QueueIcon}
          alt="queue icon"
          priority={true}
          className="mx-2 opacity-50 hover:opacity-100"
        />
        <Image
          src={SoundIcon}
          id="player_sound_icon"
          alt="sound icon"
          priority={true}
          onMouseEnter={() => {
            document.querySelector(".sound_bar").style.backgroundColor =
              "#1AB955";
            document.querySelector(".sound_bar_dot").style.opacity = "1";
          }}
          onMouseLeave={() => {
            document.querySelector(".sound_bar").style.backgroundColor =
              "white";
            document.querySelector(".sound_bar_dot").style.opacity = "0";
          }}
          className="mx-2 opacity-50 hover:opacity-100 player_sound_icon"
        />
        <div
          id="sound_background"
          className="w-[40%] h-full flex items-center mx-2 relative sound"
        >
          <div className="w-full h-[0.30rem] relative bg-[#5F5C5D] rounded-full">
            <div
              id="sound_bar"
              className="w-[100%] h-[0.30rem] absolute sound_bar bg-white rounded-full flex items-center justify-end"
            >
              <div className="w-3 h-3 bg-white rounded-full sound_bar_dot opacity-0 absolute -right-25"></div>
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
  );
}

export default PlayerSection;