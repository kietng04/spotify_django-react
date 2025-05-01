import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Flex,
  Image,
  Text,
  AspectRatio,
  VStack,
  Heading,
} from '@chakra-ui/react';
import DummyMusicThumb from '../../images/commonimages/dummymusicthumb1.jpeg'; // Placeholder

function VideoDetailModal({ isOpen, onClose, track }) {
  console.log("VideoDetailModal received track:", track);
  // Sử dụng track giả nếu chưa có dữ liệu thật
  const displayTrack = track || {
    title: 'Bài hát mẫu',
    artists: [{ name: 'Nghệ sĩ mẫu' }],
    track_cover_url: DummyMusicThumb.src,
    // Thêm trường video_url giả sau này nếu cần
    video_url: null, // Tạm thời chưa có video
    file_type: null,
    stream_url: null
  };

  // Xác định URL video - Tạm thời bỏ qua check file_type, dùng thẳng stream_url
  const actualVideoUrl = displayTrack?.stream_url; // Lấy stream_url nếu displayTrack tồn tại
  console.log("Calculated actualVideoUrl (bypass check):", actualVideoUrl);
  console.log("Using displayTrack:", displayTrack);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="gray.900" color="white" borderRadius="md">
        <ModalHeader borderBottomWidth="1px" borderColor="gray.700">
          {displayTrack.title}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6}>
          <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
            {/* Phần Video Player - Bỏ AspectRatio */}
            <Box flex="3" bg="black">
                {/* Placeholder cho video player */}
                {actualVideoUrl ? (
                   <iframe
                     title={displayTrack.title}
                     src={actualVideoUrl}
                     allowFullScreen
                     width="100%" // Giữ lại kích thước để dễ thấy
                     height="300px"
                     style={{ border: '1px solid green' }} // Đổi màu border
                   />
                 ) : (
                  <Flex
                    justify="center"
                    align="center"
                    height="100%"
                    bg="black"
                    color="gray.500"
                  >
                    <Text>Video Not Available</Text>
                  </Flex>
                 )}
            </Box>

            {/* Phần Thông tin bài hát */}
            <Box flex="1">
              <VStack align="start" spacing={4}>
                <Heading size="lg" noOfLines={2}>{displayTrack.title}</Heading>
                <Image
                  src={displayTrack.track_cover_url || DummyMusicThumb.src}
                  alt={displayTrack.title}
                  borderRadius="md"
                  boxSize="150px"
                  objectFit="cover"
                />
                <Text fontSize="md" color="gray.400" noOfLines={2}>
                  {displayTrack.artists?.map((artist) => artist.name).join(', ') || 'Unknown Artist'}
                </Text>
                {/* Thêm các thông tin khác nếu cần (Album, năm, ...) */}
              </VStack>
            </Box>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default VideoDetailModal; 