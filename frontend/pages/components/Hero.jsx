import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import DummyMusicThumb1 from "../../images/commonimages/dummymusicthumb1.jpeg";
import DummyMusicThumb2 from "../../images/commonimages/dummymusicthumb2.jpeg";
import DummyMusicThumb3 from "../../images/commonimages/dummymusicthumb3.jpeg";
import DummyMusicThumb4 from "../../images/commonimages/dummymusicthumb4.jpeg";
import DummyMusicThumb5 from "../../images/commonimages/dummymusicthumb5.jpeg";
import DummyMusicThumb6 from "../../images/commonimages/dummymusicthumb6.jpeg";
import PlayIcon from "../../images/commonicons/playicon.svg";
import PauseIcon from "../../images/commonicons/pauseicon.svg";
import {
  changeHeaderBackgroundColor,
  getImageAverageColor,
  greetingMessageShow,
  playPauseAction,
} from "../../lib/tools";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { useTrack } from "../../context/TrackContext";

function Hero() {
  const { isLoggedIn } = useAuth();
  const [heroMusicData, setHeroMusicData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageColor, setAverageColor] = useState("");
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const audioRef = useRef(null);
  

  const { playTrack: playTrackFromContext, isPlaying, currentTrack, togglePlayPause } = useTrack();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
    }
  }, []);

  const handlePlayTrack = (trackId) => {
    if (currentTrack?.id === trackId) {
      togglePlayPause();
      return;
    }

    playTrackFromContext(trackId);
  };

  const dummyMusicData = [
    {
      thumbnail: DummyMusicThumb5,
      name: "sao ko đôiẻ",
    },
    {
      thumbnail: DummyMusicThumb1,
      name: "Jamalul wujud",
    },
    {
      thumbnail: DummyMusicThumb2,
      name: "Muhammed al muqit",
    },
    {
      thumbnail: DummyMusicThumb3,
      name: "Jiske aane se muqammal",
    },
    {
      thumbnail: DummyMusicThumb4,
      name: "Ullinullil manju",
    },
    {
      thumbnail: DummyMusicThumb6,
      name: "Motivational speech",
    },
  ];


  useEffect(() => {
    const fetchRandomTracks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:8000/api/random-tracks/');
        
        if (response.ok) {
          const data = await response.json();
          const formattedData = data.map(track => ({
            thumbnail: track.album?.cover_image_url || DummyMusicThumb1.src,
            name: track.title,
            artistName: track.artists && track.artists.length > 0 ? track.artists[0].name : "Unknown Artist",
            id: track.id,
            uri: track.uri
          }));
          setHeroMusicData(formattedData);
        } else {
          console.error("Failed to fetch random tracks");
          setHeroMusicData(dummyMusicData);
        }
      } catch (error) {
        console.error("Error fetching random tracks:", error);
        setHeroMusicData(dummyMusicData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRandomTracks();
  }, []);

  const handlePlayLocal = async (trackId, buttonElement) => {
    if (!audioRef.current) return;
    
    try {
      if (currentPlayingId === trackId && !audioRef.current.paused) {
        audioRef.current.pause();
        setCurrentPlayingId(null);
        return;
      }
      
      audioRef.current.pause();
      
      const response = await fetch(`http://localhost:8000/api/stream/${trackId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stream URL');
      }
      
      const data = await response.json();
      
      audioRef.current.src = data.stream_url;
      audioRef.current.play();
      setCurrentPlayingId(trackId);
      
    } catch (error) {
      console.error('Error playing track:', error);
      alert('Error playing track. Please try again.');
    }
  };

  useEffect(() => {
    greetingMessageShow();
  }, []);


  useEffect(() => {
    changeHeaderBackgroundColor(
      averageColor === "" ? "#070606 " : averageColor,
      30
    );
  }, [averageColor]);

  const router = useRouter();

  return (
    <div id="hero" className={`h-[350px] w-full relative mb-8`}>
      <div className="h-16 flex items-center px-8">
        <div className="flex gap-2">
          <div className="bg-[#090909] w-8 h-8 rounded-full flex items-center justify-center cursor-not-allowed">
            <i className="fa-solid fa-angle-left"></i>
          </div>
          <div className="bg-[#090909] w-8 h-8 rounded-full flex items-center justify-center cursor-not-allowed">
            <i className="fa-solid fa-angle-right"></i>
          </div>
        </div>
      </div>

      <div
        id="hero_gradient"
        className="w-full brightness-[0.7] transition-colors duration-700 z-10 h-full absolute blur-3xl -mt-[10%] -ml-[10%]"
      ></div>

      <div className="lg:px-8 px-4 mt-20">
        <div className="w-full z-50 h-6 mb-4 mt-4 text-white text-3xl flex items-center">
          <h1 id="greeting-elem" className="z-50 font-bold"></h1>
        </div>
        <div className="w-full z-50 xl:h-[180px] lg:h-[280px] h-[240px] flex flex-wrap lg:overflow-hidden overflow-scroll">
          {isLoading ? (
           
            Array(6).fill(0).map((_, index) => (
              <div 
                key={index}
                className="xl:w-[31.6%] lg:w-[48%] w-full z-50 shadow-lg shadow-black/10 bg-opacity-40 flex items-center xl:h-[45%] lg:h-[25%] h-[70px] mr-4 my-2 bg-[#313030] rounded-sm relative"
              >
                <div className="h-full w-[70px] bg-[#232323] animate-pulse"></div>
                <div className="w-1/2 h-4 ml-4 bg-[#232323] animate-pulse"></div>
              </div>
            ))
          ) : (
            heroMusicData.map((data, index) => {
              return (
                <div
                  key={data.name + index}
                  data-track-id={data.id}
                  onMouseEnter={() =>
                    data.thumbnail && typeof data.thumbnail === 'string' 
                      ? getImageAverageColor(data.thumbnail, setAverageColor)
                      : getImageAverageColor(data.thumbnail.src, setAverageColor)
                  }
                  onMouseLeave={() =>
                    heroMusicData[0]?.thumbnail && typeof heroMusicData[0].thumbnail === 'string'
                      ? getImageAverageColor(heroMusicData[0].thumbnail, setAverageColor)
                      : getImageAverageColor(heroMusicData[0]?.thumbnail?.src || DummyMusicThumb1.src, setAverageColor)
                  }
                  className="xl:w-[31.6%] lg:w-[48%] w-full z-50 music-card shadow-lg shadow-black/10 bg-opacity-40 cursor-pointer flex items-center xl:h-[45%] lg:h-[25%] h-[70px] mr-4 my-2 bg-[#313030] hover:bg-[#4a4a47] transition-colors rounded-sm relative"
                >
                  {typeof data.thumbnail === 'string' ? (
                    <img 
                      src={data.thumbnail} 
                      alt={data.name} 
                      className="h-full w-[70px] shadow-lg shadow-black/50"
                    />
                  ) : (
                    <Image
                      src={data.thumbnail}
                      alt={data.name}
                      priority={true}
                      className="h-full w-fit shadow-lg shadow-black/50"
                    />
                  )}
                  <div className="ml-4">
                    <h3 className="text-white font-medium text-md">
                      {data.name}
                    </h3>
                    {data.artistName && (
                      <p className="text-gray-400 text-sm">
                        {data.artistName}
                      </p>
                    )}
                  </div>
                  <button className="h-12 shadow-lg shadow-black/50 flex items-center opacity-0 transition-opacity card-play-button justify-center w-12 bg-[#1DDF62] rounded-full absolute right-4">
                    <Image
                      src={currentTrack?.id === data.id && isPlaying ? PauseIcon : PlayIcon}
                      onClick={(e) => {
  
                        handlePlayTrack(data.id);
                        
                        playPauseAction(
                          e.target,
                          PlayIcon,
                          PauseIcon,
                          undefined,
                          undefined,
                        );
                      }}
                      height={19}
                      width={19}
                      alt="play pause icon black"
                      className="play_button"
                      data-track-id={data.id}
                    />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Hero;