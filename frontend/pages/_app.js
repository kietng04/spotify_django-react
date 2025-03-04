import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { ChakraProvider } from "@chakra-ui/react";
import PlayerSection from "./components/PlayerSection";
import Header from "./components/Header";
import { RecoilRoot } from "recoil";
import { AuthProvider } from '../context/AuthContext';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

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
      // handle FCP results
      break;
    case "LCP":
      // handle LCP results
      break;
    case "CLS":
      // handle CLS results
      break;
    case "FID":
      // handle FID results
      break;
    case "TTFB":
      // handle TTFB results
      break;
    case "INP":
      // handle INP results (note: INP is still an experimental metric)
      break;
    default:
      break;
  }
}

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider>
      <RecoilRoot>
        <AuthProvider>
          <div>
            <Component {...pageProps} />
            <Header />
            <PlayerSection />
            <Analytics />
          </div>
        </AuthProvider>
      </RecoilRoot>
    </ChakraProvider>
  );
}

export default MyApp;
