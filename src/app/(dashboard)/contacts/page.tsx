export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contatti</h1>
        <p className="text-muted-foreground">Gestisci i tuoi contatti commerciali</p>
      </div>
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Nessun contatto ancora. Verranno aggiunti in Epic 2.
          </p>
        </div>
      </div>
    </div>
  );
}
