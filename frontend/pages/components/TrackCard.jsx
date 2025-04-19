import React from 'react';
import Image from 'next/image';
import { Box, Text, VStack, Button } from '@chakra-ui/react';
import PlayIcon from '../../images/commonicons/playicon.svg';
import PauseIcon from '../../images/commonicons/pauseicon.svg'; // Import PauseIcon
import DummyMusicThumb1 from "../../images/commonimages/dummymusicthumb1.jpeg"; // Ảnh mặc định
import { useTrack } from '../../context/TrackContext'; // Import useTrack

// Component để hiển thị một thẻ bài hát
function TrackCard({ track }) {
  const { playTrack, currentTrack, isPlaying } = useTrack(); // Lấy thêm currentTrack và isPlaying

  // Lấy thông tin cần thiết từ track object
  const imageUrl = track.album?.cover_image_url || DummyMusicThumb1.src;
  const title = track.title || 'Unknown Title';
  const artists = track.artists?.map(artist => artist.name).join(', ') || 'Unknown Artist';

  // Xác định xem bài hát này có đang phát không
  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;

  const handlePlayClick = (e) => {
    e.stopPropagation(); // Ngăn sự kiện click lan ra thẻ cha
    playTrack(track.id); // Vẫn gọi playTrack, context sẽ xử lý play/pause
  };

  return (
    <Box
      bg="#181919"
      _hover={{ bg: "#292928" }}
      transition="background-color 0.2s"
      borderRadius="lg"
      p={3}
      cursor="pointer"
      minW="180px" // Đảm bảo chiều rộng tối thiểu
      position="relative" // Cho nút play tuyệt đối
      className="music-card" // Class cho hiệu ứng hover nút play (nếu có)
      role="group" // Thêm role group để _groupHover hoạt động
    >
      <VStack align="stretch" spacing={3}>
        <Box position="relative" w="full" pt="100%" borderRadius="md" overflow="hidden">
          {/* Sử dụng pt="100%" để tạo box vuông cho ảnh */}
          <Image
            src={imageUrl}
            alt={title}
            layout="fill"
            objectFit="cover" // Đảm bảo ảnh cover hết box
            priority={true} // Có thể cần điều chỉnh
          />
          {/* Nút Play hiển thị khi hover (tương tự Section.jsx) */}
          <Button
            position="absolute"
            bottom={2}
            right={2}
            size="lg"
            isRound
            bg="#1DDF62"
            color="black"
            // Hiển thị nút khi hover hoặc khi bài hát đang được phát
            opacity={isCurrentlyPlaying ? 1 : 0}
            transform={isCurrentlyPlaying ? "translateY(0)" : "translateY(10px)"}
            _groupHover={{ opacity: 1, transform: "translateY(0)" }} // Hiển thị khi hover thẻ cha
            transition="all 0.3s ease-out"
            className="card-play-button" // class để css có thể target (nếu cần)
            onClick={handlePlayClick}
            aria-label={isCurrentlyPlaying ? `Pause ${title}` : `Play ${title}`}
            boxShadow="lg"
          >
            {/* Thay đổi icon dựa trên isCurrentlyPlaying */}
            <Image src={isCurrentlyPlaying ? PauseIcon : PlayIcon} alt={isCurrentlyPlaying ? "Pause" : "Play"} height={20} width={20} />
          </Button>
        </Box>
        <Box>
          <Text
            color="white"
            fontWeight="bold"
            noOfLines={1} // Chỉ hiển thị 1 dòng
            title={title} // Hiển thị tooltip nếu tên quá dài
          >
            {title}
          </Text>
          <Text
            color="#B3B3B3"
            fontSize="sm"
            noOfLines={2} // Hiển thị tối đa 2 dòng
            title={artists}
          >
            {artists}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}

export default TrackCard; 