"use client";

import { useState } from "react";

const courses = [
  {
    name: "Sandpiper Resort",
    location: "Harrison Mills, BC",
    score: 89,
    rating: 9.2,
    x: "17%",
    y: "43%",
    played: true,
  },
  {
    name: "Whistler Golf Club",
    location: "Whistler, BC",
    score: 94,
    rating: 9.0,
    x: "20%",
    y: "38%",
    played: true,
  },
  {
    name: "Pebble Beach",
    location: "California, USA",
    score: null,
    rating: 9.8,
    x: "18%",
    y: "52%",
    played: false,
  },
  {
    name: "St Andrews",
    location: "Scotland, UK",
    score: null,
    rating: 9.9,
    x: "52%",
    y: "31%",
    played: false,
  },
  {
    name: "Royal Melbourne",
    location: "Melbourne, Australia",
    score: null,
    rating: 9.7,
    x: "84%",
    y: "73%",
    played: false,
  },
];

export default function Home() {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  const [activeTab, setActiveTab] = useState("World");

  return (
    <main className="app-shell">
      <div className="top-bar">
        <div>
          <div className="brand">GOLF PASSPORT</div>
          <div className="page-title">Your Golf World</div>
        </div>

        <button className="profile-button" aria-label="Profile">
          B
        </button>
      </div>

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

      <section className="globe-section">
        <div className="globe">
          <div className="globe-grid horizontal one" />
          <div className="globe-grid horizontal two" />
          <div className="globe-grid horizontal three" />
          <div className="globe-grid vertical one" />
          <div className="globe-grid vertical two" />

          <div className="continent north-america" />
          <div className="continent south-america" />
          <div className="continent europe" />
          <div className="continent asia" />
          <div className="continent australia" />

          {courses.map((course) => (
            <button
              key={course.name}
              className={`course-pin ${
                selectedCourse.name === course.name ? "selected" : ""
              } ${course.played ? "played" : "wishlist"}`}
              style={{ left: course.x, top: course.y }}
              onClick={() => setSelectedCourse(course)}
              aria-label={course.name}
            >
              <span />
            </button>
          ))}

          <div className="globe-shine" />
        </div>

        <div className="map-label">
          <span className="legend-dot played-dot" />
          Played
          <span className="legend-dot wishlist-dot" />
          Wishlist
        </div>
      </section>

      <section className="course-card">
        <div className="course-card-top">
          <div>
            <div className="eyebrow">
              {selectedCourse.played ? "PLAYED COURSE" : "WISHLIST"}
            </div>

            <h2>{selectedCourse.name}</h2>
            <p>{selectedCourse.location}</p>
          </div>

          <div className="course-rating">
            <span>★</span>
            {selectedCourse.rating}
          </div>
        </div>

        {selectedCourse.played && selectedCourse.score ? (
          <div className="score-box">
            <span>Your score</span>
            <strong>{selectedCourse.score}</strong>
          </div>
        ) : (
          <div className="wishlist-message">
            <span>⭐</span>
            <div>
              <strong>On your bucket list</strong>
              <small>One day you'll play it.</small>
            </div>
          </div>
        )}

        <button className="course-action">
          View Course
          <span>→</span>
        </button>
      </section>

      <button className="add-course">
        <span>＋</span>
        Add Course
      </button>

      <nav className="bottom-nav">
        {["World", "Explore", "Wishlist", "Feed", "Profile"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
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