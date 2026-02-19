export default function DealsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground">Gestisci le opportunità commerciali</p>
      </div>
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Nessun deal ancora. Il Kanban verrà aggiunto in Epic 3.
          </p>
        </div>
      </div>
    </div>
  );
}
