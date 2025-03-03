import React from 'react';
import Header from './Header';
import { Box } from '@chakra-ui/react';
import Head from 'next/head';

export default function Layout({ children, title = 'Spotify' }) {
  return (
    <>
      <Head>
        <title>{title} - Spotify</title>
        <meta name="description" content="Spotify clone application" />
      </Head>
      
      {/* Main layout container */}
      <Box 
        minH="100vh" 
        bg="#121212" 
        color="white"
        display="flex"
        flexDirection="column"
      >
        {/* Header component */}
        <Header />
        
        {/* Main content area */}
        <Box 
          as="main"
          flex="1"
          w="full"
          position="relative"
          bg="linear-gradient(rgba(0,0,0,0.6) 0%, #121212 100%)"
        >
          {children}
        </Box>
      </Box>
    </>
  );
}
