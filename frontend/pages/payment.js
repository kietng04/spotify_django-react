import { useState, useEffect } from 'react';
import { 
  Box, Container, Text, Radio, RadioGroup, HStack, VStack,
  Button, Heading, SimpleGrid, Flex, useColorModeValue, 
  Image, useToast, Divider, Spinner, Tabs, TabList, Tab, 
  TabPanels, TabPanel, Grid, Card, CardBody
} from '@chakra-ui/react';
import { useRouter } from 'next/router';

export default function Payment() {
  const router = useRouter();
  const toast = useToast();
  const bgGradient = "linear(to-b, #1DB954, #191414)";
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const [isLoading, setIsLoading] = useState(true);
  const [banks, setBanks] = useState({});
  const [selectedBank, setSelectedBank] = useState('zalopayapp');
  const [amount, setAmount] = useState(50000); // Default amount
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  // States for UI organization
  const [zalopayOptions, setZalopayOptions] = useState([]);
  const [creditCardOptions, setCreditCardOptions] = useState([]);
  const [bankTransferOptions, setBankTransferOptions] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    // Fetch supported banks when component mounts
    fetchSupportedBanks();
  }, []);
  // Add this at the top of your payment.js file, after the imports
const FALLBACK_BANKS = [
  { id: 'vtb', name: 'Vietinbank', bankcode: 'VTB' },
  { id: 'varb', name: 'Agribank', bankcode: 'VARB' },
  { id: 'vcb', name: 'Vietcombank', bankcode: 'VCB' },
  { id: 'bidv', name: 'BIDV', bankcode: 'BIDV' },
  { id: 'dab', name: 'Đông Á Bank', bankcode: 'DAB' },
  { id: 'scb', name: 'Sacombank', bankcode: 'SCB' },
  { id: 'acb', name: 'ACB', bankcode: 'ACB' },
  { id: 'mb', name: 'MBBank', bankcode: 'MB' },
  { id: 'tcb', name: 'Techcombank', bankcode: 'TCB' },
  { id: 'vpb', name: 'VPBank', bankcode: 'VPB' },
  { id: 'eib', name: 'Eximbank', bankcode: 'EIB' },
  { id: 'vib', name: 'VIB', bankcode: 'VIB' },
  { id: 'hdb', name: 'HDBank', bankcode: 'HDB' },
  { id: 'ojb', name: 'Oceanbank', bankcode: 'OJB' },
  { id: 'shb', name: 'SHB', bankcode: 'SHB' },
  { id: 'msb', name: 'Maritime Bank', bankcode: 'MSB' },
  { id: 'seab', name: 'SeABank', bankcode: 'SEAB' },
  { id: 'abb', name: 'ABBank', bankcode: 'ABB' },
  { id: 'tpb', name: 'TPBank', bankcode: 'TPB' },
  { id: 'sgcb', name: 'TMCP Sài Gòn', bankcode: 'SGCB' },
  { id: 'lpb', name: 'Liên Việt Post Bank', bankcode: 'LPB' },
  { id: 'sgb', name: 'SaigonBank', bankcode: 'SGB' },
  { id: 'ocb', name: 'OCB', bankcode: 'OCB' },
  { id: 'nab', name: 'Nam Á Bank', bankcode: 'NAB' },
  { id: 'vab', name: 'Việt Á Bank', bankcode: 'VAB' },
  { id: 'bvb', name: 'Bảo Việt Bank', bankcode: 'BVB' },
  { id: 'gpb', name: 'GPBank', bankcode: 'GPB' },
  { id: 'bab', name: 'Bắc Á Bank', bankcode: 'BAB' },
  { id: 'vccb', name: 'Ngân hàng Bản Việt', bankcode: 'VCCB' }
];
  const fetchSupportedBanks = async () => {
    try {
      setIsLoading(true);
      
      // Get user token from localStorage
      const userDataString = localStorage.getItem('spotify_user');
      if (!userDataString) {
        toast({
          title: "Chưa đăng nhập",
          description: "Bạn cần đăng nhập để xem các lựa chọn thanh toán",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        router.push('/login');
        return;
      }
      
      const userData = JSON.parse(userDataString);
      const token = userData.token;
      
      // Include token in the request headers
      const response = await fetch('http://localhost:8000/api/zalopay/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bank list');
      }
      
      const data = await response.json();
      console.log('Supported banks:', data);
      
      // Store banks in state
      setBanks(data.banks);
      
      // Process and group banks
      processAndGroupBanks(data.banks);
    } catch (error) {
      console.error('Error fetching banks:', error);
      toast({
        title: "Lỗi kết nối",
        description: "Không thể tải danh sách ngân hàng. Vui lòng thử lại sau.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processAndGroupBanks = (banksData) => {
    // Process bank data into categories
    const zalopay = [];
    const creditCards = [];
    const bankTransfer = [];
  
    // ZaloPay - PMCID 38
    if (banksData['38']) {
      banksData['38'].forEach(bank => {
        zalopay.push(bank);
      });
    }
  
    // Credit Cards - PMCID 36
    if (banksData['36']) {
      banksData['36'].forEach(bank => {
        creditCards.push(bank);
      });
    }
  
    // Bank Transfer - PMCID 39
    if (banksData['39']) {
      banksData['39'].forEach(bank => {
        bankTransfer.push(bank);
      });
    }
  
    // Use fallback banks if no bank transfer options were returned
    if (bankTransfer.length === 0) {
      FALLBACK_BANKS.forEach(bank => {
        bankTransfer.push({
          bankcode: bank.bankcode,
          name: bank.name,
          id: bank.id
        });
      });
    }
  
    // Update state with grouped banks
    setZalopayOptions(zalopay);
    setCreditCardOptions(creditCards);
    setBankTransferOptions(bankTransfer);
  };

  const handleTabChange = (index) => {
    setActiveTab(index);
    
    // Set default selected bank for each tab
    if (index === 0 && zalopayOptions.length > 0) {
      setSelectedBank(zalopayOptions[0].bankcode);
    } else if (index === 1 && creditCardOptions.length > 0) {
      setSelectedBank(creditCardOptions[0].bankcode);
    } else if (index === 2 && bankTransferOptions.length > 0) {
      setSelectedBank(bankTransferOptions[0].bankcode);
    }
  };

  const handlePaymentSubmit = async () => {
    setPaymentProcessing(true);
    
    try {
      // Get user token from localStorage
      const userDataString = localStorage.getItem('spotify_user');
      if (!userDataString) {
        toast({
          title: "Chưa đăng nhập",
          description: "Bạn cần đăng nhập để tiếp tục thanh toán",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        router.push('/login');
        return;
      }
      
      const userData = JSON.parse(userDataString);
      const token = userData.token;
      
      // Xác định payment_method dựa trên tab đang active
      let payment_method;
      switch(activeTab) {
        case 0:
          // Tab ZaloPay
          payment_method = 'zalopay';
          break;
        case 1:
          // Tab Thẻ tín dụng
          payment_method = 'credit_card';
          break;
        case 2:
          // Tab ATM/Internet Banking
          payment_method = 'atm';
          break;
        default:
          payment_method = 'zalopay';
      }
      
      // Kiểm tra trường hợp đặc biệt: nếu là tab ZaloPay nhưng chọn QR đa năng
      if (payment_method === 'zalopay' && selectedBank === 'zalopayqr') {
        payment_method = 'vietqr';
      }
  
      console.log('Sending payment request with:', { 
        amount, 
        bank_code: selectedBank, 
        payment_method 
      });
      
      // Send payment request to backend với payment_method mới
      const response = await fetch('http://localhost:8000/api/zalopay/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          amount: amount,
          bank_code: selectedBank,
          payment_method: payment_method
        })
      });
      
      if (!response.ok) {
        throw new Error('Payment request failed');
      }
      
      const paymentData = await response.json();
      console.log('Payment response:', paymentData);
      
      // Redirect to payment URL
      if (paymentData.order_url) {
        window.location.href = paymentData.order_url;
      } else {
        throw new Error('No payment URL received');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Lỗi thanh toán",
        description: `Đã xảy ra lỗi: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <Box minH="100vh" bgGradient={bgGradient} py={10}>
      <Container maxW="container.md" bg={cardBg} borderRadius="xl" boxShadow="lg" p={0} overflow="hidden">
        {/* Header */}
        <Box bg="green.500" py={6} px={8} color="white">
          <Heading size="lg">Thanh toán Premium Membership</Heading>
          <Text mt={2}>Nâng cấp tài khoản để trải nghiệm âm nhạc chất lượng cao</Text>
        </Box>
        
        {/* Content */}
        <Box p={8}>
          <VStack spacing={8} align="stretch">
            {/* Plan details */}
            <Box p={6} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
              <Heading size="md" mb={4}>Chi tiết gói Premium</Heading>
              <Flex justify="space-between" align="center">
                <VStack align="start" spacing={2}>
                  <Text fontWeight="bold" fontSize="lg">Gói Premium</Text>
                  <Text color="gray.600">Truy cập không giới hạn vào kho nhạc chất lượng cao</Text>
                </VStack>
                <Box>
                  <Text fontWeight="bold" fontSize="xl">{amount.toLocaleString()} VND</Text>
                  <Text fontSize="sm" color="gray.500">Thanh toán một lần</Text>
                </Box>
              </Flex>
            </Box>

            {/* Amount Selection */}
            <Box mb={4}>
              <Heading size="md" mb={4}>Chọn số tiền:</Heading>
              <SimpleGrid columns={[2, 4]} spacing={4}>
                {[50000, 100000, 200000, 500000].map((value) => (
                  <Button
                    key={value}
                    size="lg"
                    colorScheme={amount === value ? "green" : "gray"}
                    variant={amount === value ? "solid" : "outline"}
                    onClick={() => setAmount(value)}
                  >
                    {value.toLocaleString()} đ
                  </Button>
                ))}
              </SimpleGrid>
            </Box>
            
            <Divider />
            
            {/* Payment methods */}
            <Box>
              <Heading size="md" mb={4}>Chọn hình thức thanh toán:</Heading>
              <Tabs variant="enclosed" colorScheme="green" mb={6} onChange={handleTabChange}>
                <TabList>
                  <Tab>ZaloPay</Tab>
                  <Tab>Thẻ tín dụng</Tab>
                  <Tab>Thẻ ATM / Internet Banking</Tab>
                </TabList>
                
                <TabPanels>
                  {/* ZaloPay Tab */}
                  <TabPanel>
                    <RadioGroup onChange={setSelectedBank} value={selectedBank}>
                      <VStack align="stretch" spacing={4}>
                        {zalopayOptions.map((bank) => (
                          <Box
                            key={bank.bankcode}
                            borderWidth="2px"
                            borderRadius="md"
                            p={4}
                            bg={selectedBank === bank.bankcode ? "green.50" : "white"}
                            borderColor={selectedBank === bank.bankcode ? "green.500" : "gray.200"}
                            _hover={{ borderColor: "green.300" }}
                            cursor="pointer"
                            onClick={() => setSelectedBank(bank.bankcode)}
                            position="relative"
                          >
                            <Flex align="center">
                              <Radio 
                                value={bank.bankcode} 
                                colorScheme="green"
                                isChecked={selectedBank === bank.bankcode}
                              >
                                <HStack>
                                <Image 
                                  src={`/images/Logo-ZaloPay-Square.svg`}
                                  alt={bank.name}
                                  h="30px"
                                  mb={2}
                                  objectFit="contain"
                                  fallbackSrc="/images/bank-default.svg"
                                />
                                  <Text fontWeight="medium">{bank.name}</Text>
                                </HStack>
                              </Radio>
                            </Flex>
                            
                            {selectedBank === bank.bankcode && (
                              <Box 
                                position="absolute" 
                                top="-2px" 
                                right="-2px"
                                bg="green.500"
                                borderRadius="full"
                                p={1}
                                color="white"
                                fontSize="xs"
                              >
                                ✓
                              </Box>
                            )}
                          </Box>
                        ))}
                      </VStack>
                    </RadioGroup>
                  </TabPanel>
                  
                  {/* Credit Card Tab */}
                  <TabPanel>
                    <RadioGroup onChange={setSelectedBank} value={selectedBank}>
                      <VStack align="stretch" spacing={4}>
                        {creditCardOptions.map((bank) => (
                          <Box
                            key={bank.bankcode}
                            borderWidth="2px"
                            borderRadius="md"
                            p={4}
                            bg={selectedBank === bank.bankcode ? "green.50" : "white"}
                            borderColor={selectedBank === bank.bankcode ? "green.500" : "gray.200"}
                            _hover={{ borderColor: "green.300" }}
                            cursor="pointer"
                            onClick={() => setSelectedBank(bank.bankcode)}
                            position="relative"
                          >
                            <Flex align="center">
                              <Radio 
                                value={bank.bankcode} 
                                colorScheme="green"
                                isChecked={selectedBank === bank.bankcode}
                              >
                                <HStack>
                                  <Image
                                    src="/images/bank-creditcard.svg"
                                    alt="Credit Cards"
                                    boxSize="80px"
                                    objectFit="contain"
                                    fallbackSrc="/images/bank-default.svg"
                                  />
                                  <Text fontWeight="medium">{bank.name}</Text>
                                </HStack>
                              </Radio>
                            </Flex>
                            
                            {selectedBank === bank.bankcode && (
                              <Box 
                                position="absolute" 
                                top="-2px" 
                                right="-2px"
                                bg="green.500"
                                borderRadius="full"
                                p={1}
                                color="white"
                                fontSize="xs"
                              >
                                ✓
                              </Box>
                            )}
                          </Box>
                        ))}
                      </VStack>
                    </RadioGroup>
                  </TabPanel>
                  
                  {/* Bank Transfer Tab */}
                  <TabPanel>
                    <SimpleGrid columns={[2, 3, 4]} spacing={4}>
                      {bankTransferOptions.map((bank) => (
                        <Box
                          key={bank.bankcode}
                          p={3}
                          borderWidth="2px"
                          borderRadius="md"
                          borderColor={selectedBank === bank.bankcode ? "green.500" : "gray.200"}
                          bg={selectedBank === bank.bankcode ? "green.50" : "white"}
                          cursor="pointer"
                          onClick={() => setSelectedBank(bank.bankcode)}
                          position="relative"
                          transition="all 0.2s"
                          _hover={{ borderColor: "green.300" }}
                        >
                          <Flex direction="column" align="center" justify="center" minH="70px">
                            <Image 
                              src={`/images/bank-${bank.bankcode ? bank.bankcode.toLowerCase() : bank.id?.toLowerCase()}.svg`}
                              alt={bank.name}
                              h="30px"
                              mb={2}
                              objectFit="contain"
                              fallbackSrc="/images/bank-default.svg"
                            />
                            <Text fontSize="sm" textAlign="center">{bank.name}</Text>
                          </Flex>
                          
                          {selectedBank === bank.bankcode && (
                            <Box 
                              position="absolute" 
                              top="-2px" 
                              right="-2px"
                              bg="green.500"
                              borderRadius="full"
                              p={1}
                              color="white"
                              fontSize="xs"
                            >
                              ✓
                            </Box>
                          )}
                        </Box>
                      ))}
                    </SimpleGrid>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
            
            <Divider />
            
            {/* Payment confirmation */}
            <Box>
              <Heading size="md" mb={4}>Xác nhận thanh toán</Heading>
              <Text mb={6}>
                Bằng cách nhấn nút "Thanh toán", bạn đồng ý với điều khoản dịch vụ và sẽ được chuyển đến cổng thanh toán ZaloPay an toàn.
              </Text>
              
              <Flex justify="space-between">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => router.push('/')}
                >
                  Hủy
                </Button>
                
                <Button 
                  colorScheme="green" 
                  size="lg" 
                  onClick={handlePaymentSubmit}
                  isLoading={paymentProcessing}
                  loadingText="Đang xử lý"
                >
                  Thanh toán {amount.toLocaleString()} đ
                </Button>
              </Flex>
            </Box>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}