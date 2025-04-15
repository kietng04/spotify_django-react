// Replace the current PlaylistSection code with this implementation
import Image from "next/image";
import React, { useEffect, useState } from "react";
import DummyProfile from "../../images/commonimages/dummyprofile.jpeg";
import DummyMusicThumb from "../../images/commonimages/dummymusicthumb4.jpeg";
import {
  changeHeaderBackgroundColor,
  getImageAverageColor,
  playPauseAction,
  FormatDuration,
} from "../../lib/tools";
import PlayIcon from "../../images/commonicons/playicon.svg";
import PauseIcon from "../../images/commonicons/pauseicon.svg";
import { TbClock } from "react-icons/tb";
import { useRouter } from "next/router";
import PlayIconWhite from "../../images/commonicons/playiconwhite.svg";
import PauseIconWhite from "../../images/commonicons/pauseiconwhite.svg";
import HeartIconGreen from "../../images/commonicons/hearticongreen.svg";
import HeartOutlineIcon from "../../images/commonicons/heartoutlineicon.svg";
import { useTrack } from "../../context/TrackContext";
import { Search2Icon, CloseIcon } from "@chakra-ui/icons";
import { InputGroup, InputRightElement, IconButton } from "@chakra-ui/react";
import { HiPlus, HiCheck } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
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
} from "@chakra-ui/react";
import { FaMusic } from "react-icons/fa";
function PlaylistSection() {
  const [playlist, setPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageColor, setAverageColor] = useState("");
  const [totalDuration, setTotalDuration] = useState(0);
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState(null);
  const fileInputRef = React.useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [databaseTracks, setDatabaseTracks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { id: playlistId } = router.query;
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

  const isProduction = process.env.NODE_ENV !== "development";

  useEffect(() => {
    if (currentTrack?.id) {
      setCurrentPlayingId(currentTrack.id);
    }
  }, [currentTrack]);

  const playTrack = (track, index) => {
    const tracks = playlistTracks.map((item) => item.track);
    setTrackQueue(tracks);
    setCurrentIndex(index);
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentPlayingId(track.id);
  };

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
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
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
        if (playlistData.cover_image_url) {
          getImageAverageColor(playlistData.cover_image_url, setAverageColor);
        } else {
          getImageAverageColor(DummyMusicThumb.src, setAverageColor);
        }
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

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setIsSearching(true);
        const userDataString = localStorage.getItem("spotify_user");
        const userData = userDataString ? JSON.parse(userDataString) : null;
        const token = userData?.token;

        const response = await fetch(
          "http://localhost:8000/api/random-tracks/",
          {
            headers: {
              Authorization: token ? `Token ${token}` : "",
            },
          }
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  const clearSearch = () => {
    setSearchQuery("");
  };

  const isTrackInPlaylist = (trackId) => {
    return playlistTracks.some((item) => item.track.id === trackId);
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
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
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
  const playAllTracks = () => {
    if (!playlistTracks.length) return;

    const tracks = playlistTracks.map((item) => item.track);
    setTrackQueue(tracks);
    setCurrentIndex(0);
    setCurrentTrack(tracks[0]);
    setIsPlaying(true);
  };

  if (isLoading || !playlist) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-white">Loading playlist...</div>
      </div>
    );
  }

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

  //cap nhat lại hình ảnh plays list
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
          headers: {
            Authorization: `Token ${token}`,
          },
          body: formData,
        }
      );
      if (response.ok) {
        const updatedPlaylist = await response.json();
        setPlaylist(updatedPlaylist);
        const playlistUpdateEvent = new CustomEvent("playlistUpdated", {
          detail: { playlistId: playlistId },
        });
        window.dispatchEvent(playlistUpdateEvent);
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

  //ham xoa nhac ra khoi pkaylist
  const removeTrackFromPlaylist = async (trackId, index) => {
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
          body: JSON.stringify({
            track_id: trackId,
          }),
        }
      );
      if (response.ok) {
        const updatedResponse = await fetch(
          `http://localhost:8000/api/playlist/${playlistId}/`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
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
  return (
    <div className="w-full relative">
      {/* Playlist Header */}
      <div className="w-full h-[340px] z-50 absolute top-0 flex items-center pl-10">
        <Image
          src={
            playlist.cover_image_url
              ? playlist.cover_image_url.startsWith("http")
                ? playlist.cover_image_url
                : `http://localhost:8000${playlist.cover_image_url}`
              : DummyMusicThumb.src
          }
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
              alt={`Creator Avatar`}
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
        </div>

        {/* Track List */}
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
                    src={
                      track.album?.cover_image_url
                        ? track.album.cover_image_url.startsWith("http")
                          ? track.album.cover_image_url
                          : `http://localhost:8000${track.album.cover_image_url}`
                        : DummyMusicThumb.src
                    }
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
                  <Image
                    src={HeartOutlineIcon}
                    onClick={(e) => {
                      if (e.target.src.includes(HeartOutlineIcon.src)) {
                        e.target.src = HeartIconGreen.src;
                      } else {
                        e.target.src = HeartOutlineIcon.src;
                      }
                    }}
                    alt={`Heart Icon`}
                    height={15}
                    width={15}
                    id={`playlist_heart_button_${index}`}
                    priority={true}
                    className="mr-8 cursor-pointer invisible"
                  />
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
                    src={
                      editImage ||
                      (playlist.cover_image_url.startsWith("http")
                        ? playlist.cover_image_url
                        : `http://localhost:8000${playlist.cover_image_url}`)
                    }
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
      <div className="px-10 pr-16 mb-6 pt-8 mt-4 border-t border-[#2B2A2B] bg-[#121313]">
        <h2 className="text-white text-lg font-bold mb-4">Add More Songs</h2>
        <InputGroup width="300px" mb={4} position="relative" zIndex="10">
          <Input
            placeholder="Search for songs"
            value={searchQuery}
            onChange={handleSearchChange}
            bg="#282828"
            color="white"
            border="none"
            _focus={{ border: "1px solid #1DB954" }}
            _hover={{ bg: "#3E3E3E" }}
            position="relative"
          />
          <InputRightElement>
            {searchQuery ? (
              <IconButton
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                color="gray.400"
                onClick={clearSearch}
                aria-label="Clear search"
                zIndex="11"
              />
            ) : (
              <Search2Icon color="gray.400" />
            )}
          </InputRightElement>
        </InputGroup>

        {/* Search Results */}
        <div className="w-full max-h-60 overflow-y-auto mb-6 custom-scrollbar">
          {isSearching ? (
            <div className="text-gray-300">Searching...</div>
          ) : filteredTracks.length > 0 ? (
            filteredTracks.slice(0, 5).map((track) => (
              <div
                key={`search-${track.id}`}
                className="flex items-center bg-[#181818] hover:bg-[#282828] p-2 rounded-md mb-2"
              >
                <div className="w-10 h-10 flex-shrink-0 mr-3 overflow-hidden">
                  <Image
                    src={
                      track.album?.cover_image_url
                        ? track.album.cover_image_url.startsWith("http")
                          ? track.album.cover_image_url
                          : `http://localhost:8000${track.album.cover_image_url}`
                        : DummyMusicThumb.src
                    }
                    alt={track.title}
                    width={40}
                    height={40}
                    className="object-cover"
                    unoptimized={true}
                  />
                </div>
                <div className="flex-grow mr-3">
                  <div className="text-white text-sm font-medium truncate">
                    {track.title}
                  </div>
                  <div className="text-gray-400 text-xs truncate">
                    {track.artists &&
                      track.artists.map((artist, i) => (
                        <React.Fragment key={i}>
                          {artist.name}
                          {i < track.artists.length - 1 && ", "}
                        </React.Fragment>
                      ))}
                    {track.album && ` • ${track.album.title}`}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <IconButton
                    icon={
                      isTrackInPlaylist(track.id) ? <HiCheck /> : <HiPlus />
                    }
                    colorScheme={isTrackInPlaylist(track.id) ? "green" : "gray"}
                    variant="ghost"
                    onClick={() => addTrackToPlaylist(track)}
                    disabled={isTrackInPlaylist(track.id)}
                    aria-label={isTrackInPlaylist(track.id) ? "Added" : "Add"}
                    title={
                      isTrackInPlaylist(track.id)
                        ? "Already in playlist"
                        : "Add to playlist"
                    }
                  />
                </div>
              </div>
            ))
          ) : searchQuery ? (
            <div className="text-gray-300">No tracks found</div>
          ) : (
            <div className="text-gray-300">
              Start typing to search for tracks
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlaylistSection;
