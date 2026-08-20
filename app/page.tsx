"use client";

import { useState } from "react";
import GolfGlobe from "../components/GolfGlobe";

export type Course = {
  id: string;
  name: string;
  location: string;

  lat: number;
  lng: number;

  score?: number;
  rating: number;
  played: boolean;
};

const courses: Course[] = [
  {
    id: "sandpiper-resort",
    name: "Sandpiper Resort",
    location: "Harrison Mills, BC",
    lat: 49.3,
    lng: -121.8,
    score: 89,
    rating: 9.2,
    played: true,
  },
  {
    id: "whistler-golf-club",
    name: "Whistler Golf Club",
    location: "Whistler, BC",
    lat: 50.12,
    lng: -122.96,
    score: 94,
    rating: 9.0,
    played: true,
  },
  {
    id: "pebble-beach",
    name: "Pebble Beach",
    location: "California, USA",
    lat: 36.57,
    lng: -121.95,
    rating: 9.8,
    played: false,
  },
  {
    id: "st-andrews",
    name: "St Andrews",
    location: "Scotland, UK",
    lat: 56.34,
    lng: -2.8,
    rating: 9.9,
    played: false,
  },
  {
    id: "royal-melbourne",
    name: "Royal Melbourne",
    location: "Melbourne, Australia",
    lat: -37.83,
    lng: 145.03,
    rating: 9.7,
    played: false,
  },
];

export default function Home() {
  const [selectedCourse, setSelectedCourse] =
    useState<Course>(courses[0]);

  const [activeTab, setActiveTab] =
    useState("World");

  return (
    <main className="app-shell">

      {/* TOP HEADER */}
      <div className="top-bar">
        <div>
          <div className="brand">
            GOLF PASSPORT
          </div>

          <div className="page-title">
            Your Golf World
          </div>
        </div>

        <button
          className="profile-button"
          aria-label="Profile"
        >
          B
        </button>
      </div>


      {/* STATS */}
      <div className="stats-row">

        <div className="stat">
          <strong>2</strong>
          <span>Courses</span>
        </div>

        <div className="stat">
          <strong>1</strong>
          <span>Country</span>
        </div>

        <div className="stat">
          <strong>3</strong>
          <span>Wishlist</span>
        </div>

      </div>


      {/* GLOBE */}
      <section className="globe-section">

        <GolfGlobe
          courses={courses}
          onCourseSelect={setSelectedCourse}
        />

        {/* ONLY LEGEND ON THE PAGE */}
        <div className="map-label">

          <span className="legend-dot played-dot" />

          Played

          <span className="legend-dot wishlist-dot" />

          Wishlist

        </div>

      </section>


      {/* COURSE CARD */}
      <section className="course-card">

        <div className="course-card-top">

          <div>

            <div className="eyebrow">
              {selectedCourse.played
                ? "PLAYED COURSE"
                : "WISHLIST"}
            </div>

            <h2>
              {selectedCourse.name}
            </h2>

            <p>
              {selectedCourse.location}
            </p>

          </div>


          <div className="course-rating">

            <span>★</span>

            {selectedCourse.rating}

          </div>

        </div>


        {selectedCourse.played &&
        selectedCourse.score !== undefined ? (

          <div className="score-box">

            <span>Your score</span>

            <strong>
              {selectedCourse.score}
            </strong>

          </div>

        ) : (

          <div className="wishlist-message">

            <span>⭐</span>

            <div>

              <strong>
                On your bucket list
              </strong>

              <small>
                One day you'll play it.
              </small>

            </div>

          </div>

        )}


        <button className="course-action">

          View Course

          <span>→</span>

        </button>

      </section>


      {/* ADD COURSE */}
      <button className="add-course">

        <span>＋</span>

        Add Course

      </button>


      {/* BOTTOM NAV */}
      <nav className="bottom-nav">

        {[
          "World",
          "Explore",
          "Wishlist",
          "Feed",
          "Profile",
        ].map((tab) => (

          <button
            key={tab}
            className={
              activeTab === tab
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(tab)
            }
          >

            <span className="nav-icon">

              {tab === "World" && "◉"}

              {tab === "Explore" && "⌕"}

              {tab === "Wishlist" && "☆"}

              {tab === "Feed" && "◌"}

              {tab === "Profile" && "○"}

            </span>

            <span>{tab}</span>

          </button>

        ))}

      </nav>

    </main>
  );
}