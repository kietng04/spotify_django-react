import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useTrack } from "../../context/TrackContext";
import { TbClock } from "react-icons/tb";
import { Search2Icon, CloseIcon } from "@chakra-ui/icons";
import { HiPlus, HiCheck } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaMusic } from "react-icons/fa";

import DummyProfile from "../../images/commonimages/dummyprofile.jpeg";
import DummyMusicThumb from "../../images/commonimages/dummymusicthumb4.jpeg";
import PlayIcon from "../../images/commonicons/playicon.svg";
import PauseIcon from "../../images/commonicons/pauseicon.svg";
import PlayIconWhite from "../../images/commonicons/playiconwhite.svg";
import PauseIconWhite from "../../images/commonicons/pauseiconwhite.svg";
import HeartIconGreen from "../../images/commonicons/hearticongreen.svg";
import HeartOutlineIcon from "../../images/commonicons/heartoutlineicon.svg";

import {
  changeHeaderBackgroundColor,
  getImageAverageColor,
} from "../../lib/tools";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Grid,
  Box,
  Flex,
  Text,
  useDisclosure,
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";

function PlaylistSection() {
  // quna li nhac
  const [playlist, setPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageColor, setAverageColor] = useState("");
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentPlayingId, setCurrentPlayingId] = useState(null);

  // Edit
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [databaseTracks, setDatabaseTracks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  //
  const fileInputRef = useRef(null);

  const [likedTracks, setLikedTracks] = useState({});

  // Hooks
  const router = useRouter();
  const { id: playlistId } = router.query;
  const {
    setCurrentTrack,
    setTrackQueue,
    setIsPlaying,
    setCurrentIndex,
    currentTrack,
    isPlaying,
    togglePlayPause,
    playTrack: playTrackContext,
  } = useTrack();

  useEffect(() => {
    if (!playlistTracks.length) return;

    const checkLikedStatus = async () => {
      try {
        const userDataString = localStorage.getItem("spotify_user");
        if (!userDataString) return;

        const userData = JSON.parse(userDataString);
        const token = userData.token;
        const userId = userData.user_id;

        const trackLikeStatus = {};

        for (const item of playlistTracks) {
          const trackId = item.track.id;
          const response = await fetch(
            `http://localhost:8000/api/check-like-status/?user_id=${userId}&track_id=${trackId}`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            trackLikeStatus[trackId] = data.is_liked;
          }
        }

        setLikedTracks(trackLikeStatus);
      } catch (error) {
        console.error("Error checking liked tracks:", error);
      }
    };

    checkLikedStatus();
  }, [playlistTracks]);

  const handleLikeTrack = async (e, trackId) => {
    e.stopPropagation();

    try {
      const userDataString = localStorage.getItem("spotify_user");
      if (!userDataString) {
        alert("Bạn cần đăng nhập để thích bài hát");
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
          track_id: trackId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLikedTracks((prev) => ({
          ...prev,
          [trackId]: data.action === "like",
        }));

        const isNowLiked = data.action === "like";
        console.log(`Track ${isNowLiked ? "liked" : "unliked"} successfully`);
      }
    } catch (error) {
      console.error("Error updating like status:", error);
    }
  };

  useEffect(() => {
    if (currentTrack?.id) {
      setCurrentPlayingId(currentTrack.id);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (playlist) {
      setEditName(playlist.name);
      setEditDescription(playlist.description || "");
    }
  }, [playlist]);

  useEffect(() => {
    if (!playlistId) return;

    const fetchPlaylistData = async () => {
      setIsLoading(true);
      try {
        const userDataString = localStorage.getItem("spotify_user");
        if (!userDataString) return;

        const userData = JSON.parse(userDataString);
        const token = userData.token;
        const response = await fetch(
          `http://localhost:8000/api/playlist/${playlistId}/`,
          { headers: { Authorization: `Token ${token}` } }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch playlist");
        }

        const playlistData = await response.json();
        setPlaylist(playlistData);

        let duration = 0;
        if (playlistData.tracks) {
          playlistData.tracks.forEach((item) => {
            duration += item.track.duration_ms;
          });
          setTotalDuration(duration);
        }

        setPlaylistTracks(playlistData.tracks || []);

        const imageUrl = playlistData.cover_image_url || DummyMusicThumb.src;
        getImageAverageColor(imageUrl, setAverageColor);
      } catch (error) {
        console.error("Error fetching playlist:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylistData();
  }, [playlistId]);

  useEffect(() => {
    changeHeaderBackgroundColor(averageColor);
  }, [averageColor]);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setIsSearching(true);
        const userDataString = localStorage.getItem("spotify_user");
        const userData = userDataString ? JSON.parse(userDataString) : null;
        const token = userData?.token;

        const response = await fetch(
          "http://localhost:8000/api/random-tracks/",
          { headers: { Authorization: token ? `Token ${token}` : "" } }
        );

        if (response.ok) {
          const data = await response.json();
          setDatabaseTracks(data);
        }
      } catch (error) {
        console.error("Error fetching tracks:", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchTracks();
  }, []);

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
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

  const playTrack = (track, index) => {
    const tracks = playlistTracks.map((item) => item.track);
    setTrackQueue(tracks);
    setCurrentIndex(index);
    playTrackContext(track.id);
    setCurrentPlayingId(track.id);
  };

  const playAllTracks = () => {
    if (playlistTracks.length > 0) {
      const tracks = playlistTracks.map((item) => item.track);
      setTrackQueue(tracks);
      setCurrentIndex(0);
      playTrackContext(tracks[0].id);
    } else {
      console.log("Playlist is empty, cannot play.");
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const isTrackInPlaylist = (trackId) => {
    return playlistTracks.some((item) => item.track.id === trackId);
  };

  const filteredTracks = searchQuery.trim()
    ? databaseTracks.filter(
        (track) =>
          track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (track.artists &&
            track.artists.some((artist) =>
              artist.name.toLowerCase().includes(searchQuery.toLowerCase())
            )) ||
          (track.album &&
            track.album.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : databaseTracks;

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDetails = async () => {
    try {
      const userDataString = localStorage.getItem("spotify_user");
      if (!userDataString) {
        alert("Bạn cần đăng nhập để cập nhật playlist");
        return;
      }

      const userData = JSON.parse(userDataString);
      const token = userData.token;
      const formData = new FormData();

      formData.append("name", editName);
      formData.append("description", editDescription);

      if (editImage && editImage.startsWith("data:image")) {
        const response = await fetch(editImage);
        const blob = await response.blob();
        formData.append("cover_image", blob, "playlist_cover.jpg");
      }

      const response = await fetch(
        `http://localhost:8000/api/playlist/${playlistId}/`,
        {
          method: "PUT",
          headers: { Authorization: `Token ${token}` },
          body: formData,
        }
      );

      if (response.ok) {
        const updatedPlaylist = await response.json();
        setPlaylist(updatedPlaylist);

        window.dispatchEvent(
          new CustomEvent("playlistUpdated", {
            detail: { playlistId },
          })
        );

        if (editImage && updatedPlaylist.cover_image_url) {
          getImageAverageColor(
            updatedPlaylist.cover_image_url,
            setAverageColor
          );
        }

        onClose();
        alert("Cập nhật playlist thành công!");
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.detail || "Không thể cập nhật playlist"}`);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật playlist:", error);
      alert("Đã xảy ra lỗi khi cập nhật playlist. Vui lòng thử lại sau.");
    }
  };

  const addTrackToPlaylist = async (track) => {
    if (isTrackInPlaylist(track.id)) {
      alert("Bài hát này đã có trong playlist");
      return;
    }

    try {
      const userDataString = localStorage.getItem("spotify_user");
      if (!userDataString) {
        alert("Bạn cần đăng nhập để thêm bài hát");
        return;
      }

      const userData = JSON.parse(userDataString);
      const token = userData.token;

      const response = await fetch(
        `http://localhost:8000/api/playlist/${playlistId}/add-track/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            track_id: track.id,
            position: playlistTracks.length,
          }),
        }
      );

      if (response.ok) {
        const updatedResponse = await fetch(
          `http://localhost:8000/api/playlist/${playlistId}/`,
          { headers: { Authorization: `Token ${token}` } }
        );

        if (updatedResponse.ok) {
          const playlistData = await updatedResponse.json();
          setPlaylist(playlistData);
          setPlaylistTracks(playlistData.tracks || []);

          let duration = 0;
          if (playlistData.tracks) {
            playlistData.tracks.forEach((item) => {
              duration += item.track.duration_ms;
            });
            setTotalDuration(duration);
          }

          alert("Đã thêm bài hát vào playlist");
        }
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.detail || "Không thể thêm bài hát"}`);
      }
    } catch (error) {
      console.error("Lỗi khi thêm bài hát:", error);
      alert("Đã xảy ra lỗi khi thêm bài hát. Vui lòng thử lại sau.");
    }
  };

  //xoa nha =ra khoi play líy
  const removeTrackFromPlaylist = async (trackId) => {
    try {
      const userDataString = localStorage.getItem("spotify_user");
      if (!userDataString) {
        alert("Bạn cần đăng nhập để xóa bài hát");
        return;
      }

      const userData = JSON.parse(userDataString);
      const token = userData.token;

      const response = await fetch(
        `http://localhost:8000/api/playlist/${playlistId}/remove-track/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ track_id: trackId }),
        }
      );

      if (response.ok) {
        const updatedResponse = await fetch(
          `http://localhost:8000/api/playlist/${playlistId}/`,
          { headers: { Authorization: `Token ${token}` } }
        );

        if (updatedResponse.ok) {
          const playlistData = await updatedResponse.json();
          setPlaylist(playlistData);
          setPlaylistTracks(playlistData.tracks || []);

          let duration = 0;
          if (playlistData.tracks) {
            playlistData.tracks.forEach((item) => {
              duration += item.track.duration_ms;
            });
            setTotalDuration(duration);
          }

          alert("Đã xóa bài hát khỏi playlist");
        }
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.detail || "Không thể xóa bài hát"}`);
      }
    } catch (error) {
      console.error("Lỗi khi xóa bài hát:", error);
      alert("Đã xảy ra lỗi khi xóa bài hát. Vui lòng thử lại sau.");
    }
  };

  // Loading state
  if (isLoading || !playlist) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-white">Loading playlist...</div>
      </div>
    );
  }

  const deletePlaylist = async () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa playlist "${playlist.name}"?`)) {
      return;
    }
    try {
      const userDataString = localStorage.getItem("spotify_user");
      if (!userDataString) {
        alert("Bạn cần đăng nhập để xóa playlist");
        return;
      }

      const userData = JSON.parse(userDataString);
      const token = userData.token;

      const response = await fetch(
        `http://localhost:8000/api/playlist/${playlistId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.ok) {
        window.dispatchEvent(
          new CustomEvent("playlistUpdated", {
            detail: { playlistId, action: "delete" },
          })
        );

        alert("Playlist đã được xóa thành công");
        router.push("/");
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Server error:", errorData);
        alert(
          `Lỗi khi xóa playlist: ${errorData.error || response.statusText}`
        );
      }
    } catch (error) {
      console.error("Lỗi khi xóa playlist:", error);
      alert("Đã xảy ra lỗi khi xóa playlist. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="w-full relative">
      {/* Playlist Header */}
      <div className="w-full h-[340px] z-50 absolute top-0 flex items-center pl-10">
        <Image
          src={getImageSrc(playlist.cover_image_url)}
          alt={playlist.name}
          height={230}
          width={230}
          priority={true}
          className="mt-16 shadow-lg shadow-black/20"
          unoptimized={true}
        />
        <div className="w-auto h-[230px] mt-16 ml-6 flex flex-col justify-end">
          <h1 className="text-white uppercase text-xs font-bold">playlist</h1>
          <h1
            className="text-white text-[4.5rem] font-black cursor-pointer"
            onClick={onOpen}
          >
            {playlist.name}
          </h1>
          <div className="flex items-center">
            <Image
              src={DummyProfile}
              alt="Creator Avatar"
              height={25}
              width={25}
              priority={true}
              className="rounded-full"
            />
            <h1 className="ml-2 text-white hover:underline font-book text-sm cursor-pointer">
              {playlist.creator_username || "User"}
            </h1>
            <span className="mx-2 text-white text-2xl">·</span>
            <h1 className="text-white font-book text-sm cursor-default">
              {playlistTracks.length} songs
            </h1>
            <span className="mx-2 text-white text-2xl">·</span>
            <h1 className="text-white font-book text-sm cursor-default">
              {formatTotalDuration(totalDuration)}
            </h1>
          </div>
        </div>
      </div>

      {/* Gradient background */}
      <div
        id="playlist_gradient"
        className="w-[120%] transition-colors duration-700 z-10 relative -ml-[20%] h-[750px] -mt-[10%] blur-2xl"
      ></div>

      {/* Playlist Content */}
      <div className="w-full z-50 pr-16 relative bg-gradient-to-b -mt-[24%] from-black/20 via-[#121313] to-[#121313] pl-10">
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
          <div className="w-14 h-14 bg-[#e91429] hover:bg-[#f02e41] hover:scale-105 rounded-full flex items-center justify-center ml-4">
            <RiDeleteBin6Line
              onClick={deletePlaylist}
              className="text-white cursor-pointer"
              size={25}
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
          {playlistTracks.map((item, index) => {
            const track = item.track;
            const isCurrentlyPlaying = currentPlayingId === track.id;
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
                    {new Date(item.added_at).toLocaleDateString()}
                  </h1>
                </div>

                <div className="w-[10%] h-full flex items-center justify-end">
                  <div className="flex items-center mr-5">
                    {likedTracks[track.id] ? (
                      <Image
                        src={HeartIconGreen}
                        alt="Heart Icon"
                        width={16}
                        height={16}
                        onClick={(e) => handleLikeTrack(e, track.id)}
                        className="cursor-pointer"
                      />
                    ) : (
                      <Image
                        src={HeartOutlineIcon}
                        alt="Heart Outline Icon"
                        width={16}
                        height={16}
                        onClick={(e) => handleLikeTrack(e, track.id)}
                        className="cursor-pointer opacity-70 hover:opacity-100"
                      />
                    )}
                  </div>

                  <div
                    className="cursor-pointer invisible mr-3"
                    id={`playlist_delete_button_${index}`}
                    onClick={() => removeTrackFromPlaylist(track.id, index)}
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
          })}
        </div>
      </div>

      {/* Edit Playlist Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay bg="rgba(0,0,0,0.8)" />
        <ModalContent bg="#121212" color="white" borderRadius="md">
          <ModalHeader fontSize="2xl" fontWeight="bold" pb={4}>
            Edit details
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody pb={6}>
            <Grid templateColumns={{ base: "1fr", md: "200px 1fr" }} gap={6}>
              {/* Image Upload Section */}
              <Box
                width="100%"
                height="200px"
                bg="#333333"
                display="flex"
                justifyContent="center"
                alignItems="center"
                borderRadius="md"
                cursor="pointer"
                position="relative"
                overflow="hidden"
                _hover={{ bg: "#3E3E3E" }}
                onClick={() => fileInputRef.current.click()}
              >
                {editImage || playlist.cover_image_url ? (
                  <Image
                    src={editImage || getImageSrc(playlist.cover_image_url)}
                    alt="Playlist cover"
                    fill={true}
                    style={{ objectFit: "cover" }}
                    unoptimized={true}
                  />
                ) : (
                  <Flex direction="column" align="center">
                    <FaMusic size="60px" color="#777777" />
                    <Text color="#B3B3B3" fontSize="sm" mt={2}>
                      Choose image
                    </Text>
                  </Flex>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                  accept="image/*"
                />
              </Box>

              <Box>
                <FormControl mb={4}>
                  <FormLabel color="#B3B3B3" fontSize="sm">
                    Name
                  </FormLabel>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    bg="#333333"
                    border="1px solid #555555"
                    color="white"
                    _focus={{ borderColor: "#1DB954" }}
                    autoFocus
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="#B3B3B3" fontSize="sm">
                    Description
                  </FormLabel>
                  <Textarea
                    placeholder="Add an optional description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    bg="#333333"
                    border="1px solid #555555"
                    color="white"
                    _placeholder={{ color: "#B3B3B3" }}
                    height="150px"
                    resize="vertical"
                  />
                </FormControl>
              </Box>
            </Grid>

            <Box mt={8} fontSize="xs" color="#B3B3B3" pb={4}>
              By proceeding, you agree to give Spotify access to the image you
              choose to upload. Please make sure you have the right to upload
              the image.
            </Box>

            <Flex justifyContent="flex-end" mt={4}>
              <Button
                bg="white"
                color="black"
                borderRadius="full"
                px={8}
                _hover={{ bg: "#EFEFEF" }}
                onClick={handleSaveDetails}
              >
                Save
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default PlaylistSection;
