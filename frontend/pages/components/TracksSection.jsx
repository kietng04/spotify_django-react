import Image from "next/image";
import React, { useEffect, useState } from "react";
import HeartIcon from "../../images/commonicons/hearticon.svg";
import DummyProfile from "../../images/commonimages/dummyprofile.jpeg";
import { changeHeaderBackgroundColor, playPauseAction } from "../../lib/tools";
import PlayIcon from "../../images/commonicons/playicon.svg";
import PauseIcon from "../../images/commonicons/pauseicon.svg";
import PlayIconWhite from "../../images/commonicons/playiconwhite.svg";
import PauseIconWhite from "../../images/commonicons/pauseiconwhite.svg";
import { TbClock } from "react-icons/tb";
import DummyMusicThumb1 from "../../images/commonimages/dummymusicthumb1.jpeg";
import { useTrack } from "../../context/TrackContext";

function TracksSection() {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistSource, setPlaylistSource] = useState(""); 
  const { 
    audioRef,
    setIsPlaying,
    setCurrentTrack,
    setTrackQueue,
    setCurrentIndex,
  } = useTrack();
  useEffect(() => {
    changeHeaderBackgroundColor("#190E3C");
    validateTokenAndFetchTracks();
  }, []);

  const playPlaylist = (tracks, startIndex = 0, source = "playlist", name = "Playlist") => {
    if (!tracks || tracks.length === 0) return;
    setCurrentPlaylist(tracks);
    setTrackQueue(tracks);
    setPlaylistName(name);
    setPlaylistSource(source);
    setCurrentIndex(startIndex);

    const trackToPlay = tracks[startIndex];
    playTrack(trackToPlay.id || trackToPlay);
  };

  const toggleQueueDisplay = () => {
    setShowQueue(prev => !prev);
  };

  const playTrack = async (trackId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/stream/${trackId}`);
      if (!response.ok) throw new Error('Lỗi khi lấy dữ liệu bài hát');
      
      const data = await response.json();
      
      const trackObj = tracks.find(t => t.id === trackId);
      
      if (trackObj) {
        setCurrentTrack({
          id: trackId,
          name: trackObj.title,
          artistName: trackObj.artists && trackObj.artists.length > 0 
            ? trackObj.artists[0].name 
            : "Unknown Artist",
          thumbnail: trackObj.album?.cover_image_url || null,
          duration: trackObj.duration_ms
        });
        
        if (audioRef.current) {
          audioRef.current.src = data.stream_url;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const playUserLikedSongs = async (startFromIndex = 0) => {
    try {

      const userDataString = localStorage.getItem('spotify_user');
    
      const token = userDataString ? JSON.parse(userDataString).token : null;
      if (!token || !userDataString) return;
      
      const userData = JSON.parse(userDataString);
      const userId = userData.user_id;
      const response = await fetch(`http://localhost:8000/api/liked-tracks/?user_id=${userId}`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.ok) {
        const tracks = await response.json();
        playPlaylist(tracks, startFromIndex, "liked", "Liked Songs");
      }
    } catch (error) {
      console.error('Error fetching liked songs for playback:', error);
    }
  };
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
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  
  // Format duration function
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isProduction = process.env.NODE_ENV !== "development";

  return (
    <div className="w-full relative">
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
          </div>
        </div>
      </div>

      <div className="w-[120%] z-10 relative -ml-[20%] h-[650px] bg-gradient-to-br -mt-[10%] from-[#5629F3]/90 via-[#5629F3]/50 to-black blur-2xl"></div>

      <div className="w-full h-[400px] z-50 pr-16 relative bg-gradient-to-b -mt-[16%] from-black/20 via-[#121313] to-[#121313] pl-10">
        <div className="h-28 w-full flex justify-start items-center">
          <div className="w-14 h-14 bg-hover hover:scale-105 rounded-full flex items-center justify-center">
          <Image
            src={PlayIcon}
            id="collection_playbutton"
            onClick={() => {
              playUserLikedSongs(0);
            }}
            alt="play icon green"
            priority={true}
            height={25}
          />
          </div>
        </div>

        <div className="w-full h-full flex flex-col">
          <div className="w-full h-[30px] border-b px-6 border-b-[#2B2A2B] flex items-center">
            <div className="w-[90%] h-full flex">
              <span className="mr-6 text-white text-sm font-book mb-4 opacity-70">
                #
              </span>
              <h1 className="text-white text-sm font-book mb-4 opacity-70">
                Title
              </h1>
            </div>
            <div className="w-[10%] h-full flex justify-end">
              <h1 className="text-white text-xl font-book mb-4 opacity-70">
                <TbClock />
              </h1>
            </div>
          </div>

          {isLoading ? (
            // Loading state
            Array(6).fill(0).map((_, index) => (
              <div 
                key={index}
                className="w-full h-[70px] px-6 rounded-sm bg-[#2C2B30]/20 relative flex items-center py-5 animate-pulse"
              >
                <div className="w-[90%] h-full flex items-center">
                  <span className="mr-6 text-transparent bg-gray-700 rounded">00</span>
                  <div className="h-12 w-12 bg-gray-700 rounded"></div>
                  <div className="ml-4 h-8 w-32 bg-gray-700 rounded"></div>
                </div>
                <div className="w-[10%] h-8 bg-gray-700 rounded"></div>
              </div>
            ))
          ) : (
            // Display fetched tracks
            tracks.map((track, index) => {
              return (
                <div
                  key={track.id}
                  id={`songs_wrapper_${index}`}
                  onMouseEnter={() => {
                    document
                      .getElementById(`song_playbutton_${index}`)
                      .classList.replace("invisible", "visible");
                    document
                      .getElementById(`song_index_${index}`)
                      .classList.replace("visible", "invisible");
                  }}
                  onMouseLeave={() => {
                    document
                      .getElementById(`song_playbutton_${index}`)
                      .classList.replace("visible", "invisible");

                    if (
                      document
                        .getElementById(`song_playbutton_${index}`)
                        .src.replace(
                          isProduction
                            ? process.env.NEXT_PUBLIC_BASE_PROD_URL
                            : process.env.NEXT_PUBLIC_BASE_DEV_URL,
                          ""
                        ) === PlayIconWhite.src
                    ) {
                      document
                        .getElementById(`song_index_${index}`)
                        .classList.replace("invisible", "visible");
                    }
                  }}
                  className="w-full h-[70px] px-6 rounded-sm hover:bg-[#2C2B30]/50 relative flex items-center py-5"
                >
                  <div className="w-[90%] h-full flex items-center">
                    <span
                      id={`song_index_${index}`}
                      className="mr-6 visible text-white text-lg font-book opacity-70"
                    >
                      {index + 1}
                    </span>

                    <Image
                      src={PlayIconWhite}
                      className="absolute invisible"
                      id={`song_playbutton_${index}`}
                      onClick={(e) => {
                        playPauseAction(
                          e.target,
                          PlayIconWhite,
                          PauseIconWhite,
                          PlayIcon,
                          PauseIcon
                        );
                        playUserLikedSongs(index);
                      }}
                      alt="play icon white"
                      priority={true}
                      height={15}
                    />
                    <Image
                      src={track.album?.cover_image_url || DummyMusicThumb1}
                      alt={track.title}
                      width={60}
                      height={60}
                      priority={true}
                      className="h-full w-fit"
                    />
                    <div className="w-full h-full flex flex-col justify-center ml-4">
                      <h1
                        id={`song_title_${index}`}
                        className="font-book text-white cursor-default"
                      >
                        {track.title}
                      </h1>
                      <h1 className="text-xs text-[#B2B3B2] mt-1">
                        {track.artists && track.artists.map((artist, i) => (
                          <React.Fragment key={artist.id}>
                            <span className="hover:text-white hover:underline cursor-pointer font-book">
                              {artist.name}
                            </span>
                            {i < track.artists.length - 1 && ", "}
                          </React.Fragment>
                        ))}
                      </h1>
                    </div>
                  </div>
                  <div className="w-[10%] h-full flex items-center justify-end">
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