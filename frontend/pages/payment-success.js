import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { 
  Box, Heading, Text, Button, VStack, Icon, Container, Flex, 
  useColorModeValue, Badge, Divider, HStack
} from '@chakra-ui/react';
import { CheckCircleIcon, StarIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import Image from 'next/image';

export default function PaymentSuccess() {
  const router = useRouter();
  const { order_id } = router.query;
  const [userData, setUserData] = useState(null);
  const bgGradient = "linear(to-r, green.400, teal.500)";
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem('spotify_user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Box 
      minH="100vh" 
      bgGradient="linear(to-b, #121212, #1DB954 120%)"
      pt={10}
      pb={10}
    >
      <Container maxW="container.md" pt={8} pb={10}>
        <Flex direction="column" align="center" justify="center" minH="80vh">
          <Box 
            bg={cardBg} 
            borderRadius="xl" 
            boxShadow="2xl"
            overflow="hidden"
            w="full"
          >
            {/* Header Section with Gradient */}
            <Box 
              bgGradient={bgGradient} 
              py={8} 
              px={6} 
              color="white"
              textAlign="center"
              position="relative"
            >
              <Box 
                bg="white" 
                borderRadius="full" 
                p={3} 
                width="80px" 
                height="80px" 
                mx="auto" 
                mb={4}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={CheckCircleIcon} w={12} h={12} color="green.500" />
              </Box>
              
              <Heading size="xl" mb={3}>Thanh toán thành công!</Heading>
              
              {order_id && (
                <Badge colorScheme="green" fontSize="md" p={2} borderRadius="md">
                  Mã đơn hàng: {order_id}
                </Badge>
              )}
            </Box>
            
            {/* Content Section */}
            <Box p={8}>
              <VStack spacing={8} align="stretch">
                {/* Account upgrade info */}
                <Box bg="gray.50" p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                  <Heading size="md" mb={4} color="green.600">
                    <HStack>
                      <Icon as={StarIcon} />
                      <Text>Tài khoản của bạn đã được nâng cấp lên Premium</Text>
                    </HStack>
                  </Heading>
                  
                  <Text mb={5} fontSize="md">
                    Cảm ơn {userData?.username || "bạn"} đã đăng ký gói Premium. Giờ đây bạn có thể:
                  </Text>
                  
                  <VStack align="start" spacing={3} pl={4}>
                    <HStack>
                      <Box bg="green.500" borderRadius="full" p={1} color="white">
                        <CheckCircleIcon w={4} h={4} />
                      </Box>
                      <Text fontWeight="medium">Chất lượng âm thanh cao cấp</Text>
                    </HStack>
                    
                    <HStack>
                      <Box bg="green.500" borderRadius="full" p={1} color="white">
                        <CheckCircleIcon w={4} h={4} />
                      </Box>
                      <Text fontWeight="medium">Nghe những bài nhạc dành cho premium members !</Text>
                    </HStack>
                  </VStack>
                </Box>
                
                <Divider />
                
                {/* What's next section */}
                <Box>
                  <Heading size="md" mb={4} color="gray.700">Bước tiếp theo</Heading>
                  <Text mb={4}>
                    Tất cả các tính năng Premium đã được kích hoạt. Hãy quay lại trang chủ và thưởng thức âm nhạc chất lượng cao!
                  </Text>
                </Box>
              </VStack>
              
              <Flex justify="center" mt={10}>
                <Link href="/" passHref>
                  <Button 
                    size="lg"
                    bg="green.500"
                    color="white"
                    _hover={{ bg: "green.600" }}
                    px={10}
                    py={6}
                    boxShadow="md"
                  >
                    Quay lại trang chủ
                  </Button>
                </Link>
              </Flex>
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}