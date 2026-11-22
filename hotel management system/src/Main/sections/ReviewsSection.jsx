import React from "react";

export default function ReviewsSection({ reviews = [] }) {
  return (
    <section id="reviews-section" className="modular-section">
      <span className="modular-eyebrow">GUEST VOICES</span>
      <h2>They came for dinner.<br />They stayed in the story.</h2>
      <div className="modular-review-grid">
        {(reviews.length ? reviews : [{ id: "empty", name: "Guest", text: "Your reviews will appear here." }]).slice(0, 3).map((review) => (
          <article key={review.id || review.name}>
            <p>“{review.text}”</p>
            <strong>{review.name}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
