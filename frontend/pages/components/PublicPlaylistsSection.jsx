import React, { useState, useEffect } from 'react';
import { Box, Heading, SimpleGrid, Spinner, Text, Center } from '@chakra-ui/react';
import PlaylistCard from './PlaylistCard'; // Import component PlaylistCard

function PublicPlaylistsSection() {
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicPlaylists = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:8000/api/public-playlists/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPlaylists(data);
      } catch (e) {
        console.error("Failed to fetch public playlists:", e);
        setError("Could not load playlists. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicPlaylists();
  }, []); // Chạy một lần khi component mount

  return (
    <Box w="full" mt={6} mb={6} px={{ base: 4, lg: 8 }}>
      {/* Bạn có thể đổi tiêu đề ở đây nếu muốn */}
      <Heading as="h2" size="lg" color="white" mb={4}>
        Featured Playlists
      </Heading>

      {isLoading && (
        <Center h="150px">
          <Spinner size="xl" color="green.500" />
        </Center>
      )}

      {error && (
        <Center h="150px">
          <Text color="red.400">{error}</Text>
        </Center>
      )}

      {!isLoading && !error && playlists.length === 0 && (
         <Center h="150px">
           <Text color="gray.500">No public playlists available.</Text>
         </Center>
      )}

      {!isLoading && !error && playlists.length > 0 && (
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} spacing={4}>
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

export default PublicPlaylistsSection; 