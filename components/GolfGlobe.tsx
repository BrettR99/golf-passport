"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
});

const GlobeComponent: any = Globe;

type Course = {
  name: string;
  location: string;
  lat: number;
  lng: number;
  rating: number;
  played: boolean;
  score?: number;
};

type GolfGlobeProps = {
  courses: Course[];
  onCourseSelect?: (course: Course) => void;
};

function createFlagElement(
  course: Course,
  onClick: () => void
): HTMLDivElement {
  const wrapper = document.createElement("div");

  wrapper.style.width = "34px";
  wrapper.style.height = "42px";
  wrapper.style.position = "relative";
  wrapper.style.cursor = "pointer";
  wrapper.style.pointerEvents = "auto";
  wrapper.style.transform = "translate(-50%, -100%)";

  const color = course.played ? "#8fd19e" : "#e6c875";

  wrapper.innerHTML = `
    <div style="
      position:absolute;
      left:16px;
      top:4px;
      width:2px;
      height:28px;
      background:#e8eee9;
      border-radius:2px;
      box-shadow:0 0 4px rgba(255,255,255,.5);
    "></div>

    <div style="
      position:absolute;
      left:18px;
      top:5px;
      width:16px;
      height:11px;
      background:${color};
      clip-path:polygon(0 0, 100% 25%, 0 100%);
      filter:drop-shadow(0 0 4px ${color});
    "></div>

    <div style="
      position:absolute;
      left:10px;
      top:31px;
      width:14px;
      height:6px;
      border-radius:50%;
      background:${color};
      box-shadow:0 0 8px ${color};
    "></div>
  `;

  wrapper.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });

  return wrapper;
}

export default function GolfGlobe({
  courses,
  onCourseSelect,
}: GolfGlobeProps) {
  const globeRef = useRef<any>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
    )
      .then((response) => response.json())
      .then((data) => {
        setCountries(data.features || []);
      })
      .catch(() => {
        setCountries([]);
      });
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;

    const controls = globeRef.current.controls();

    controls.enableZoom = true;
    controls.enablePan = false;
    controls.autoRotate = false;

    globeRef.current.pointOfView(
      {
        lat: 25,
        lng: -35,
        altitude: 2.35,
      },
      0
    );
  }, []);

  return (
    <div className="golf-globe">
      <GlobeComponent
        ref={globeRef}
        width={390}
        height={390}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
        showAtmosphere={true}
        atmosphereColor="#7fb58c"
        atmosphereAltitude={0.12}
        showGraticules={false}
        animateIn={true}
        waitForGlobeReady={true}
        polygonsData={countries}
        polygonAltitude={0.006}
        polygonCapColor={() => "rgba(31, 62, 38, 0.42)"}
        polygonSideColor={() => "rgba(72, 115, 79, 0.18)"}
        polygonStrokeColor={() => "rgba(177, 205, 181, 0.55)"}
        polygonLabel={(polygon: any) => `
          <div style="
            background:rgba(7,13,9,.94);
            color:white;
            padding:7px 10px;
            border-radius:8px;
            border:1px solid rgba(150,190,158,.35);
            font-family:Arial,sans-serif;
            font-size:12px;
          ">
            <strong>${polygon?.properties?.ADMIN ?? "Country"}</strong>
          </div>
        `}
        onPolygonClick={(polygon: any) => {
          setSelectedCountry(polygon?.properties?.ADMIN ?? "");
        }}
        polygonsTransitionDuration={250}
        htmlElementsData={courses}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.035}
        htmlElement={(course: Course) =>
          createFlagElement(course, () => {
            onCourseSelect?.(course);
          })
        }
        htmlTransitionDuration={0}
      />

      {selectedCountry && (
        <button
          className="selected-country"
          onClick={() => setSelectedCountry("")}
        >
          <span>COUNTRY</span>
          <strong>{selectedCountry}</strong>
          <small>Tap to dismiss</small>
        </button>
      )}

      <div className="globe-hint">
        <span>↔</span>
        Drag to explore
      </div>
    </div>
  );
}