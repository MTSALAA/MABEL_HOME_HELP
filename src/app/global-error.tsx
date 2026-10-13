"use client";

import { useEffect } from "react";

// Last-resort screen if a root layout itself fails. It replaces the whole
// document, so it carries its own minimal styles and both languages.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#FBF8F1",
          color: "#1C241F",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "32px", color: "#1F3D2B" }}>
          Something went wrong
        </h1>
        <p style={{ margin: 0, fontSize: "20px", maxWidth: "32rem" }}>
          Sorry about that. Please try again.
          <br />
          <span lang="fr">Nous en sommes désolés. Veuillez réessayer.</span>
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: "56px",
            padding: "0 28px",
            border: 0,
            borderRadius: "16px",
            fontSize: "18px",
            fontWeight: 700,
            backgroundColor: "#2F5D43",
            color: "#FFFFFF",
            cursor: "pointer",
          }}
        >
          Try again / Réessayer
        </button>
      </body>
    </html>
  );
}
