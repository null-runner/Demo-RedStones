"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="it">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h2>Si è verificato un errore</h2>
          <button
            onClick={reset}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}
          >
            Riprova
          </button>
        </div>
      </body>
    </html>
  );
}
