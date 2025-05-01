import React, { useState, useEffect } from "react";
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
} from "../../lib/tools";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { useTrack } from "../../context/TrackContext";

function Hero() {
  const { isLoggedIn } = useAuth();
  const [heroMusicData, setHeroMusicData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageColor, setAverageColor] = useState("");
  

  const { playTrack: playTrackFromContext, isPlaying, currentTrack, togglePlayPause } = useTrack();

  const handlePlayTrack = (trackId) => {
    if (currentTrack?.id === trackId) {
      togglePlayPause();
      return;
    }
    playTrackFromContext(trackId);
  };

  useEffect(() => {
    greetingMessageShow();
    fetchHeroData();
  }, []);

  async function fetchHeroData() {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/recommended-tracks/");
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();

      const tracksWithPlayState = data.map((track) => ({
        ...track,
      }));

      setHeroMusicData(tracksWithPlayState);

      if (tracksWithPlayState.length > 0 && tracksWithPlayState[0].album?.cover_image_url) {
        getImageAverageColor(tracksWithPlayState[0].album.cover_image_url, setAverageColor);
      } else {
        setAverageColor("#070606");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setAverageColor("#070606");
    } finally {
      setIsLoading(false);
    }
  }

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
              const isCurrent = currentTrack?.id === data.id;
              const isThisPlaying = isCurrent && isPlaying;
              const coverUrl = data.track_cover_url;

              return (
                <div
                  key={data.id}
                  data-track-id={data.id}
                  onMouseEnter={() => {
                    if (coverUrl) {
                      getImageAverageColor(coverUrl, setAverageColor);
                    }
                  }}
                  onMouseLeave={() => {
                    const firstItemCover = heroMusicData[0]?.track_cover_url;
                    const fallbackCover = DummyMusicThumb1.src;
                    getImageAverageColor(firstItemCover || fallbackCover, setAverageColor);
                  }}
                  className="xl:w-[31.6%] lg:w-[48%] w-full z-50 music-card shadow-lg shadow-black/10 bg-opacity-40 cursor-pointer flex items-center xl:h-[45%] lg:h-[25%] h-[70px] mr-4 my-2 bg-[#313030] hover:bg-[#4a4a47] transition-colors rounded-sm relative"
                >
                  {coverUrl ? (
                    <img 
                      src={coverUrl} 
                      alt={data.title || 'Track cover'}
                      className="h-full w-[70px] shadow-lg shadow-black/50 object-cover"
                    />
                  ) : (
                    <div className="h-full w-[70px] bg-gray-700 flex items-center justify-center">
                      <i className="fas fa-music text-gray-400"></i> 
                    </div>
                  )}
                  
                  <div className="ml-4 flex-1 overflow-hidden">
                    <h3 className="text-white font-medium text-md truncate">
                      {data.title || 'Unknown Track'}
                    </h3>
                    {data.artists && data.artists.length > 0 && (
                      <p className="text-gray-400 text-sm truncate">
                        {data.artists.map(artist => artist.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <button className="h-12 shadow-lg shadow-black/50 flex items-center opacity-0 transition-opacity card-play-button justify-center w-12 bg-[#1DDF62] rounded-full absolute right-4">
                    <Image
                      src={isThisPlaying ? PauseIcon : PlayIcon}
                      onClick={(e) => {
                        handlePlayTrack(data.id);
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