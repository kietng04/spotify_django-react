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

function MyApp({ Component, pageProps }) {
  return (
    <RecoilRoot>
      <ChakraProvider>
        <AuthProvider>
          <TrackProvider>
            <div className="relative">
              <Header />
              <Component {...pageProps} />
              <PlayerSection />
            </div>
          </TrackProvider>
        </AuthProvider>
      </ChakraProvider>
      <Analytics />
    </RecoilRoot>
  );
}

export default MyApp;
