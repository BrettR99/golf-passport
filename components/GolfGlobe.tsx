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
 * Make sure coordinates are actual numbers.
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
 * Create a visible golf flag using HTML.
 *
 * We are also going to use point markers underneath
 * the flags as a guaranteed visual marker.
 */
function makeFlag(course: Course, onClick: () => void) {
  const el = document.createElement("div");

  const flagColor = course.played
    ? "#8fd19e"
    : "#e6c875";

  el.style.width = "46px";
  el.style.height = "58px";
  el.style.position = "relative";
  el.style.cursor = "pointer";
  el.style.pointerEvents = "auto";
  el.style.transform = "translate(-50%, -100%)";
  el.style.zIndex = "9999";

  el.innerHTML = `
    <div
      style="
        position:absolute;
        left:22px;
        top:0;
        width:3px;
        height:39px;
        background:#ffffff;
        border-radius:3px;
        box-shadow:0 0 5px rgba(255,255,255,.6);
      "
    ></div>

    <div
      style="
        position:absolute;
        left:24px;
        top:1px;
        width:22px;
        height:15px;
        background:${flagColor};
        clip-path:polygon(0 0,100% 25%,0 100%);
        filter:drop-shadow(0 0 7px ${flagColor});
      "
    ></div>

    <div
      style="
        position:absolute;
        left:10px;
        top:39px;
        width:26px;
        height:11px;
        border-radius:50%;
        background:${flagColor};
        box-shadow:
          0 0 8px ${flagColor},
          0 0 18px ${flagColor};
      "
    ></div>
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
   * Load golf courses.
   */
  useEffect(() => {
    const passedCourses = Array.isArray(initialCourses)
      ? initialCourses
      : [];

    const normalizedPassedCourses = passedCourses
      .map(normalizeCourse)
      .filter(Boolean) as Course[];

    if (normalizedPassedCourses.length > 0) {
      setCourses(normalizedPassedCourses);

      console.log(
        "GOLF GLOBE COURSES:",
        normalizedPassedCourses.length
      );

      console.log(
        "FIRST COURSE:",
        normalizedPassedCourses[0]
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

        const normalizedCourses = (data || [])
          .map(normalizeCourse)
          .filter(Boolean) as Course[];

        setCourses(normalizedCourses);

        console.log(
          "GOLF GLOBE COURSES FROM SUPABASE:",
          normalizedCourses.length
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
   * Initial globe position.
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

  /*
   * Log whenever courses reach the globe.
   */
  useEffect(() => {
    console.log(
      "COURSES CURRENTLY ON GLOBE:",
      courses.length
    );

    if (courses.length > 0) {
      console.log(
        "COURSE COORDINATES:",
        courses.map((course) => ({
          name: course.name,
          lat: Number(course.latitude),
          lng: Number(course.longitude),
        }))
      );
    }
  }, [courses]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
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
         * GUARANTEED COURSE MARKERS
         *
         * These are simple glowing dots.
         * They let us verify the coordinates are
         * actually reaching the globe.
         */
        pointsData={courses}

        pointLat={(course: Course) =>
          Number(course.latitude)
        }

        pointLng={(course: Course) =>
          Number(course.longitude)
        }

        pointAltitude={0.065}

        pointRadius={0.35}

        pointColor={(course: Course) =>
          course.played
            ? "#8fd19e"
            : "#e6c875"
        }

        pointsMerge={false}

        onPointClick={(course: Course) => {
          setSelectedCountry("");
          setSelectedCourse(course);
        }}

        /*
         * FLAG MARKERS
         */
        htmlElementsData={courses}

        htmlLat={(course: Course) =>
          Number(course.latitude)
        }

        htmlLng={(course: Course) =>
          Number(course.longitude)
        }

        htmlAltitude={0.075}

        htmlElement={(course: Course) =>
          makeFlag(course, () => {
            setSelectedCountry("");
            setSelectedCourse(course);
          })
        }

        htmlTransitionDuration={0}
      />

      {/*
       * SIMPLE LEGEND
       */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
          marginTop: "-2px",
          color: "#8c968f",
          fontSize: "13px",
        }}
      >
        <span>
          <span
            style={{
              color: "#8fd19e",
              fontSize: "18px",
              marginRight: "5px",
            }}
          >
            ●
          </span>
          Played
        </span>

        <span>
          <span
            style={{
              color: "#e6c875",
              fontSize: "18px",
              marginRight: "5px",
            }}
          >
            ●
          </span>
          Wishlist
        </span>
      </div>

      {/*
       * DRAG INSTRUCTION
       */}
      <div
        style={{
          marginTop: "5px",
          color: "#8c968f",
          fontSize: "13px",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        ↔ Drag to explore
      </div>

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
            zIndex: 20,
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
            zIndex: 20,
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
    </div>
  );
}