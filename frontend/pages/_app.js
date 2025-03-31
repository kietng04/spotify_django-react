
import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { ChakraProvider } from "@chakra-ui/react";
import PlayerSection from "./components/PlayerSection";
import Header from "./components/Header";
import { RecoilRoot } from "recoil";
import { AuthProvider } from '../context/AuthContext';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { TrackProvider } from '../context/TrackContext';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../context/AuthContext';
import ChatWidget from '../components/ChatWidget';
import '../styles/globals.css';
import { UserProvider } from '../context/UserContext';

const firebaseConfig = {
  apiKey: "AIzaSyCr0HFE78FeeKNeVwkU9CRROK01U2hwxC0",
  authDomain: "spotify-6826c.firebaseapp.com",
  projectId: "spotify-6826c",
  storageBucket: "spotify-6826c.firebasestorage.app",
  messagingSenderId: "1490144756",
  appId: "1:1490144756:web:378159df501ead094e3da1",
  measurementId: "G-HSJSFSP7BK"
};

const app = initializeApp(firebaseConfig);

export function reportWebVitals(metric) {
  switch (metric.name) {
    case "FCP":
      break;
    case "LCP":
      break;
    case "CLS":
      break;
    case "FID":
      break;
    case "TTFB":
      break;
    case "INP":
      break;
    default:
      break;
  }
}

function TokenValidator({ children }) {
  const router = useRouter();
  const { logout } = useAuthContext();
  
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const response = await fetch('http://localhost:8000/api/validate-token/', {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (!response.ok) {
          logout();
        }
      } catch (error) {
      }
    };
    
    validateToken();
  }, [router.pathname]);
  
  return children;
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const path = router.pathname;
  
  // Check if current page is a payment page
  const isPaymentPage = router.pathname.includes('/payment');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Your existing code
    }
  }, []);

  return (
    <RecoilRoot>
      <ChakraProvider>
        <AuthProvider>
          <UserProvider>
            <TrackProvider>
              {!isPaymentPage && <ChatWidget />}
              <TokenValidator>
                {!isPaymentPage && (
                  <div id="home_header">
                    <Header />
                  </div>
                )}
                
                <Component {...pageProps} />
                
                {!isPaymentPage && (
                  <div id="player_section">
                    <PlayerSection />
                  </div>
                )}
              </TokenValidator>
            </TrackProvider>
          </UserProvider>
        </AuthProvider>
      </ChakraProvider>
      <Analytics />
    </RecoilRoot>
  );
}
export default MyApp;