import React, { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useMemo } from "react";
import { FaTrash } from "react-icons/fa";
import {
  Box,
  Input,
  Button,
  Text,
  Flex,
  Grid,
  GridItem,
  HStack,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import {
  SearchIcon,
  CloseIcon,
  CheckCircleIcon,
  TimeIcon,
  AddIcon,
} from "@chakra-ui/icons";
import SideNav from "./components/SideNav";
import {
  FaMusic,
  FaEllipsisH,
  FaPlay,
  FaEllipsisV,
  FaImage,
} from "react-icons/fa";

// Placeholder images for demo
import DummyTrack from "../images/commonimages/dummymusicthumb1.jpeg";
import SpotifyGreenIcon from "../images/icons/Spotify_Icon_RGB_Green.png";

export default function CreatePlaylist() {
  const [searchQuery, setSearchQuery] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [playlistName, setPlaylistName] = useState("My Playlist #1");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [databaseTracks, setDatabaseTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playlistImage, setPlaylistImage] = useState(null);
  const fileInputRef = React.useRef(null);
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setIsLoading(true);
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

        if (!response.ok) {
          throw new Error("Failed to fetch tracks");
        }

        const data = await response.json();
        setDatabaseTracks(data);
      } catch (error) {
        console.error("Error fetching tracks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTracks();
  }, []);

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleRemoveTrack = (trackId) => {
    setAddedTracks((prev) => prev.filter((track) => track.id !== trackId));
  };
  const handleAddTrack = (track) => {
    if (addedTracks.some((added) => added.id === track.id)) {
      return;
    }

    const newTrack = {
      id: track.id,
      title: track.title,
      artist: track.artists?.map((a) => a.name).join(", ") || "Unknown Artist",
      album: track.album?.title || "Unknown Album",
      dateAdded: "Just now",
      duration: formatDuration(track.duration_ms),
      isPlaying: false,
      image: track.album?.cover_image_url || DummyTrack,
    };

    setAddedTracks((prev) => [...prev, newTrack]);
  };

  const filteredTracks = useMemo(() => {
    if (!searchQuery) {
      return databaseTracks;
    }

    return databaseTracks.filter(
      (track) =>
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artists?.some((artist) =>
          artist.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }, [databaseTracks, searchQuery]);

  const [addedTracks, setAddedTracks] = useState([
    // {
    //   id: 1,
    //   title: "Nước Mắt Cá Sấu",
    //   artist: "HIEUTHUHAI",
    //   album: "Nước Mắt Cá Sấu",
    //   dateAdded: "1 second ago",
    //   duration: "3:26",
    //   isPlaying: true,
    //   image: DummyTrack,
    // },
    // {
    //   id: 2,
    //   title: "Exit Sign",
    //   artist: "HIEUTHUHAI, marzuz",
    //   album: "Ai Cũng Phải Bắt Đầu Từ Đâu Đó",
    //   dateAdded: "1 second ago",
    //   duration: "3:21",
    //   isPlaying: false,
    //   image: DummyTrack,
    // },
    // {
    //   id: 3,
    //   title: "Không Thể Say",
    //   artist: "HIEUTHUHAI",
    //   album: "Ai Cũng Phải Bắt Đầu Từ Đâu Đó",
    //   dateAdded: "1 second ago",
    //   duration: "3:48",
    //   isPlaying: false,
    //   image: DummyTrack,
    // },
  ]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPlaylistImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDetails = () => {
    onClose();
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
      trackIds.forEach((id) => {
        formData.append("tracks", id);
      });
      if (playlistImage && playlistImage.startsWith("data:image")) {
        const response = await fetch(playlistImage);
        const blob = await response.blob();
        formData.append("cover_image", blob, "playlist_cover.jpg");
      }
      const response = await fetch("http://localhost:8000/api/playlist/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
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

  return (
    <div className="flex w-full h-screen overflow-scroll overflow-hidden">
      <Head>
        <title>Spotify - Create Playlist</title>
        <link rel="icon" href={SpotifyGreenIcon.src} />
      </Head>

      <SideNav />

      <Box flex="1" bg="#121212" color="white" overflowY="auto">
        {/* Header Section */}
        <Box bgGradient="linear(to-b, #333333, #121212)" pt={10} pb={6} px={8}>
          <Box
            width="150px"
            height="150px"
            bg="#282828"
            display="flex"
            justifyContent="center"
            alignItems="center"
            mb={4}
            position="relative"
            overflow="hidden"
          >
            {playlistImage ? (
              <Image
                src={playlistImage}
                alt="Playlist cover"
                layout="fill"
                objectFit="cover"
              />
            ) : (
              <FaMusic size="48px" color="#777777" />
            )}
          </Box>

          <Text fontSize="sm" color="#B3B3B3" mt={4}>
            Public Playlist
          </Text>

          <Text
            fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
            fontWeight="bold"
            my={2}
            cursor="pointer"
            onClick={onOpen}
            _hover={{ textDecoration: "underline" }}
          >
            {playlistName}
          </Text>

          <Flex alignItems="center" mt={2}>
            <Text fontSize="sm" color="white" fontWeight="medium">
              Văn Kiệt
            </Text>
            <Text mx={2} color="white">
              •
            </Text>
            <Text fontSize="sm" color="#B3B3B3">
              {addedTracks.length} songs
            </Text>
          </Flex>
        </Box>

        {/* Edit Details Modal */}
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
                  {playlistImage ? (
                    <Image
                      src={playlistImage}
                      alt="Playlist cover"
                      layout="fill"
                      objectFit="cover"
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
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      bg="#333333"
                      border="1px solid #555555"
                      color="white"
                      _focus={{ borderColor: "#1DB954" }}
                      autoFocus
                    />
                  </FormControl>

                  <FormControl>
                    <Textarea
                      placeholder="Add an optional description"
                      value={playlistDescription}
                      onChange={(e) => setPlaylistDescription(e.target.value)}
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

        {/* Toolbar */}
        <Flex
          bg="#121212"
          p={4}
          alignItems="center"
          borderBottom="1px solid #282828"
        >
          <Button variant="ghost" color="#B3B3B3" _hover={{ color: "white" }}>
            <FaEllipsisH />
          </Button>

          <Button
            ml="auto"
            bg="#1DB954"
            color="black"
            borderRadius="full"
            leftIcon={<AddIcon />}
            _hover={{ bg: "#1ed760" }}
            fontWeight="medium"
            px={6}
            onClick={handleCreatePlaylist}
          >
            Add
          </Button>
        </Flex>

        {addedTracks.length > 0 && (
          <Box px={8} pt={6}>
            <Table variant="unstyled" size="sm">
              <Thead>
                <Tr borderBottom="1px solid #333333">
                  <Th
                    color="#B3B3B3"
                    fontSize="14px"
                    fontWeight="normal"
                    width="40px"
                    textAlign="center"
                  >
                    #
                  </Th>
                  <Th color="#B3B3B3" fontSize="14px" fontWeight="normal">
                    TITLE
                  </Th>
                  <Th color="#B3B3B3" fontSize="14px" fontWeight="normal">
                    ARTIST
                  </Th>
                  <Th color="#B3B3B3" fontSize="14px" fontWeight="normal">
                    ALBUM
                  </Th>
                  <Th color="#B3B3B3" fontSize="14px" fontWeight="normal">
                    DATE ADDED
                  </Th>
                  <Th
                    color="#B3B3B3"
                    fontSize="14px"
                    fontWeight="normal"
                    width="60px"
                    textAlign="center"
                  >
                    <TimeIcon />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {addedTracks.map((track, index) => (
                  <Tr
                    key={track.id}
                    _hover={{
                      bg: "rgba(255,255,255,0.1)",
                      ".track-options": { opacity: 1 },
                      ".track-number": { opacity: 0 },
                      ".track-play": { opacity: 1 },
                    }}
                    position="relative"
                    py={2}
                  >
                    <Td textAlign="center" position="relative" width="40px">
                      {track.isPlaying ? (
                        <Box color="#1DB954">
                          <FaPlay size="12px" />
                        </Box>
                      ) : (
                        <>
                          <Text
                            className="track-number"
                            color="#B3B3B3"
                            transition="opacity 0.2s"
                          >
                            {index + 1}
                          </Text>
                          <Box
                            className="track-play"
                            color="white"
                            position="absolute"
                            top="50%"
                            left="50%"
                            transform="translate(-50%, -50%)"
                            opacity={0}
                            transition="opacity 0.2s"
                          >
                            <FaPlay size="12px" />
                          </Box>
                        </>
                      )}
                    </Td>
                    <Td>
                      <Flex alignItems="center">
                        <Image
                          src={track.image}
                          alt={track.title}
                          width={40}
                          height={40}
                          style={{ marginRight: "16px" }}
                        />
                        <Text color="white">{track.title}</Text>
                      </Flex>
                    </Td>
                    <Td color="white">{track.artist}</Td>
                    <Td color="white" isTruncated maxW="200px">
                      {track.album}
                    </Td>
                    <Td color="white">{track.dateAdded}</Td>
                    <Td position="relative" width="60px">
                      <Flex alignItems="center" justifyContent="flex-end">
                        {index === 0 && (
                          <Box color="#1DB954" mr={3}>
                            <CheckCircleIcon boxSize={4} />
                          </Box>
                        )}
                        <Text color="white" mr={2}>
                          {track.duration}
                        </Text>
                        <Box
                          className="track-options"
                          opacity={0}
                          transition="opacity 0.2s"
                          color="#B3B3B3"
                          _hover={{ color: "white" }}
                          cursor="pointer"
                          onClick={() => handleRemoveTrack(track.id)}
                        >
                          <FaTrash size="14px" />
                        </Box>
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        {/* Search Section */}
        <Box p={8} pb={32}>
          <Text fontSize="xl" fontWeight="medium" mb={4}>
            Let's find something for your playlist
          </Text>

          <InputGroup maxWidth="800px" mb={8}>
            <InputLeftElement>
              <SearchIcon color="#B3B3B3" />
            </InputLeftElement>

            <Input
              placeholder="Search for songs or episodes"
              value={searchQuery}
              onChange={handleSearchChange}
              bg="#333333"
              border="none"
              borderRadius="md"
              color="white"
              _placeholder={{ color: "#B3B3B3" }}
              pr="12"
            />

            {searchQuery && (
              <InputRightElement>
                <CloseIcon
                  cursor="pointer"
                  onClick={clearSearch}
                  color="#B3B3B3"
                  boxSize={3}
                />
              </InputRightElement>
            )}
          </InputGroup>

          {/* Search Results */}
          {/* Database Tracks / Search Results */}
          {isLoading ? (
            <Box textAlign="center" py={16}>
              <Text color="#B3B3B3">Loading songs...</Text>
            </Box>
          ) : (
            <Box>
              <Grid gap={4}>
                {filteredTracks.map((track) => (
                  <GridItem key={track.id} bg="#282828" borderRadius="md" p={3}>
                    <Flex alignItems="center" justifyContent="space-between">
                      <Flex alignItems="center">
                        <Box mr={4}>
                          <Image
                            src={track.album?.cover_image_url || DummyTrack}
                            alt={track.title}
                            width={50}
                            height={50}
                          />
                        </Box>
                        <Box>
                          <Text fontWeight="medium">{track.title}</Text>
                          <Text fontSize="sm" color="#B3B3B3">
                            {track.artists
                              ?.map((artist) => artist.name)
                              .join(", ") || "Unknown Artist"}
                          </Text>
                        </Box>
                      </Flex>
                      <Box>
                        {addedTracks.some((added) => added.id === track.id) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            borderRadius="full"
                            color="#1DB954"
                            borderColor="#1DB954"
                            _hover={{ bg: "rgba(29,185,84,0.1)" }}
                            isDisabled
                          >
                            Added
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            borderRadius="full"
                            color="white"
                            _hover={{ bg: "rgba(255,255,255,0.1)" }}
                            onClick={() => handleAddTrack(track)}
                          >
                            Add
                          </Button>
                        )}
                      </Box>
                    </Flex>
                  </GridItem>
                ))}
              </Grid>

              {filteredTracks.length === 0 && (
                <Box textAlign="center" py={16}>
                  <Text color="#B3B3B3">
                    {searchQuery
                      ? `No songs found matching "${searchQuery}"`
                      : "No songs available"}
                  </Text>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </div>
  );
}
