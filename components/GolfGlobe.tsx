"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
});

/*
 * Matches the Supabase courses table.
 *
 * Existing columns:
 * id
 * name
 * country
 * country_code
 * region
 * city
 * latitude
 * longitude
 * website
 * holes
 * par
 * rating
 * description
 * created_at
 * updated_at
 */

type Course = {
  id: string;
  name: string;

  country?: string | null;
  country_code?: string | null;
  region?: string | null;
  city?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  website?: string | null;
  holes?: number | null;
  par?: number | null;
  rating?: number | null;
  description?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  played?: boolean;
};

/*
 * The page can pass its own course objects into this component.
 * We intentionally keep this prop flexible so different Course
 * definitions elsewhere in the app don't cause TypeScript conflicts.
 */
type GolfGlobeProps = {
  courses?: Course[] | any[];
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

export default function GolfGlobe({
  courses: initialCourses = [],
}: GolfGlobeProps) {
  const globeRef = useRef<any>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("");

  /*
   * Use courses passed from the page first.
   *
   * If the page doesn't provide courses, load them directly
   * from Supabase.
   */
  useEffect(() => {
    const passedCourses = (initialCourses || []) as Course[];

    const validPassedCourses = passedCourses.filter(
      (course) =>
        course &&
        course.id &&
        course.name &&
        course.latitude !== null &&
        course.latitude !== undefined &&
        course.longitude !== null &&
        course.longitude !== undefined
    );

    if (validPassedCourses.length > 0) {
      setCourses(validPassedCourses);
      console.log(
        "Golf courses loaded from page:",
        validPassedCourses.length
      );
      return;
    }

    async function loadCourses() {
      try {
        const supabaseUrl =
          process.env.NEXT_PUBLIC_SUPABASE_URL;

        const supabaseKey =
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          console.error(
            "Supabase environment variables are missing."
          );
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

        const validCourses = (data || []).filter(
          (course: Course) =>
            course &&
            course.id &&
            course.name &&
            course.latitude !== null &&
            course.latitude !== undefined &&
            course.longitude !== null &&
            course.longitude !== undefined
        );

        setCourses(validCourses);

        console.log(
          "Golf courses loaded from Supabase:",
          validCourses.length
        );
      } catch (error) {
        console.error(
          "Could not load golf courses:",
          error
        );
      }
    }

    loadCourses();
  }, [initialCourses]);

  /*
   * Load country borders.
   */
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

  /*
   * Set initial globe position.
   */
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

        /*
         * Countries
         */
        polygonsData={countries}
        polygonAltitude={0.006}
        polygonCapColor={() =>
          "rgba(31,62,38,0.42)"
        }
        polygonSideColor={() =>
          "rgba(72,115,79,0.18)"
        }
        polygonStrokeColor={() =>
          "rgba(177,205,181,0.55)"
        }

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
            <strong>
              ${polygon?.properties?.ADMIN || "Country"}
            </strong>
          </div>
        `}

        onPolygonClick={(polygon: any) => {
          setSelectedCourse(null);

          setSelectedCountry(
            polygon?.properties?.ADMIN || ""
          );
        }}

        polygonsTransitionDuration={250}

        /*
         * Golf course flags
         */
        htmlElementsData={courses}
        htmlLat="latitude"
        htmlLng="longitude"
        htmlAltitude={0.035}

        htmlElement={(course: Course) =>
          makeFlag(course, () => {
            setSelectedCountry("");
            setSelectedCourse(course);
          })
        }

        htmlTransitionDuration={0}
      />

      {/*
       * Country popup
       */}
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
            border:
              "1px solid rgba(150,190,158,.35)",
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

      {/*
       * Course popup
       */}
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
            border:
              "1px solid rgba(150,190,158,.35)",
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

          {selectedCourse.rating !== null &&
            selectedCourse.rating !== undefined && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#e6c875",
                  marginBottom: "8px",
                }}
              >
                ★ {selectedCourse.rating}
              </div>
            )}

          {selectedCourse.holes && (
            <div
              style={{
                fontSize: "12px",
                color: "#9ca69f",
                marginBottom: "4px",
              }}
            >
              {selectedCourse.holes} holes
              {selectedCourse.par
                ? ` • Par ${selectedCourse.par}`
                : ""}
            </div>
          )}

          {selectedCourse.description && (
            <div
              style={{
                fontSize: "12px",
                lineHeight: 1.5,
                color: "#aeb7b1",
                marginTop: "8px",
                marginBottom: "12px",
              }}
            >
              {selectedCourse.description}
            </div>
          )}

          {selectedCourse.website && (
            <a
              href={selectedCourse.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "10px",
                background: "rgba(143,209,158,.12)",
                border:
                  "1px solid rgba(143,209,158,.25)",
                color: "#8fd19e",
                textAlign: "center",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              Course Website
            </a>
          )}

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