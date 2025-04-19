import React from "react";
import Section from "./Section";
import { useRouter } from "next/router";
import SearchSection from "./SearchSection";
import TracksSection from "./TracksSection";
import EpisodesSection from "./EpisodesSection";
import PlaylistSection from "../components/PlaylistSection";
import Hero from "./Hero";
import SearchResult from "./SearchResult";
import RecommendedSection from './RecommendedSection';
import PublicPlaylistsSection from './PublicPlaylistsSection';

function HomeSection() {
  let router = useRouter();

  return (
    <div
      id="home_section"
      className="bg-[#121313] sm:w-[83%] w-full pb-56 h-screen overflow-scroll flex flex-col items-center"
    >
      {router.pathname === "/search" ? (
        <SearchSection />
      ) : router.pathname.includes("/search/")? (
        <SearchResult />
      ) : router.pathname === "/collection/tracks" ? (
        <TracksSection />
      ) : router.pathname.includes("/playlist") ? (
        <PlaylistSection />
      ) : (
        <>
          <Hero />
          <PublicPlaylistsSection />
          <RecommendedSection />
        </>
      )}
    </div>
  );
}

export default HomeSection;
