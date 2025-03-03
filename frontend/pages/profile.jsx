import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Avatar, 
  VStack, 
  HStack,
  Divider,
  Button,
  Badge,
  Flex,
  useColorModeValue,
  Card,
  CardBody
} from '@chakra-ui/react';
import Layout from './components/Layout';

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch user data from localStorage
    const savedUserData = localStorage.getItem('spotify_user');
    
    if (savedUserData) {
      setUserData(JSON.parse(savedUserData));
    } else {
      router.push('/');
    }
    
    setIsLoading(false);
  }, [router]);

  // Format expiration date for display
  const formatExpiryDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <Layout>
        <Box pt="80px" textAlign="center" color="white">
          <Text>Loading...</Text>
        </Box>
      </Layout>
    );
  }

  if (!userData) {
    return (
      <Layout>
        <Box pt="80px" textAlign="center" color="white">
          <Text>You need to be logged in to view this page.</Text>
          <Button 
            onClick={() => router.push('/')}
            mt={4}
            colorScheme="green"
          >
            Return to Home
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxW="container.md" pt="80px" pb="40px">
        <Card bg="#282828" color="white" borderRadius="lg" overflow="hidden">
          <CardBody>
            <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="center" mb={6}>
              <Avatar 
                size="2xl" 
                name={userData.username ? userData.username.charAt(0).toUpperCase() : '?'}
                bg="green.500"
                mb={{ base: 4, md: 0 }}
              />
              <Box ml={{ base: 0, md: 6 }} textAlign={{ base: 'center', md: 'left' }}>
                <Badge colorScheme="green" mb={2}>User Profile</Badge>
                <Heading size="xl">{userData.username}</Heading>
                <Text fontSize="md" color="gray.300" mt={1}>
                  User ID: {userData.user_id}
                </Text>
              </Box>
            </Flex>
            
            <Divider my={6} borderColor="gray.600" />
            
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold" fontSize="md" color="gray.400">
                  Authentication Token
                </Text>
                <Text fontSize="sm" mt={1} p={2} bg="blackAlpha.300" borderRadius="md" overflow="auto">
                  {userData.token}
                </Text>
              </Box>
              
              <Box>
                <Text fontWeight="bold" fontSize="md" color="gray.400">
                  Session Expiration
                </Text>
                <HStack mt={1}>
                  <Badge colorScheme="purple">
                    {formatExpiryDate(userData.expires)}
                  </Badge>
                </HStack>
              </Box>
            </VStack>
            
            <Button 
              colorScheme="red" 
              variant="outline" 
              size="sm"
              mt={8}
              onClick={() => {
                localStorage.removeItem('spotify_token');
                localStorage.removeItem('spotify_user');
                router.push('/');
              }}
            >
              Logout
            </Button>
          </CardBody>
        </Card>
      </Container>
    </Layout>
  );
}
