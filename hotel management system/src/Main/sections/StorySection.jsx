import React from "react";

export default function StorySection({ siteContent = {} }) {
  return (
    <section id="about-section" className="modular-section modular-story">
      <span className="modular-eyebrow">{siteContent.aboutEyebrow || "MADE WITH LOVE"}</span>
      <h2>{siteContent.aboutTitle || "Good food. Good mood."}</h2>
      <p>{siteContent.aboutText || "A restaurant experience shaped around food, people and a comfortable place to stay."}</p>
    </section>
  );
}
