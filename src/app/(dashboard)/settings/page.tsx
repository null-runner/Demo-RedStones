import { pipelineStagesService } from "./_lib/pipeline-stages.service";
import { PipelineStageList } from "./_components/pipeline-stage-list";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const stages = await pipelineStagesService.getAll();

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-semibold">Impostazioni</h1>

      {/* TODO Epic 8: replace with role check — show read-only for non-admin */}
      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Sezione admin. Dopo l&apos;implementazione dell&apos;autenticazione (Epic 8), questa pagina
        sarà accessibile solo agli admin.
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stage Pipeline</CardTitle>
          <CardDescription>
            Personalizza gli stage del tuo processo commerciale. Gli stage protetti (Chiuso Vinto,
            Chiuso Perso) non possono essere modificati.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PipelineStageList stages={stages} />
        </CardContent>
      </Card>
    </div>
  );
}
