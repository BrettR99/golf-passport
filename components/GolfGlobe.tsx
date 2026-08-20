"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
});

type Course = {
  id: string;
  name: string;
  country?: string | null;
  country_code?: string | null;
  region?: string | null;
  city?: string | null;
  latitude: number;
  longitude: number;
  played?: boolean;
};

function makeFlag(course: Course, onClick: () => void) {
  const el = document.createElement("div");

  const flagColor = course.played ? "#8fd19e" : "#e6c875";

  el.style.width = "34px";
  el.style.height = "44px";
  el.style.position = "relative";
  el.style.cursor = "pointer";
  el.style.pointerEvents = "auto";
  el.style.transform = "translate(-50%, -100%)";

  el.innerHTML = `
    <div style="
      position:absolute;
      left:16px;
      top:3px;
      width:2px;
      height:30px;
      background:#f1f4f1;
      border-radius:2px;
    "></div>

    <div style="
      position:absolute;
      left:18px;
      top:4px;
      width:17px;
      height:12px;
      background:${flagColor};
      clip-path:polygon(0 0,100% 25%,0 100%);
      filter:drop-shadow(0 0 5px ${flagColor});
    "></div>

    <div style="
      position:absolute;
      left:9px;
      top:32px;
      width:16px;
      height:7px;
      border-radius:50%;
      background:${flagColor};
      box-shadow:0 0 10px ${flagColor};
    "></div>
  `;

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });

  return el;
}

export default function GolfGlobe(_props: { courses?: Course[] }) {
  const globeRef = useRef<any>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("");

  // Load golf courses directly from Supabase.
  // This avoids needing a separate /lib/supabase.ts file.
  useEffect(() => {
    async function loadCourses() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          console.error("Supabase environment variables are missing.");
          return;
        }

        const url =
          `${supabaseUrl}/rest/v1/courses` +
          `?select=*` +
          `&latitude=not.is.null` +
          `&longitude=not.is.null` +
          `&limit=5000`;

        const response = await fetch(url, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Supabase returned ${response.status}: ${await response.text()}`
          );
        }

        const data = await response.json();

        setCourses(data || []);
        console.log("Golf courses loaded:", data?.length || 0);
      } catch (error) {
        console.error("Could not load golf courses:", error);
      }
    }

    loadCourses();
  }, []);

  // Load country borders.
  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
    )
      .then((res) => res.json())
      .then((data) => {
        setCountries(data.features || []);
      })
      .catch((err) => {
        console.error("Country map error:", err);
      });
  }, []);

  // Set initial globe position.
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
        altitude: 2.25,
      },
      0
    );
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Globe
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

        // Countries
        polygonsData={countries}
        polygonAltitude={0.006}
        polygonCapColor={() => "rgba(31,62,38,0.42)"}
        polygonSideColor={() => "rgba(72,115,79,0.18)"}
        polygonStrokeColor={() => "rgba(177,205,181,0.55)"}

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
            <strong>${polygon?.properties?.ADMIN || "Country"}</strong>
          </div>
        `}

        onPolygonClick={(polygon: any) => {
          setSelectedCountry(polygon?.properties?.ADMIN || "");
        }}

        polygonsTransitionDuration={250}

        // Golf course flags
        htmlElementsData={courses}
        htmlLat="latitude"
        htmlLng="longitude"
        htmlAltitude={0.035}
        htmlElement={(course: Course) =>
          makeFlag(course, () => {
            setSelectedCourse(course);
          })
        }
        htmlTransitionDuration={0}
      />

      {/* Country popup */}
      {selectedCountry && !selectedCourse && (
        <button
          onClick={() => setSelectedCountry("")}
          style={{
            position: "absolute",
            left: "50%",
            bottom: "20px",
            transform: "translateX(-50%)",
            width: "250px",
            padding: "14px 18px",
            borderRadius: "16px",
            background: "rgba(7,13,9,.94)",
            border: "1px solid rgba(150,190,158,.35)",
            color: "white",
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: "10px",
              letterSpacing: "3px",
              color: "#8fd19e",
            }}
          >
            COUNTRY
          </div>

          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              marginTop: "4px",
            }}
          >
            {selectedCountry}
          </div>

          <div
            style={{
              fontSize: "11px",
              color: "#9ca69f",
              marginTop: "5px",
            }}
          >
            Tap to dismiss
          </div>
        </button>
      )}

      {/* Course popup */}
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
          }}
        >
          <div
            style={{
              fontSize: "10px",
              letterSpacing: "3px",
              color: "#8fd19e",
            }}
          >
            GOLF COURSE
          </div>

          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              marginTop: "4px",
            }}
          >
            {selectedCourse.name}
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#9ca69f",
              marginTop: "4px",
              marginBottom: "12px",
            }}
          >
            {[
              selectedCourse.city,
              selectedCourse.region,
              selectedCourse.country,
            ]
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

      <div
        style={{
          position: "absolute",
          bottom: "-28px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#8c968f",
          fontSize: "13px",
          whiteSpace: "nowrap",
        }}
      >
        ↔ Drag to explore
      </div>
    </div>
  );
}