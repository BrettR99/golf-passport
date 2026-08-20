"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
});

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

function createGolfFlag(course: Course) {
  const group = new THREE.Group();

  const flagColor = course.played ? "#8fd19e" : "#e6c875";

  const poleMaterial = new THREE.MeshBasicMaterial({
    color: "#d9dedb",
  });

  const flagMaterial = new THREE.MeshBasicMaterial({
    color: flagColor,
    side: THREE.DoubleSide,
  });

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8),
    poleMaterial
  );

  pole.position.y = 0.32;

  group.add(pole);

  const flagShape = new THREE.Shape();

  flagShape.moveTo(0, 0.58);
  flagShape.lineTo(0.42, 0.48);
  flagShape.lineTo(0, 0.34);
  flagShape.lineTo(0, 0.58);

  const flagGeometry = new THREE.ShapeGeometry(flagShape);

  const flag = new THREE.Mesh(flagGeometry, flagMaterial);

  flag.position.x = 0.02;

  group.add(flag);

  const base = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 10, 10),
    new THREE.MeshBasicMaterial({
      color: flagColor,
    })
  );

  base.position.y = 0;

  group.add(base);

  return group;
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
        setCountries(data.features);
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
      <Globe
        ref={globeRef}
        width={390}
        height={390}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
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
        polygonLabel={({ properties }: any) => `
          <div style="
            background: rgba(7, 13, 9, 0.94);
            color: white;
            padding: 7px 10px;
            border-radius: 8px;
            border: 1px solid rgba(150, 190, 158, 0.35);
            font-family: Arial, sans-serif;
            font-size: 12px;
          ">
            <strong>${properties?.ADMIN ?? "Country"}</strong>
          </div>
        `}
        onPolygonClick={(polygon: any) => {
          setSelectedCountry(polygon?.properties?.ADMIN ?? "");
        }}
        polygonsTransitionDuration={250}
        pointsData={courses}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={0.025}
        pointThreeObject={(course: Course) => createGolfFlag(course)}
        pointThreeObjectExtend={false}
        pointLabel={(course: Course) => `
          <div style="
            background: rgba(5, 10, 7, 0.95);
            color: white;
            padding: 8px 10px;
            border-radius: 9px;
            border: 1px solid rgba(150, 190, 158, 0.35);
            font-family: Arial, sans-serif;
            font-size: 12px;
          ">
            <strong>${course.name}</strong><br/>
            <span style="opacity:.65">${course.location}</span><br/>
            <span style="color:${course.played ? "#9ed5a7" : "#e6c875"}">
              ${course.played ? `Played · ${course.score}` : "Wishlist"}
            </span>
          </div>
        `}
        onPointClick={(point: any) => {
          onCourseSelect?.(point as Course);
        }}
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