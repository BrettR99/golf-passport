"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
});

const GlobeComponent: any = Globe;

type Course = {
  id: string;
  name: string;
  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  website?: string | null;
  holes?: number | null;
  par?: number | null;
  rating?: number | null;
  description?: string | null;
  played?: boolean;
  score?: number;
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

export default function GolfGlobe() {
  const globeRef = useRef<any>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("");

  useEffect(() => {
    async function loadCourses() {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(5000);

      if (error) {
        console.error("Course database error:", error);
        return;
      }

      if (data) {
        setCourses(data as Course[]);
      }
    }

    loadCourses();
  }, []);

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
    )
      .then((response) => response.json())
      .then((data) => {
        setCountries(data.features || []);
      })
      .catch((error) => {
        console.error("Country data error:", error);
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
    <div
      className="golf-globe"
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
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
        htmlLat="latitude"
        htmlLng="longitude"
        htmlAltitude={0.035}
        htmlElement={(course: Course) =>
          createFlagElement(course, () => {
            setSelectedCourse(course);
          })
        }
        htmlTransitionDuration={0}
      />

      {selectedCountry && !selectedCourse && (
        <button
          className="selected-country"
          onClick={() => setSelectedCountry("")}
        >
          <span>COUNTRY</span>
          <strong>{selectedCountry}</strong>
          <small>Tap to dismiss</small>
        </button>
      )}

      {selectedCourse && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "20px",
            transform: "translateX(-50%)",
            width: "250px",
            padding: "16px",
            borderRadius: "16px",
            background: "rgba(7,13,9,.94)",
            border: "1px solid rgba(150,190,158,.35)",
            color: "white",
            zIndex: 10,
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              letterSpacing: "3px",
              color: "#8fd19e",
              marginBottom: "5px",
            }}
          >
            GOLF COURSE
          </div>

          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              marginBottom: "4px",
            }}
          >
            {selectedCourse.name}
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#9ca69f",
              marginBottom: "12px",
            }}
          >
            {[selectedCourse.city, selectedCourse.region, selectedCourse.country]
              .filter(Boolean)
              .join(", ")}
          </div>

          <button
            onClick={() => setSelectedCourse(null)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              background: "#dfe9df",
              color: "#101711",
              fontWeight: 700,
            }}
          >
            Close
          </button>
        </div>
      )}

      <div className="globe-hint">
        <span>↔</span>
        Drag to explore
      </div>
    </div>
  );
}