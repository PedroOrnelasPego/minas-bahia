import React from "react";
import { Spinner } from "react-bootstrap";

/**
 * Componente de Loading super leve e reutilizável.
 *
 * Props:
 * - variant: "fullscreen" | "block" | "inline" (default: "block")
 * - size: "sm" | "md" | "lg" (default: "md")
 * - message: string (default: "Carregando...")
 * - className: string (classes extras opcionais)
 */
export default function Loading({
  variant = "block",
  size = "md",
  message = "Carregando...",
  className = "",
}) {
  const dim =
    size === "sm" ? "1.5rem" : size === "lg" ? "3rem" : /* md */ "2rem";

  const spinnerEl = (
    <Spinner
      animation="border"
      role="status"
      style={{
        width: dim,
        height: dim,
        borderWidth: size === "lg" ? "0.35rem" : undefined,
      }}
    >
      <span className="visually-hidden">{message}</span>
    </Spinner>
  );

  if (variant === "fullscreen") {
    return (
      <div
        className={`position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center ${className}`}
        style={{
          zIndex: 2000,
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(2px)",
        }}
        aria-live="polite"
        aria-busy="true"
      >
        {spinnerEl}
        {message ? (
          <div className="mt-3 text-muted fw-semibold">{message}</div>
        ) : null}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <span
        className={`d-inline-flex align-items-center gap-2 ${className}`}
        aria-live="polite"
        aria-busy="true"
      >
        {spinnerEl}
        {message ? <small className="text-muted">{message}</small> : null}
      </span>
    );
  }

  // "block"
  return (
    <div
      className={`d-flex flex-column align-items-center justify-content-center py-4 ${className}`}
      aria-live="polite"
      aria-busy="true"
    >
      {spinnerEl}
      {message ? <div className="mt-2 text-muted">{message}</div> : null}
    </div>
  );
}
