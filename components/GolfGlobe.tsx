"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
});

/*
 * Supabase courses table
 */
type Course = {
  id: string;
  name: string;

  country?: string | null;
  country_code?: string | null;
  region?: string | null;
  city?: string | null;

  latitude?: number | string | null;
  longitude?: number | string | null;

  website?: string | null;
  holes?: number | null;
  par?: number | null;
  rating?: number | null;
  description?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  played?: boolean;
};

type GolfGlobeProps = {
  courses?: Course[] | any[];
};

/*
 * Convert Supabase values into reliable numeric coordinates.
 */
function normalizeCourse(course: any): Course | null {
  if (!course) return null;

  const latitude = Number(course.latitude);
  const longitude = Number(course.longitude);

  if (
    !course.id ||
    !course.name ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  if (latitude < -90 || latitude > 90) return null;
  if (longitude < -180 || longitude > 180) return null;

  return {
    ...course,
    latitude,
    longitude,
  };
}

/*
 * Create the golf flag marker.
 */
function makeFlag(course: Course, onClick: () => void) {
  const el = document.createElement("div");

  const isPlayed = Boolean(course.played);

  const flagColor = isPlayed ? "#8fd19e" : "#e6c875";

  el.style.width = "42px";
  el.style.height = "52px";
  el.style.position = "relative";
  el.style.cursor = "pointer";
  el.style.pointerEvents = "auto";
  el.style.transform = "translate(-50%, -100%)";
  el.style.zIndex = "100";

  el.innerHTML = `
    <!-- Flag pole -->
    <div style="
      position:absolute;
      left:20px;
      top:2px;
      width:3px;
      height:36px;
      background:#f1f4f1;
      border-radius:3px;
      box-shadow:0 0 4px rgba(255,255,255,.35);
    "></div>

    <!-- Flag -->
    <div style="
      position:absolute;
      left:22px;
      top:3px;
      width:19px;
      height:14px;
      background:${flagColor};
      clip-path:polygon(0 0,100% 25%,0 100%);
      filter:drop-shadow(0 0 6px ${flagColor});
    "></div>

    <!-- Ground marker -->
    <div style="
      position:absolute;
      left:11px;
      top:37px;
      width:20px;
      height:9px;
      border-radius:50%;
      background:${flagColor};
      box-shadow:
        0 0 8px ${flagColor},
        0 0 16px ${flagColor};
    "></div>
  `;

  el.addEventListener("click", (event) => {
    event.stopPropagation();
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

  const [selectedCourse, setSelectedCourse] =
    useState<Course | null>(null);

  const [selectedCountry, setSelectedCountry] =
    useState("");

  /*
   * Load courses.
   */
  useEffect(() => {
    const passedCourses = Array.isArray(initialCourses)
      ? initialCourses
      : [];

    const normalizedPassedCourses = passedCourses
      .map(normalizeCourse)
      .filter(Boolean) as Course[];

    /*
     * If the page already supplied courses, use them.
     */
    if (normalizedPassedCourses.length > 0) {
      setCourses(normalizedPassedCourses);

      console.log(
        "Golf courses loaded from page:",
        normalizedPassedCourses.length
      );

      console.log(
        "First course:",
        normalizedPassedCourses[0]
      );

      return;
    }

    /*
     * Otherwise load directly from Supabase.
     */
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

        const normalizedCourses = (data || [])
          .map(normalizeCourse)
          .filter(Boolean) as Course[];

        setCourses(normalizedCourses);

        console.log(
          "Golf courses loaded from Supabase:",
          normalizedCourses.length
        );

        console.log(
          "First course:",
          normalizedCourses[0]
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
      .catch((error) => {
        console.error(
          "Country map error:",
          error
        );
      });
  }, []);

  /*
   * Set initial globe position.
   */
  useEffect(() => {
    if (!globeRef.current) return;

    const controls =
      globeRef.current.controls();

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
        paddingBottom: "65px",
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
         * COUNTRY BORDERS
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
              ${
                polygon?.properties?.ADMIN ||
                "Country"
              }
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
         * GOLF COURSE FLAGS
         *
         * Coordinates have already been converted
         * to actual numbers above.
         */
        htmlElementsData={courses}

        htmlLat={(course: Course) =>
          Number(course.latitude)
        }

        htmlLng={(course: Course) =>
          Number(course.longitude)
        }

        /*
         * Lift flags slightly above the globe.
         */
        htmlAltitude={0.06}

        htmlElement={(course: Course) =>
          makeFlag(course, () => {
            setSelectedCountry("");
            setSelectedCourse(course);
          })
        }

        htmlTransitionDuration={0}
      />

      {/*
       * COUNTRY POPUP
       */}
      {selectedCountry && !selectedCourse && (
        <button
          onClick={() =>
            setSelectedCountry("")
          }
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
       * COURSE POPUP
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

          {selectedCourse.rating !==
            null &&
            selectedCourse.rating !==
              undefined && (
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
                background:
                  "rgba(143,209,158,.12)",
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
            onClick={() =>
              setSelectedCourse(null)
            }
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

      {/*
       * DRAG INSTRUCTION
       *
       * Moved lower so it doesn't collide
       * with the legend from the page.
       */}
      <div
        style={{
          position: "absolute",
          bottom: "4px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#8c968f",
          fontSize: "13px",
          whiteSpace: "nowrap",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        ↔ Drag to explore
      </div>
    </div>
  );
}