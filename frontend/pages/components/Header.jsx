import React, { useEffect, useState } from "react";
import LeftArrow from "../../images/commonicons/leftarrow.svg";
import RightArrow from "../../images/commonicons/rightarrow.svg";
import DummyProfile from "../../images/commonimages/dummyprofile.jpeg";
import Image from "next/image";
import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useDisclosure,
  Avatar,
  Flex,
  Text,
  HStack,
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  List,
  ListItem,
  Link,
  Divider,
  Icon,
  Heading,
  Image as ChakraImage,
  IconButton
} from "@chakra-ui/react";
import { TriangleDownIcon, MusicNoteIcon, BellIcon } from "@chakra-ui/icons";
import SearchIconBlack from "../../images/commonicons/searchiconblack.svg";
import { useRouter } from "next/router";
import PlayIcon from "../../images/commonicons/playicon.svg";
import PauseIcon from "../../images/commonicons/pauseicon.svg";
import { playPauseAction } from "../../lib/tools";
import { useRecoilValue } from "recoil";
import { searchValue } from "../../atoms/searchAtom";
import { FaGoogle, FaMusic, FaPlay, FaPause, FaStar } from "react-icons/fa";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useTrack } from '../../context/TrackContext'


const callApi = async () => {

};

function Header() {
  let router = useRouter();
  let {id} = router.query
  let [pageTitle,setPageTitle] = useState("")
  let searchQuery = useRecoilValue(searchValue)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState({
    username: '',
    user_id: null,
    token: '',
    expires: '',
    role: null,
    is_super: null,
    avatarImg: null
  })
  const [randomTracks, setRandomTracks] = useState([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    playTrack: playTrackFromContext
  } = useTrack()


  const { isOpen, onOpen, onClose } = useDisclosure()
  const {
    isOpen: isRegisterOpen,
    onOpen: onRegisterOpen,
    onClose: onRegisterClose
  } = useDisclosure()
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');


  const fetchCurrentUserDetails = async (token) => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/user-profile/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        const userDetails = await response.json();
        console.log('fetchCurrentUserDetails - API Response:', userDetails);
        const newUserState = {
          username: userDetails.username,
          user_id: userDetails.id,
          token: token,
          expires: userData.expires,
          avatarImg: userDetails.avatarImg,
          role: userDetails.role,
          is_super: userDetails.is_superuser
        };
        console.log('fetchCurrentUserDetails - Setting userData:', newUserState);
        setUserData(newUserState);
      } else {
        console.error('Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const fetchRandomTracks = async () => {
    setIsLoadingTracks(true);
    try {
      const response = await fetch('http://localhost:8000/api/random-tracks/');
      if (!response.ok) {
        throw new Error('Failed to fetch random tracks');
      }
      const data = await response.json();
      setRandomTracks(data);
    } catch (error) {
      console.error('Error fetching random tracks:', error);
    } finally {
      setIsLoadingTracks(false);
    }
  };


  const handlePlayPauseClick = (trackId) => {
    if (currentTrack?.id === trackId) {
      togglePlayPause(); // Toggle if it's the current track
    } else {
      playTrackFromContext(trackId); // Play new track using context
    }
  };


  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    if(document.getElementById("header_common_thing_playbutton")){
      document.getElementById("header_common_thing_playbutton").src =
      PlayIcon.src;
    }


    fetchRandomTracks();
  }, []);

  useEffect(() => {
    setPageTitle(document.title.split(" - ")[1])
  }, [router]);


  useEffect(() => {
    const savedUserData = localStorage.getItem('spotify_user');

    if (savedUserData) {
      const parsedData = JSON.parse(savedUserData);
      setUserData(prevData => ({
        ...prevData,
        ...parsedData 
      }));
      setIsLoggedIn(true);
      if (parsedData.token) {
         fetchCurrentUserDetails(parsedData.token);
      }
    }
  }, []);

  const handleLogin = async () => {
    try {

      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('handleLogin - API Response:', data);
        const newUserState = {
          username: data.username,
          user_id: data.user_id,
          token: data.token,
          expires: data.expires,
          avatarImg: data.avatarImg,
          role: data.role,
          is_super: data.is_super
        };
        console.log('handleLogin - Setting userData:', newUserState);
        setUserData(newUserState);
        localStorage.setItem('spotify_user', JSON.stringify(newUserState));
        setIsLoggedIn(true);
        onClose();
      } else {

        alert(data.error || data.detail || 'Login failed: An unknown error occurred');
      }

    } catch (error) {
      console.error('Login error:', error);
      alert('Error connecting to server');
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    signInWithPopup(auth, provider)
    .then(async (result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;

      try {
        const response = await fetch('http://localhost:8000/api/google-auth/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            username: user.displayName || user.email.split('@')[0],
            displayname: user.displayName,
            photoURL: user.photoURL,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log('handleGoogleLogin - API Response:', data);
          const newUserState = {
            username: data.username,
            user_id: data.user_id,
            token: data.token,
            expires: data.expires,
            avatarImg: data.avatarImg,
            role: data.role,
            is_super: data.is_super
          };
          console.log('handleGoogleLogin - Setting userData:', newUserState);
          setUserData(newUserState);
          localStorage.setItem('spotify_user', JSON.stringify(newUserState));
          setIsLoggedIn(true);
          onClose();

          console.log("Login success:", data);


          fetchCurrentUserDetails(data.token);
        } else {
          console.error('Login failed:', data);
          alert('Login failed: ' + (data.error || 'Unknown error'));
        }

      } catch (error) {
        console.error("Backend authentication error:", error);
        setUserData({
          username: user.displayName || user.email.split('@')[0],
          user_id: user.uid,
          token: token,
          expires: new Date(Date.now() + 24*60*60*1000).toISOString()
        });


        localStorage.setItem('spotify_user', JSON.stringify({
          username: user.displayName || user.email.split('@')[0],
          user_id: user.uid,
          token: token,
          expires: new Date(Date.now() + 24*60*60*1000).toISOString(),
          avatarImg: user.photoURL
        }));

        setIsLoggedIn(true);
        onClose();
        alert("Server error, but logged in with Google credentials");
      }
    })
    .catch((error) => {
      console.error("Google authentication error:", error);
      alert("Google login failed: " + error.message);
    });
  };


  const handleRegister = async () => {
    if (registerPassword !== registerConfirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: registerUsername,
          email: registerEmail,
          password: registerPassword
        }),
      });

      const data = await response.json();

      alert(JSON.stringify(data));

      if (response.ok) {
        onRegisterClose();

        setRegisterEmail('');
        setRegisterUsername('');
        setRegisterPassword('');
        setRegisterConfirmPassword('');
      }

    } catch (error) {
      console.error('Registration error:', error);
      alert('Lỗi kết nối đến máy chủ');
    }
  };


  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData({
      username: '',
      user_id: null,
      token: '',
      expires: '',
      role: null,
      is_super: null,
      avatarImg: null
    });
    localStorage.removeItem('spotify_user');
  };


  const goToProfile = () => {
    router.push('/profile');
  };

  const isProduction = process.env.NODE_ENV !== "development";


  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?';
  };

  // Hàm xử lý chuyển hướng sang trang admin
  const handleGoToAdmin = () => {
    const token = userData.token; // Lấy token từ state
    if (token) {
      const adminUrl = `http://localhost:5173/?token=${token}`;
      window.location.href = adminUrl; // Chuyển hướng
    } else {
      console.error("Cannot navigate to admin: token not found.");
      // Có thể thông báo lỗi cho người dùng
    }
  };

  return (
    <header
      id="home_header"
      className="sm:w-[83%] w-full transition-all z-[100] duration-100   h-16 fixed  right-0 top-0 lg:px-8 px-4   flex items-center"
    >
      <div className="h-full z-50 w-20 lg:static absolute sm:left-24  flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="h-8 w-8  bg-black rounded-full flex items-center justify-center"
        >
          <Image src={LeftArrow} alt="left arrow" priority={true} />
        </button>
        <button className="h-8 w-8 cursor-not-allowed bg-black opacity-50 rounded-full flex items-center justify-center">
          <Image src={RightArrow} alt="right arrow" priority={true} />
        </button>
      </div>

      <div id="common_div" className="h-full px-4 flex items-center">

        {router.pathname.includes("/search") ? (
          <div className="relative">
            <input
            onChange={(e) => {router.push(`/search/${e.target.value}`)}}
              autoFocus
              defaultValue={searchQuery != "" ? searchQuery : ""}
              type="search"
              placeholder="What do you want to listen to?"
              className="outline-none text-[0.940rem] font-book w-[350px] placeholder:text-[#747574] rounded-full py-2 pl-12"
            />
            <Image
              src={SearchIconBlack}
              alt="search icon"
              priority={true}
              className="absolute top-0 h-10 left-3"
            />
          </div>

        ) :  router.pathname.includes("/playlist") ? (
          <div className="flex items-center header_common_thing opacity-0 invisible transition-opacity delay-300 duration-500">
            <div className="w-12 h-12 bg-hover hover:scale-105 rounded-full flex items-center justify-center">
              <Image
                src={PlayIcon}
                id="header_common_thing_playbutton"
                onClick={(e) => {
                  playPauseAction(e.target, PlayIcon, PauseIcon);

                  if (
                    e.target.src.replace(
                      isProduction
                        ? process.env.NEXT_PUBLIC_BASE_PROD_URL
                        : process.env.NEXT_PUBLIC_BASE_DEV_URL,
                      ""
                    ) !== PlayIcon.src
                  ) {
                    document
                      .getElementById(`${id}_soundicon`)
                      .classList.replace("opacity-0", "opacity-100");
                  } else {
                    document
                      .getElementById(`${id}_soundicon`)
                      .classList.replace("opacity-100", "opacity-0");
                  }
                }}
                alt="play icon green"
                priority={true}
                height={20}
              />
            </div>
            <h1 className="text-2xl text-white font-bold ml-4">
              {pageTitle}
            </h1>
          </div>
        ) : (
          ""
        )}
      </div>

      <div className="flex items-center absolute right-8">
        {isLoggedIn ? (

          <Menu>
            <MenuButton
              as={Button}
              rounded="full"
              variant="link"
              cursor="pointer"
              minW={0}
            >
              <Flex alignItems="center">
                <Box position="relative">
                  {userData.role === 'premium' && (
                    <Box
                      position="absolute"
                      top="-2px"
                      left="-2px"
                      right="-2px"
                      bottom="-2px"
                      borderRadius="full"
                      borderWidth="2px"
                      borderColor="gold"
                      zIndex={1}
                    />
                  )}
                  <Avatar
                    size="sm"
                    name={getInitials(userData.username)}
                    src={userData.avatarImg || DummyProfile.src}
                    bg={userData.role === 'premium' ? "yellow.400" : "green.500"}
                  />
                  {userData.role === 'premium' && (
                    <Box
                      position="absolute"
                      bottom="-2px"
                      right="-2px"
                      bg="gold"
                      borderRadius="full"
                      p="1px"
                      boxSize="14px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="10px"
                      fontWeight="bold"
                      color="black"
                      border="1px solid black"
                      zIndex={2}
                    >
                      <Icon as={FaStar} boxSize="8px" />
                    </Box>
                  )}
                </Box>
                <Text
                  color="white"
                  ml={2}
                  fontWeight="medium"
                  display={{ base: 'none', md: 'block' }}
                >
                  {userData.username}
                  {userData.role === 'premium' && (
                    <Text as="span" color="gold" ml={1} fontSize="xs">
                      (Premium)
                    </Text>
                  )}
                </Text>
                <TriangleDownIcon color="white" ml={1} boxSize={3} />
              </Flex>
            </MenuButton>
            <MenuList rounded="md" bg="#282828" shadow="xl" border="none" color="white">
              <MenuItem
                _hover={{ backgroundColor: "#3F3D3C" }}
                bg="#292928"
                opacity="0.8"
                className="font-book text-sm"
                onClick={goToProfile}
              >
                Profile
              </MenuItem>
              <MenuItem
                _hover={{ backgroundColor: "#3F3D3C" }}
                bg="#292928"
                opacity="0.8"
                className="font-book text-sm"
              >
                Account settings
              </MenuItem>

              {(userData.is_super === 1 || userData.is_super === true) && (
                <MenuItem
                  _hover={{ backgroundColor: "#3F3D3C" }}
                  bg="#292928"
                  opacity="0.8"
                  className="font-book text-sm"
                  onClick={handleGoToAdmin}
                >
                  Go to Admin Panel
                </MenuItem>
              )}

              <MenuItem
                _hover={{ backgroundColor: "#3F3D3C" }}
                bg="#292928"
                opacity="0.8"
                className="font-book text-sm"
                onClick={handleLogout}
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (

          <HStack spacing={4}>
            <Button
              onClick={onOpen}
              bg="white"
              color="black"
              _hover={{ bg: "#f8f8f8" }}
              borderRadius="full"
              size="sm"
              px={4}
              data-login-button
            >
              Log in
            </Button>
            <Button
              onClick={onRegisterOpen}
              bg="white"
              color="black"
              _hover={{ bg: "#f8f8f8" }}
              borderRadius="full"
              size="sm"
              px={4}
            >
              Register
            </Button>
          </HStack>
        )}


        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent bg="#282828" color="white">
            <ModalHeader>Login to Spotify</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>

              <Button
                w="100%"
                leftIcon={<FaGoogle />}
                onClick={handleGoogleLogin}
                mb={4}
                variant="outline"
                colorScheme="red"
              >
                Continue with Google
              </Button>

              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>

              <FormControl mt={4}>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="green" mr={3} onClick={handleLogin}>
                Login
              </Button>
              <Button onClick={onClose} variant="ghost">Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>


        <Modal isOpen={isRegisterOpen} onClose={onRegisterClose}>
          <ModalOverlay />
          <ModalContent bg="#282828" color="white">
            <ModalHeader>Register to Spotify</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  placeholder="Email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                />
              </FormControl>

              <FormControl mt={4}>
                <FormLabel>Username</FormLabel>
                <Input
                  placeholder="Username"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                />
              </FormControl>

              <FormControl mt={4}>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                />
              </FormControl>

              <FormControl mt={4}>
                <FormLabel>Confirm Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                />
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="green" mr={3} onClick={handleRegister}>
                Register
              </Button>
              <Button onClick={onRegisterClose} variant="ghost">Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>


      <Popover>
        <PopoverTrigger>
          <Button
            leftIcon={<FaMusic />}
            colorScheme="teal"
            variant="outline"
            ml={4}
          >
            Random Tracks
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader>Random Tracks</PopoverHeader>
          <PopoverBody>
            {isLoadingTracks ? (
              <Text>Loading...</Text>
            ) : (
              <List spacing={3}>
                {randomTracks.map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isThisPlaying = isCurrent && isPlaying;
                  return (
                    <ListItem key={track.id} display="flex" justifyContent="space-between" alignItems="center">
                      <Text>
                        <b>{track.title}</b> - {track.artists && track.artists.length > 0 ? track.artists[0].name : "Unknown Artist"}
                        <Text fontSize="sm" color="gray.500">
                          {formatDuration(track.duration_ms)}
                        </Text>
                      </Text>
                      <Button
                        colorScheme="green"
                        size="sm"
                        onClick={() => handlePlayPauseClick(track.id)}
                        leftIcon={isThisPlaying ? <Icon as={FaPause} /> : <Icon as={FaPlay} />}
                      >
                        {isThisPlaying ? 'Pause' : 'Play'}
                      </Button>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </header>
  );
}

export default Header;