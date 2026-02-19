import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4">
      <div className="text-center">
        <h1 className="text-muted-foreground text-6xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Pagina non trovata</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
      </div>
      <Link
        href="/"
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
      >
        Torna alla Dashboard
      </Link>
    </div>
  );
}
