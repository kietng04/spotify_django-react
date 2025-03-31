import { useRouter } from 'next/router';
import { 
  Box, Heading, Text, Button, VStack, Icon, Container, Flex,
  useColorModeValue, Badge, Divider, HStack
} from '@chakra-ui/react';
import { WarningTwoIcon, InfoIcon, RepeatIcon, ArrowBackIcon } from '@chakra-ui/icons';
import Link from 'next/link';

export default function PaymentFailed() {
  const router = useRouter();
  const { error, status } = router.query;
  const bgGradient = "linear(to-r, red.400, red.600)";
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const getErrorMessage = () => {
    switch(error) {
      case 'invalid_checksum':
        return 'Dữ liệu xác thực không hợp lệ. Vui lòng thử lại.';
      case 'payment_failed':
        return `Thanh toán không thành công. Mã lỗi: ${status}`;
      case 'server_error':
        return 'Đã xảy ra lỗi từ phía máy chủ. Vui lòng thử lại sau.';
      default:
        return 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.';
    }
  };

  return (
    <Box 
      minH="100vh" 
      bgGradient="linear(to-b, #121212, #e53e3e 120%)"
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
                <Icon as={WarningTwoIcon} w={12} h={12} color="red.500" />
              </Box>
              
              <Heading size="xl" mb={3}>Thanh toán thất bại</Heading>
              
              {status && (
                <Badge colorScheme="red" fontSize="md" p={2} borderRadius="md">
                  Mã lỗi: {status}
                </Badge>
              )}
            </Box>
            
            {/* Content Section */}
            <Box p={8}>
              <VStack spacing={8} align="stretch">
                {/* Error Message */}
                <Box 
                  bg="red.50" 
                  p={6} 
                  borderRadius="lg" 
                  borderWidth="1px" 
                  borderColor="red.200"
                  color="red.800"
                >
                  <Heading size="md" mb={4} color="red.600">
                    <HStack>
                      <Icon as={InfoIcon} />
                      <Text>Chi tiết lỗi</Text>
                    </HStack>
                  </Heading>
                  
                  <Text fontSize="lg" fontWeight="medium" mb={5}>
                    {getErrorMessage()}
                  </Text>
                </Box>
                
                {/* Troubleshooting Section */}
                <Box bg="gray.50" p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                  <Heading size="md" mb={4} color="gray.700">
                    Có thể bạn gặp phải một trong các vấn đề sau:
                  </Heading>
                  
                  <VStack align="start" spacing={3} pl={4}>
                    <HStack>
                      <Box bg="red.500" borderRadius="full" p={1} color="white">
                        <InfoIcon w={4} h={4} />
                      </Box>
                      <Text fontWeight="medium">Thẻ của bạn không đủ số dư</Text>
                    </HStack>
                    
                    <HStack>
                      <Box bg="red.500" borderRadius="full" p={1} color="white">
                        <InfoIcon w={4} h={4} />
                      </Box>
                      <Text fontWeight="medium">Ngân hàng từ chối giao dịch</Text>
                    </HStack>
                    
                    <HStack>
                      <Box bg="red.500" borderRadius="full" p={1} color="white">
                        <InfoIcon w={4} h={4} />
                      </Box>
                      <Text fontWeight="medium">Kết nối mạng không ổn định</Text>
                    </HStack>
                    
                    <HStack>
                      <Box bg="red.500" borderRadius="full" p={1} color="white">
                        <InfoIcon w={4} h={4} />
                      </Box>
                      <Text fontWeight="medium">Phiên thanh toán đã hết hạn</Text>
                    </HStack>
                  </VStack>
                </Box>
                
                <Divider />
                
                {/* Next Steps Section */}
                <Box>
                  <Heading size="md" mb={4} color="gray.700">Bước tiếp theo</Heading>
                  <Text mb={4}>
                    Bạn có thể thử thanh toán lại hoặc quay về trang chủ để tiếp tục trải nghiệm dịch vụ.
                  </Text>
                </Box>
              </VStack>
              
              <Flex justify="center" mt={10} gap={4} flexWrap="wrap">
                <Link href="/" passHref>
                  <Button 
                    size="lg"
                    leftIcon={<ArrowBackIcon />}
                    variant="outline"
                    colorScheme="gray"
                    px={8}
                    py={6}
                    boxShadow="sm"
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