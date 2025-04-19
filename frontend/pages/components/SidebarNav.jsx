import React, { useEffect, useState } from "react";
import HomeIcon from "../../images/commonicons/homeicon.svg";
import SearchIcon from "../../images/commonicons/searchicon.svg";
import LibraryIcon from "../../images/commonicons/libraryicon.svg";
import HomeIconActive from "../../images/commonicons/homeiconactive.svg";
import SearchIconActive from "../../images/commonicons/searchiconactive.svg";
import LibraryIconActive from "../../images/commonicons/libraryiconactive.svg";
import PlusIcon from "../../images/commonicons/plusicon.svg";
import HeartIcon from "../../images/commonicons/hearticon.svg";
import SaveIconGreen from "../../images/commonicons/saveicongreen.svg";
import DownloadIcon from "../../images/commonicons/downloadicon.svg";
import SoundIconGreen from "../../images/commonicons/soundicongreen.svg";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

function SidebarNav() {
  const [activeNav, setActiveNav] = useState("");
  const router = useRouter();
  const [playlists, setPlaylists] = useState([
    { id: 1, name: "Playlist #1", isActive: false },
   
  ]);

  const fetchPlaylists = async () => {
    try {
      const userDataString = localStorage.getItem("spotify_user");
      if (!userDataString) return;
      
      const userData = JSON.parse(userDataString);
      const token = userData.token;
      
      const response = await fetch("http://localhost:8000/api/playlist/", {
        headers: { Authorization: `Token ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const followedResponse = await fetch(
          "http://localhost:8000/api/playlist/followed/",
          { headers: { Authorization: `Token ${token}` } }
        );
        
        let followedPlaylistIds = [];
        if (followedResponse.ok) {
          const followedData = await followedResponse.json();
          followedPlaylistIds = followedData.map((playlist) => playlist.id);
        }
        
        const formattedPlaylists = data.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          imageUrl: playlist.cover_image_url ? 
            `${playlist.cover_image_url}?t=${new Date().getTime()}` : null,
          isActive: window.location.pathname === `/playlist/${playlist.id}`,
          isFollowing: followedPlaylistIds.includes(playlist.id),
        }));
        
        setPlaylists(formattedPlaylists);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (addedTracks.length === 0) {
      alert("Vui lòng thêm ít nhất một bài hát vào playlist");
      return;
    }

    try {
      const userDataString = localStorage.getItem("spotify_user");
      if (!userDataString) {
        alert("Bạn cần đăng nhập để tạo playlist");
        return;
      }

      const userData = JSON.parse(userDataString);
      const token = userData.token;
      const trackIds = addedTracks.map((track) => track.id);
      const formData = new FormData();
      
      formData.append("name", playlistName);
      formData.append("description", playlistDescription);
      trackIds.forEach((id) => formData.append("tracks", id));

      if (playlistImage && playlistImage.startsWith("data:image")) {
        const response = await fetch(playlistImage);
        const blob = await response.blob();
        formData.append("cover_image", blob, "playlist_cover.jpg");
      }

      const response = await fetch("http://localhost:8000/api/playlist/", {
        method: "POST",
        headers: { Authorization: `Token ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        alert("Playlist đã được tạo thành công!");
        window.location.href = `/playlist/${data.id}`;
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.detail || "Không thể tạo playlist"}`);
      }
    } catch (error) {
      console.error("Lỗi khi tạo playlist:", error);
      alert("Đã xảy ra lỗi khi tạo playlist. Vui lòng thử lại sau.");
    }
  };

  const handleNavClick = (navName) => setActiveNav(navName);

  const handlePlaylistClick = (playlistId) => {
    setPlaylists((prevPlaylists) =>
      prevPlaylists.map((playlist) => ({
        ...playlist,
        isActive: playlist.id === playlistId,
      }))
    );
  };

  const followPlaylist = async (playlistId) => {
    try {
      const userDataString = localStorage.getItem("spotify_user");
      if (!userDataString) {
        alert("Bạn cần đăng nhập để theo dõi playlist");
        return;
      }
      
      const userData = JSON.parse(userDataString);
      const token = userData.token;

      const response = await fetch(
        "http://localhost:8000/api/playlist/follow/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ playlist_id: playlistId }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.action === "follow") {
          console.log(`Followed playlist: ${playlistId}`);
        } else {
          console.log(`Unfollowed playlist: ${playlistId}`);
        }
        return data;
      } else {
        const errorData = await response.json();
        console.error("Error following playlist:", errorData);
        return null;
      }
    } catch (error) {
      console.error("Error in followPlaylist:", error);
      return null;
    }
  };

  useEffect(() => {
    setActiveNav(
      window.location.pathname === "/search"
        ? "search"
        : window.location.pathname.includes("/search/")
        ? "search"
        : window.location.pathname === "/collection/tracks"
        ? "liked_songs"
        : window.location.pathname === "/collection/episodes"
        ? "your_episodes"
        : window.location.pathname.includes("/playlist")
        ? ""
        : "home"
    );

    fetchPlaylists();
    
    if (window.location.pathname.includes("/playlist/")) {
      const playlistId = window.location.pathname.split("/playlist/")[1];
      setPlaylists((prevPlaylists) =>
        prevPlaylists.map((playlist) => ({
          ...playlist,
          isActive: playlist.id.toString() === playlistId,
        }))
      );
    }
  }, []);
  
  useEffect(() => {
    const handlePlaylistUpdate = () => {
      console.log("Playlist updated event received");
      fetchPlaylists(); 
    };
    
    window.addEventListener('playlistUpdated', handlePlaylistUpdate);
    
    return () => {
      window.removeEventListener('playlistUpdated', handlePlaylistUpdate);
    };
  }, []);

  const renderNavItem = (navName, iconSrc, activeIconSrc, label) => {
    const isActive = activeNav === navName;
    
    return (
      <Link
        href={navName === "search" ? "/search" : "/"}
        className={`w-full h-full flex items-center pl-6 font-medium text-sm hover:text-white transition-colors cursor-pointer ${
          isActive ? "text-white" : "text-[#B3B3B3]"
        }`}
        onClick={() => handleNavClick(navName)}
      >
        <Image
          className={`mr-4 ${isActive ? "opacity-100" : "opacity-70"}`}
          src={isActive ? activeIconSrc : iconSrc}
          alt={`${label} Icon`}
          height={25}
          width={25}
          priority={true}
        />
        {label}
      </Link>
    );
  };

  const renderSecondaryNavItem = (navName, iconSrc, label, first = false) => {
    const isActive = activeNav === navName;
    const navPaths = {
      liked_songs: "/collection/tracks",
      your_episodes: "/collection/episodes",
      create_playlist: "/create-playlist"
    };

    return (
      <Link
        href={navPaths[navName] || "/"}
        className={`w-full h-full ${
          first ? "mt-7" : "mt-1"
        } flex items-center pl-6 font-medium relative text-sm hover:text-white transition-colors cursor-pointer ${
          isActive ? "text-white" : "text-[#B3B3B3] secondary-nav-wrapper"
        }`}
        onClick={() => handleNavClick(navName)}
      >
        <div
          className={`w-7 h-7 mr-4 ${
            navName === "create_playlist"
              ? "bg-[#B2B3B3]"
              : navName === "liked_songs"
              ? "bg-gradient-to-br from-[#4C1BF3] to-white"
              : navName === "downloaded"
              ? "bg-gradient-to-br from-blue-700 to-white"
              : navName === "your_episodes"
              ? "bg-green-900"
              : ""
          } flex items-center justify-center rounded-sm secondary-nav transition-opacity ${
            isActive ? "opacity-100" : "opacity-70"
          }`}
        >
          <Image
            src={iconSrc}
            alt={`${label} Icon`}
            height={["create_playlist", "liked_songs"].includes(navName) ? 13 : 17}
            width={["create_playlist", "liked_songs"].includes(navName) ? 13 : 17}
            priority={true}
          />
        </div>
        {label}
        {navName !== "create_playlist" && (
          <Image
            src={SoundIconGreen}
            alt="sound icon green"
            id={navName + "_soundicon"}
            priority={true}
            height={15}
            className="absolute right-6 opacity-0 transition-opacity"
          />
        )}
      </Link>
    );
  };

  const renderPlaylistItem = (playlist) => (
    <div className="flex items-center w-full" key={playlist.id}>
      <Link
        href={`/playlist/${playlist.id}`}
        className={`flex-grow h-10 flex items-center pl-6 font-medium text-sm hover:text-white transition-colors cursor-pointer relative ${
          playlist.isActive ? "text-white" : "text-[#B3B3B3]"
        }`}
        onClick={() => handlePlaylistClick(playlist.id)}
      >
        {playlist.imageUrl ? (
          <div className="w-6 h-6 mr-3 overflow-hidden rounded-sm bg-[#282828] flex items-center justify-center">
            <img
              src={
                playlist.imageUrl.startsWith("/")
                  ? `http://localhost:8000${playlist.imageUrl}`
                  : playlist.imageUrl
              }
              alt={`${playlist.name} cover`}
              className="object-cover w-6 h-6"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div className="hidden w-full h-full items-center justify-center">
              <span className="text-xs text-[#B3B3B3]">♫</span>
            </div>
          </div>
        ) : (
          <div className="w-6 h-6 mr-3 bg-[#282828] flex items-center justify-center rounded-sm">
            <span className="text-xs text-[#B3B3B3]">♫</span>
          </div>
        )}
        <span className="truncate">{playlist.name}</span>
        {playlist.isActive && (
          <Image
            src={SoundIconGreen}
            alt="sound icon green"
            priority={true}
            height={15}
            className="absolute right-6 opacity-100 transition-opacity"
          />
        )}
      </Link>
      <div
        className="pr-3 opacity-0 hover:opacity-100 cursor-pointer text-[#B3B3B3] hover:text-white"
        onClick={(e) => {
          e.preventDefault();
          followPlaylist(playlist.id);
        }}
        title={playlist.isFollowing ? "Unfollow" : "Follow"}
      >
        {playlist.isFollowing ? "♥" : "♡"}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full pb-24">
        <div className="h-[20rem] w-full flex flex-col">
          {renderNavItem("home", HomeIcon, HomeIconActive, "Home")}
          {renderNavItem("search", SearchIcon, SearchIconActive, "Search")}
          {renderNavItem("library", LibraryIcon, LibraryIconActive, "Your Library")}
          {renderSecondaryNavItem("create_playlist", PlusIcon, "Create Playlist", true)}
          {renderSecondaryNavItem("liked_songs", HeartIcon, "Liked Songs")}
        </div>

        <div className="mt-6 border-t border-[#282828] pt-4 flex-grow overflow-y-auto custom-scrollbar">
          <h3 className="text-xs uppercase text-[#B3B3B3] font-bold tracking-wider px-6 mb-2">
            Playlists
          </h3>
          <div className="playlist-container pb-24">
            {playlists.map(renderPlaylistItem)}
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #2c2b2b;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #7a7a7a;
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #535353 transparent;
        }
      `}</style>
    </>
  );
}

export default SidebarNav;