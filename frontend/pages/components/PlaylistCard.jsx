import React from 'react';
import Image from 'next/image';
import { Box, Text, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import DummyMusicThumb1 from "../../images/commonimages/dummymusicthumb1.jpeg";

function PlaylistCard({ playlist }) {
  const router = useRouter();

  const imageUrl = playlist.cover_image_url || DummyMusicThumb1.src;
  const title = playlist.name || 'Unknown Playlist';
  const description = playlist.description || `By ${playlist.creator_username || 'Unknown'}`;

  const handleCardClick = () => {
    router.push(`/playlist/${playlist.id}`);
  };

  return (
    <Box
      bg="#181919"
      _hover={{ bg: "#292928" }}
      transition="background-color 0.2s"
      borderRadius="lg"
      p={3}
      cursor="pointer"
      minW="180px"
      onClick={handleCardClick}
    >
      <VStack align="stretch" spacing={3}>
        <Box position="relative" w="full" pt="100%" borderRadius="md" overflow="hidden">
          <Image
            src={imageUrl}
            alt={title}
            layout="fill"
            objectFit="cover"
            priority={false}
          />
        </Box>
        <Box>
          <Text
            color="white"
            fontWeight="bold"
            noOfLines={1}
            title={title}
          >
            {title}
          </Text>
          <Text
            color="#B3B3B3"
            fontSize="sm"
            noOfLines={2}
            title={description}
          >
            {description}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}

export default PlaylistCard; 