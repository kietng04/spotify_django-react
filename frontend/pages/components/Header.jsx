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
  Text
} from "@chakra-ui/react";
import { TriangleDownIcon } from "@chakra-ui/icons";
import SearchIconBlack from "../../images/commonicons/searchiconblack.svg";
import { useRouter } from "next/router";
import PlayIcon from "../../images/commonicons/playicon.svg";
import PauseIcon from "../../images/commonicons/pauseicon.svg";
import { playPauseAction } from "../../lib/tools";
import { useRecoilValue } from "recoil";
import { searchValue } from "../../atoms/searchAtom";

function Header() {
  let router = useRouter();
  let {id} = router.query
  let [pageTitle,setPageTitle] = useState("")
  let searchQuery = useRecoilValue(searchValue)
  // Enhanced user state with complete user information
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState({
    username: '',
    user_id: null,
    token: '',
    expires: ''
  })
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if(document.getElementById("header_common_thing_playbutton")){
      document.getElementById("header_common_thing_playbutton").src =
      PlayIcon.src;
    }
  }, []);

  useEffect(() => {
    setPageTitle(document.title.split(" - ")[1])
  }, [router]);

  // Check for existing token on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('spotify_token');
    const savedUserData = localStorage.getItem('spotify_user');
    
    if (savedToken && savedUserData) {
      setIsLoggedIn(true);
      setUserData(JSON.parse(savedUserData));
    }
  }, []);

  const handleLogin = async () => {
    try {
      // Send request to Django backend
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
        setUserData({
          username: data.username,
          user_id: data.user_id,
          token: data.token,
          expires: data.expires
        });
        
        localStorage.setItem('spotify_token', data.token);
        localStorage.setItem('spotify_user', JSON.stringify({
          username: data.username,
          user_id: data.user_id,
          token: data.token,
          expires: data.expires
        }));
        
        setIsLoggedIn(true);
        onClose();
      } else {
        alert('Login failed: ' + (data.detail || 'Unknown error'));
      }
      
    } catch (error) {
      console.error('Login error:', error);
      alert('Error connecting to server');
    }
  };

  // Handle logout properly
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData({
      username: '',
      user_id: null,
      token: '',
      expires: ''
    });
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_user');
  };

  // Handle profile navigation
  const goToProfile = () => {
    router.push('/profile');
  };

  const isProduction = process.env.NODE_ENV !== "development";

  // First initials for avatar fallback
  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?';
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
        {/* Search and play controls - existing code */}
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
        ) : router.pathname === "/collection/tracks" ? (
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
                      .getElementById("liked_songs_soundicon")
                      .classList.replace("opacity-0", "opacity-100");
                  } else {
                    document
                      .getElementById("liked_songs_soundicon")
                      .classList.replace("opacity-100", "opacity-0");
                  }
                }}
                alt="play icon green"
                priority={true}
                height={20}
              />
            </div>
            <h1 className="text-2xl text-white font-bold ml-4">{pageTitle}</h1>
          </div>
        ) : router.pathname === "/collection/episodes" ? (
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
                      .getElementById("liked_songs_soundicon")
                      .classList.replace("opacity-0", "opacity-100");
                  } else {
                    document
                      .getElementById("liked_songs_soundicon")
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
          // Enhanced user profile display with username
          <Menu>
            <MenuButton
              as={Button}
              rounded="full"
              variant="link"
              cursor="pointer"
              minW={0}
            >
              <Flex alignItems="center">
                <Avatar 
                  size="sm"
                  name={getInitials(userData.username)}
                  src={DummyProfile.src}
                  bg="green.500"
                />
                <Text 
                  color="white" 
                  ml={2} 
                  fontWeight="medium"
                  display={{ base: 'none', md: 'block' }}
                >
                  {userData.username}
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
          // Show login button when not logged in
          <Button 
            onClick={onOpen}
            bg="white" 
            color="black"
            _hover={{ bg: "#f8f8f8" }}
            borderRadius="full"
            size="sm"
            px={4}
          >
            Log in
          </Button>
        )}

        {/* Login Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent bg="#282828" color="white">
            <ModalHeader>Login to Spotify</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
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
      </div>
    </header>
  );
}

export default Header;
