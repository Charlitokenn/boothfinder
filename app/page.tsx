"use client";
import { IconRenderer } from "../components/iconRenderer/renderer";
import Map from "../components/mappedIn/Map";

export default function Home() {
  return (
    <div id="fullscreen-container" className="w-full h-screen">
      <Map className="w-full h-full" />
    </div>
  );
}
