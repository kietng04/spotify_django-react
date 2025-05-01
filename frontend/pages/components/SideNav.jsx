import React from 'react'
import Image from "next/image"
import SpotifyWhiteLogo from "../../images/logos/Spotify_Logo_RGB_White.png"
import SidebarNav from "../components/SidebarNav"; 
import PlaylistsSidebar from './PlaylistsSidebar'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SoundIconGreen from "../../images/commonicons/soundicongreen.svg"
import SpotifyGreenIcon from "../../images/icons/Spotify_Icon_RGB_Green.png"




function SideNav() {
  const [playlists, setPlaylists] = useState([]);
  let router = useRouter()
  const fetchPlaylists = async () => {
    try {
      const userDataString = localStorage.getItem("spotify_user");
      if (!userDataString) return;
      
      const userData = JSON.parse(userDataString);
      const token = userData.token;
      
      const response = await fetch("http://localhost:8000/api/playlist/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };
  
  useEffect(() => {
    fetchPlaylists();
  }, []);
  
  useEffect(() => {
    const handlePlaylistUpdate = () => {
      console.log("Playlist update event received");
      fetchPlaylists();
    };
    window.addEventListener("playlistUpdated", handlePlaylistUpdate);
    return () => {
      window.removeEventListener("playlistUpdated", handlePlaylistUpdate);
    };
  }, []);
  return (
    <div className='bg-[#010001] z-50 lg:w-[17%] min-w-[200px] hidden h-full sm:flex flex-col items-center' >
        <div className="h-24 w-full  flex items-center pl-6">
            <Image onClick={()=> router.push("/")}  src={SpotifyWhiteLogo} alt="Spotify White Logo" priority={true} height={40} className="cursor-pointer" />
        </div>
        <SidebarNav />
        <PlaylistsSidebar />
    </div>
  )
}

export default SideNav