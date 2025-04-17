import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useTrack } from "../../context/TrackContext";
import { changeHeaderBackgroundColor } from "../../lib/tools";
import { TbClock } from "react-icons/tb";
import { RiDeleteBin6Line } from "react-icons/ri";
import HeartIcon from "../../images/commonicons/hearticon.svg";
import HeartIconGreen from "../../images/commonicons/hearticongreen.svg";
import HeartOutlineIcon from "../../images/commonicons/heartoutlineicon.svg";
import DummyProfile from "../../images/commonimages/dummyprofile.jpeg";
import PlayIconWhite from "../../images/commonicons/playiconwhite.svg";
import PauseIconWhite from "../../images/commonicons/pauseiconwhite.svg";
import DummyMusicThumb from "../../images/commonimages/dummymusicthumb1.jpeg";
import PlayIcon from "../../images/commonicons/playicon.svg";

function TracksSection() {
  // State variables
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState(null);

  const { 
    setCurrentTrack,
    setTrackQueue,
    setIsPlaying,
    setCurrentIndex,
    currentTrack,
    isPlaying,
    togglePlayPause,
  } = useTrack();

  useEffect(() => {
    changeHeaderBackgroundColor("#190E3C");
    validateTokenAndFetchTracks();
  }, []);

  useEffect(() => {
    if (currentTrack?.id) {
      setCurrentPlayingId(currentTrack.id);
    }
  }, [currentTrack]);

  const validateTokenAndFetchTracks = async () => {
    try {
      const userDataString = localStorage.getItem('spotify_user');
      const token = userDataString ? JSON.parse(userDataString).token : null;

      if (!token || !userDataString) {
        setIsLoading(false);
        return;
      }
      
      const userData = JSON.parse(userDataString);
      const userId = userData.user_id;
      
      const validateResponse = await fetch('http://localhost:8000/api/validate-token/', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (!validateResponse.ok) {
        setIsLoading(false);
        return;
      }
      
      setIsTokenValid(true);
      setUsername(userData.username);

      const response = await fetch(`http://localhost:8000/api/liked-tracks/?user_id=${userId}`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTracks(data);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error validating token or fetching tracks:', error);
      setIsLoading(false);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTotalDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) {
      return `${minutes} mins`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hr ${remainingMinutes} mins`;
    }
  };

  const getImageSrc = (url) => {
    if (!url) return DummyMusicThumb.src;
    return url.startsWith("http") ? url : `http://localhost:8000${url}`;
  };

  // Play track function
  const playTrack = (track, index) => {
    const formattedTracks = tracks.map(track => ({
      id: track.id,
      name: track.title,
      artistName: track.artists?.map(a => a.name).join(", ") || "Unknown Artist",
      thumbnail: track.album?.cover_image_url || null,
      duration_ms: track.duration_ms,
      stream_url: `http://localhost:8000/api/stream/${track.id}`
    }));
    
    const formattedTrack = {
      id: track.id,
      name: track.title,
      artistName: track.artists?.map(a => a.name).join(", ") || "Unknown Artist",
      thumbnail: track.album?.cover_image_url || null,
      duration_ms: track.duration_ms,
      stream_url: `http://localhost:8000/api/stream/${track.id}`
    };
    
    setTrackQueue(formattedTracks);
    setCurrentIndex(index);
    setCurrentTrack(formattedTrack);
    setIsPlaying(true);
    setCurrentPlayingId(track.id);
  };

  const playAllTracks = () => {
    if (!tracks.length) return;
    playTrack(tracks[0], 0);
  };

  const unlikeTrack = async (e, trackId) => {
    e.stopPropagation();

    try {
      const userDataString = localStorage.getItem("spotify_user");
      if (!userDataString) {
        alert("Bạn cần đăng nhập để thực hiện chức năng này");
        return;
      }

      const userData = JSON.parse(userDataString);
      const token = userData.token;
      const userId = userData.user_id;

      const response = await fetch("http://localhost:8000/api/liketrack/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          track_id: trackId
        }),
      });

      if (response.ok) {
        setTracks(tracks.filter(track => track.id !== trackId));
      }
    } catch (error) {
      console.error("Error unliking track:", error);
    }
  };

  const totalDuration = tracks.reduce((total, track) => total + track.duration_ms, 0);

  return (
    <div className="w-full relative">
      {/* Header with gradient background */}
      <div className="w-full h-[340px] z-50 absolute top-0 flex items-center pl-10">
        <div className="w-[230px] shadow-lg shadow-black/20 h-[230px] mt-16 bg-gradient-to-br from-[#4C1BF3] to-white flex items-center justify-center">
          <Image
            src={HeartIcon}
            alt={`Heart Icon`}
            height={80}
            width={80}
            priority={true}
          />
        </div>
        <div className="w-auto h-[230px] mt-16 ml-6 flex flex-col justify-end">
          <h1 className="text-white uppercase text-xs font-bold">playlist</h1>
          <h1 className="text-white text-[5.5rem] font-black">Liked Songs</h1>
          <div className="flex items-center">
            <Image
              src={DummyProfile}
              alt={`Profile Icon`}
              height={25}
              width={25}
              priority={true}
              className="rounded-full"
            />
            <h1 className="ml-2 text-white hover:underline font-book text-sm cursor-pointer">
              {isTokenValid ? username || "User" : "Guest User"}
            </h1>
            <span className="mx-2 text-white text-2xl">·</span>
            <h1 className="text-white font-book text-sm cursor-default">
              {tracks.length} songs
            </h1>
            <span className="mx-2 text-white text-2xl">·</span>
            <h1 className="text-white font-book text-sm cursor-default">
              {formatTotalDuration(totalDuration)}
            </h1>
          </div>
        </div>
      </div>

      {/* Gradient background */}
      <div className="w-[120%] z-10 relative -ml-[20%] h-[650px] bg-gradient-to-br -mt-[10%] from-[#5629F3]/90 via-[#5629F3]/50 to-black blur-2xl"></div>

      {/* Playlist Content */}
      <div className="w-full z-50 pr-16 relative bg-gradient-to-b -mt-[16%] from-black/20 via-[#121313] to-[#121313] pl-10">
        <div className="h-28 w-full flex justify-start items-center">
          <div className="w-14 h-14 bg-hover hover:scale-105 rounded-full flex items-center justify-center">
            <Image
              src={PlayIcon}
              id="collection_playbutton"
              onClick={playAllTracks}
              alt="play icon green"
              priority={true}
              height={25}
            />
          </div>
        </div>

        {/* Track List Header */}
        <div className="w-full flex flex-col">
          <div className="w-full h-[30px] border-b px-6 border-b-[#2B2A2B] flex items-center">
            <div className="w-[45%] h-full flex">
              <span className="mr-6 text-white text-sm font-book mb-4 opacity-70">
                #
              </span>
              <h1 className="text-white text-sm font-book mb-4 opacity-70">
                Title
              </h1>
            </div>
            <div className="w-[28%] h-full flex">
              <h1 className="text-white text-sm font-book mb-4 opacity-70">
                Album
              </h1>
            </div>
            <div className="w-[22%] h-full flex">
              <h1 className="text-white text-sm font-book mb-4 opacity-70">
                Date added
              </h1>
            </div>
            <div className="w-[10%] h-full flex justify-end">
              <h1 className="text-white text-xl font-book mb-4 opacity-70">
                <TbClock />
              </h1>
            </div>
          </div>

          {/* Track List */}
          {isLoading ? (
            // Loading state
            Array(6).fill(0).map((_, index) => (
              <div 
                key={index}
                className="w-full h-[70px] px-6 rounded-sm bg-[#2C2B30]/20 relative flex items-center py-5 animate-pulse"
              >
                <div className="w-[45%] h-full flex items-center">
                  <span className="mr-6 text-transparent bg-gray-700 rounded">00</span>
                  <div className="h-12 w-12 bg-gray-700 rounded"></div>
                  <div className="ml-4 h-8 w-32 bg-gray-700 rounded"></div>
                </div>
                <div className="w-[28%] h-8 bg-gray-700 rounded"></div>
                <div className="w-[22%] h-8 bg-gray-700 rounded"></div>
                <div className="w-[10%] h-8 bg-gray-700 rounded"></div>
              </div>
            ))
          ) : (
            // Display fetched tracks
            tracks.map((track, index) => {
              const isCurrentlyPlaying = currentPlayingId === track.id;
              const dateAdded = track.liked_at ? new Date(track.liked_at).toLocaleDateString() : "Unknown";
              
              return (
                <div
                  key={`track-${track.id}-${index}`}
                  id={`songs_wrapper_${index}`}
                  onMouseEnter={() => {
                    document
                      .getElementById(`song_playbutton_${index}`)
                      ?.classList.replace("invisible", "visible");
                    document
                      .getElementById(`playlist_heart_button_${index}`)
                      ?.classList.replace("invisible", "visible");
                    document
                      .getElementById(`song_index_${index}`)
                      ?.classList.replace("visible", "invisible");
                    document
                      .getElementById(`playlist_delete_button_${index}`)
                      ?.classList.replace("invisible", "visible");
                  }}
                  onMouseLeave={() => {
                    document
                      .getElementById(`song_playbutton_${index}`)
                      ?.classList.replace("visible", "invisible");
                    document
                      .getElementById(`playlist_heart_button_${index}`)
                      ?.classList.replace("visible", "invisible");
                    document
                      .getElementById(`song_index_${index}`)
                      ?.classList.replace("invisible", "visible");
                    document
                      .getElementById(`playlist_delete_button_${index}`)
                      ?.classList.replace("visible", "invisible");
                  }}
                  className={`w-full h-[70px] px-6 rounded-sm hover:bg-[#2C2B30]/70 relative flex items-center py-5 ${
                    isCurrentlyPlaying ? "bg-[#2C2B30]/70" : ""
                  }`}
                >
                  <div className="w-[45%] h-full flex items-center">
                    <span
                      id={`song_index_${index}`}
                      className={`mr-6 ${
                        isCurrentlyPlaying ? "invisible" : "visible"
                      } text-white text-lg font-book opacity-70`}
                    >
                      {index + 1}
                    </span>

                    <Image
                      src={
                        isCurrentlyPlaying && isPlaying
                          ? PauseIconWhite
                          : PlayIconWhite
                      }
                      className={`absolute ${
                        isCurrentlyPlaying ? "visible" : "invisible"
                      }`}
                      id={`song_playbutton_${index}`}
                      onClick={() => {
                        if (isCurrentlyPlaying) {
                          togglePlayPause();
                        } else {
                          playTrack(track, index);
                        }
                      }}
                      alt="play icon"
                      priority={true}
                      height={15}
                    />

                    <Image
                      src={getImageSrc(track.album?.cover_image_url)}
                      alt={track.title}
                      width={40}
                      height={40}
                      priority={true}
                      className="h-full w-fit object-cover"
                      unoptimized={true}
                    />

                    <div className="w-full h-full flex flex-col justify-center ml-4">
                      <h1
                        id={`song_title_${index}`}
                        className={`font-book ${
                          isCurrentlyPlaying ? "text-[#1DB954]" : "text-white"
                        } cursor-default`}
                      >
                        {track.title}
                      </h1>
                      <h1
                        className={`text-xs ${
                          isCurrentlyPlaying ? "text-[#1DB954]" : "text-[#B2B3B2]"
                        } mt-1`}
                      >
                        {track.artists && track.artists.length > 0
                          ? track.artists.map((artist, i) => (
                              <React.Fragment key={i}>
                                <span
                                  className={`${
                                    isCurrentlyPlaying
                                      ? "text-[#1DB954]"
                                      : "hover:text-white"
                                  } hover:underline cursor-pointer font-book`}
                                >
                                  {artist.name}
                                </span>
                                {i < track.artists.length - 1 && ", "}
                              </React.Fragment>
                            ))
                          : "Unknown Artist"}
                      </h1>
                    </div>
                  </div>

                  <div className="w-[28%] h-full flex items-center">
                    <h1 className="text-white text-sm font-book opacity-70">
                      {track.album?.title || "Unknown Album"}
                    </h1>
                  </div>

                  <div className="w-[22%] h-full flex items-center">
                    <h1 className="text-white text-sm font-book opacity-70">
                      {dateAdded}
                    </h1>
                  </div>

                  <div className="w-[10%] h-full flex items-center justify-end">
                    <div
                      id={`playlist_heart_button_${index}`}
                      className="cursor-pointer invisible mr-3"
                      onClick={(e) => unlikeTrack(e, track.id)}
                    >
                      <Image
                        src={HeartIconGreen}
                        alt="Heart Icon Green"
                        width={16}
                        height={16}
                        className="cursor-pointer"
                      />
                    </div>

                    <div
                      id={`playlist_delete_button_${index}`}
                      className="cursor-pointer invisible mr-3"
                      onClick={(e) => unlikeTrack(e, track.id)}
                    >
                      <RiDeleteBin6Line
                        className="text-[#B3B3B3] hover:text-white"
                        size={16}
                      />
                    </div>

                    <h1 className="text-white text-sm font-book opacity-70">
                      {formatDuration(track.duration_ms)}
                    </h1>
                  </div>
                </div>
              );
            })
          )}
          
          {!isLoading && tracks.length === 0 && (
            <div className="w-full flex flex-col items-center justify-center py-10">
              <h1 className="text-white text-xl font-bold mb-2">No liked songs yet</h1>
              <p className="text-gray-400">Save songs you like by clicking the heart icon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TracksSection;