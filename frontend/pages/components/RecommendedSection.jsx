import React, { useState, useEffect } from 'react';
import { Box, Heading, SimpleGrid, Spinner, Text, Center } from '@chakra-ui/react';
import TrackCard from './TrackCard'; // Import component TrackCard vừa tạo

function RecommendedSection() {
  const [recommendedTracks, setRecommendedTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendedTracks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:8000/api/recommended-tracks/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRecommendedTracks(data);
      } catch (e) {
        console.error("Failed to fetch recommended tracks:", e);
        setError("Could not load recommendations. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendedTracks();
  }, []); // Chạy một lần khi component mount

  return (
    <Box w="full" mt={6} mb={6} px={{ base: 4, lg: 8 }}>
      <Heading as="h2" size="lg" color="white" mb={4}>
        Recommended For You
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

      {!isLoading && !error && recommendedTracks.length === 0 && (
         <Center h="150px">
           <Text color="gray.500">No recommendations available at the moment.</Text>
         </Center>
      )}

      {!isLoading && !error && recommendedTracks.length > 0 && (
        // Sử dụng SimpleGrid để tạo layout lưới responsive
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} spacing={4}>
          {recommendedTracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

export default RecommendedSection; 