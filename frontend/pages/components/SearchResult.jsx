import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useRecoilState } from "recoil";
import { searchValue } from "../../atoms/searchAtom";
import DummyMusicThumb from "../../images/commonimages/dummymusicthumb4.jpeg";
import PlayIcon from "../../images/commonicons/playicon.svg";
import PauseIcon from "../../images/commonicons/pauseicon.svg";
import { changeHeaderBackgroundColor, playPauseAction } from "../../lib/tools";
import PlayIconWhite from "../../images/commonicons/playiconwhite.svg";
import PauseIconWhite from "../../images/commonicons/pauseiconwhite.svg";
import HeartIconGreen from "../../images/commonicons/hearticongreen.svg";
import HeartOutlineIcon from "../../images/commonicons/heartoutlineicon.svg";
import Section from "./Section";
import { useTrack } from "../../context/TrackContext";

function SearchResult() {
  let [searchQuery, setSearchQuery] = useRecoilState(searchValue);
  let router = useRouter();
  let search_query = router.query.search_query;
  
  const { playTrack, isPlaying, currentTrack } = useTrack();
  const isProduction = process.env.NODE_ENV !== "development";
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [topResult, setTopResult] = useState(null);
  const [likedTracks, setLikedTracks] = useState({});


  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const fetchSearchResults = async (query) => {
    if (!query) {
      setSearchResults([]);
      setTopResult(null);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8000/api/search/tracks/?q=${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        
        if (data.length > 0) {
          const sorted = [...data].sort((a, b) => b.popularity - a.popularity);
          setTopResult(sorted[0]);
        } else {
          setTopResult(null);
        }
      } else {
        console.error('Search request failed');
        setSearchResults([]);
        setTopResult(null);
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle like status for a track
  const toggleLike = (trackId) => {
    setLikedTracks(prev => ({
      ...prev,
      [trackId]: !prev[trackId]
    }));
  };

  // Handle playing a track
  const handlePlayTrack = (trackId) => {
    playTrack(trackId);
  };

  useEffect(() => {
    changeHeaderBackgroundColor("#070606", 30);
  }, []);

  useEffect(() => {
    if (search_query) {
      fetchSearchResults(search_query);
      setSearchQuery(search_query); // Update the recoil state
    }
  }, [search_query, setSearchQuery]);

  return (
    <div className="w-full h-auto min-h-screen mt-20 pb-32">
      <div className="w-full h-auto flex flex-col lg:flex-row">
        {/* Top Result Section */}
        <div className="w-full lg:w-[45%] h-full flex flex-col px-5 lg:px-10 pb-4">
          <h1 className="text-white text-2xl font-bold mt-2">Top Result</h1>
          
          {isLoading ? (
            // Loading skeleton for top result
            <div className="h-[240px] bg-[#191918] relative rounded-md w-full mt-6 p-5 animate-pulse">
              <div className="h-[90px] w-[90px] bg-[#2a2a2a] rounded-md"></div>
              <div className="w-3/4 h-8 bg-[#2a2a2a] rounded mt-6"></div>
              <div className="flex mt-4 items-center">
                <div className="w-1/2 h-4 bg-[#2a2a2a] rounded"></div>
              </div>
            </div>
          ) : topResult ? (
            // Actual top result
            <div className="h-auto min-h-[240px] bg-[#191918] hover:bg-[#282828] relative music-card transition-colors cursor-pointer rounded-md w-full mt-6 p-5">
              <Image
                src={topResult.album?.cover_image_url || DummyMusicThumb}
                alt={topResult.title}
                priority={true}
                width={90}
                height={90}
                className="rounded-md shadow-lg shadow-black/30"
              />
              <h1 className="text-3xl text-white overflow-hidden whitespace-nowrap text-ellipsis font-bold tracking-tighter mt-6">
                {topResult.title}
              </h1>
              <div className="flex mt-4 items-center">
                <p className="text-[#B3B2B2] text-sm">
                  {topResult.artists.map((artist, idx) => (
                    <React.Fragment key={artist.id}>
                      <span className="font-book">{artist.name}</span>
                      {idx < topResult.artists.length - 1 && <span className="mr-1">,</span>}
                    </React.Fragment>
                  ))}
                </p>
                <p className="text-white ml-3 text-sm py-1.5 rounded-full px-4 bg-[#131212]">
                  Song
                </p>
              </div>
              <button className="h-12 shadow-lg shadow-black/50 flex items-center translate-y-[10px] opacity-0 transition-all duration-300 card-play-button justify-center w-12 bg-[#1DDF62] rounded-full absolute right-6 bottom-6">
                <Image
                  src={currentTrack?.id === topResult.id && isPlaying ? PauseIcon : PlayIcon}
                  onClick={() => handlePlayTrack(topResult.id)}
                  height={19}
                  width={19}
                  alt="play icon black"
                  className="play_button"
                />
              </button>
            </div>
          ) : search_query ? (
            // No results found
            <div className="h-[240px] bg-[#191918] relative rounded-md w-full mt-6 p-5 flex items-center justify-center">
              <p className="text-white text-lg">No top result found</p>
            </div>
          ) : (
            // No search query
            <div className="h-[240px] bg-[#191918] relative rounded-md w-full mt-6 p-5 flex items-center justify-center">
              <p className="text-white text-lg">Enter a search query</p>
            </div>
          )}
        </div>
        
        {/* Songs Section */}
        <div className="w-full lg:w-[55%] h-full flex flex-col px-5 lg:pr-10 lg:pl-5 pb-4">
          <h1 className="text-white text-2xl font-bold mt-2">Songs</h1>
          <div className="h-full rounded-md w-full mt-6 flex flex-col">
            {isLoading ? (
              // Loading skeletons for songs
              Array(4).fill(0).map((_, index) => (
                <div key={index * 1666} className="w-full h-[60px] pr-6 pl-3 rounded-md bg-[#191918]/40 animate-pulse flex items-center py-5 mb-2">
                  <div className="w-[35px] h-[35px] bg-[#2a2a2a] rounded"></div>
                  <div className="ml-4">
                    <div className="w-[150px] h-4 bg-[#2a2a2a] rounded"></div>
                    <div className="w-[100px] h-3 bg-[#2a2a2a] mt-2 rounded"></div>
                  </div>
                </div>
              ))
            ) : searchResults.length > 0 ? (
              // Actual search results
              searchResults.slice(0, 4).map((track, index) => {
                return (
                  <div
                    key={track.id}
                    id={`songs_wrapper_${index}`}
                    onMouseEnter={() => {
                      document
                        .getElementById(`song_playbutton_${index}`)
                        .classList.replace("invisible", "visible");
                      document
                        .getElementById(`playlist_heart_button_${index}`)
                        .classList.replace("invisible", "visible");
                    }}
                    onMouseLeave={() => {
                      document
                        .getElementById(`song_playbutton_${index}`)
                        .classList.replace("visible", "invisible");
                      document
                        .getElementById(`playlist_heart_button_${index}`)
                        .classList.replace("visible", "invisible");
                    }}
                    className={`w-full h-[60px] pr-6 pl-3 rounded-md hover:bg-[#2C2B30]/70 relative flex items-center py-5 mb-2 ${currentTrack?.id === track.id ? 'bg-[#2C2B30]/70' : ''}`}
                  >
                    <div className="w-full h-full flex items-center">
                      <Image
                        src={currentTrack?.id === track.id && isPlaying ? PauseIconWhite : PlayIconWhite}
                        className="absolute invisible ml-3"
                        id={`song_playbutton_${index}`}
                        onClick={() => handlePlayTrack(track.id)}
                        alt="play icon"
                        priority={true}
                        height={15}
                        width={15}
                      />
                      <Image
                        src={track.album?.cover_image_url || DummyMusicThumb}
                        alt={track.title}
                        priority={true}
                        height={35}
                        width={35}
                        className="object-cover"
                      />
                      <div className="w-full h-full flex flex-col justify-center ml-4">
                        <h1
                          id={`song_title_${index}`}
                          className={`font-book ${currentTrack?.id === track.id ? 'text-hover' : 'text-white'} cursor-default`}
                        >
                          {track.title}
                        </h1>
                        <h1 className="text-xs text-[#B2B3B2] mt-1">
                          {track.artists.map((artist, idx) => (
                            <React.Fragment key={artist.id}>
                              <span className="hover:text-white hover:underline cursor-pointer font-book">
                                {artist.name}
                              </span>
                              {idx < track.artists.length - 1 && <span className="mr-1">,</span>}
                            </React.Fragment>
                          ))}
                        </h1>
                      </div>
                    </div>
                    <div className="w-[10%] h-full flex items-center justify-end">
                      <Image
                        src={likedTracks[track.id] ? HeartIconGreen : HeartOutlineIcon}
                        onClick={() => toggleLike(track.id)}
                        alt={`Heart Icon`}
                        height={15}
                        width={15}
                        id={`playlist_heart_button_${index}`}
                        priority={true}
                        className="mr-8 cursor-pointer invisible"
                      />
                      <h1 className="text-white text-sm font-book opacity-70">
                        {formatDuration(track.duration_ms)}
                      </h1>
                    </div>
                  </div>
                );
              })
            ) : search_query ? (
              // No songs found
              <div className="text-white text-center py-8">
                No songs found matching "{search_query}"
              </div>
            ) : (
              // No search query yet
              <div className="text-white text-center py-8">
                Enter a search query to find songs
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Other sections - these could be extended to show actual data from API */}
      <Section section_name="Artists" rounded hideShowAll={true} />
      <Section section_name="Albums" hideShowAll={true} />
      <Section section_name="Podcasts" play_button={false} hideShowAll={true} />
      <Section section_name="Episodes" play_button={false} hideShowAll={true} />
    </div>
  );
}

export default SearchResult;