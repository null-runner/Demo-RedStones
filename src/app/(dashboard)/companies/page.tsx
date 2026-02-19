export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aziende</h1>
        <p className="text-muted-foreground">Gestisci le aziende nel tuo CRM</p>
      </div>
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Nessuna azienda ancora. Verranno aggiunte in Epic 2.
          </p>
        </div>
      </div>
    </div>
  );
}
