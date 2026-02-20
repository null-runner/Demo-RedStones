import { pipelineStagesService } from "./_lib/pipeline-stages.service";
import { usersService } from "./_lib/users.service";
import { PipelineStageList } from "./_components/pipeline-stage-list";
import { UserManagement } from "./_components/user-management";

import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  const stages = await pipelineStagesService.getAll();
  const isAdmin = user?.role === "admin" || user?.role === "guest";
  const allUsers = isAdmin ? await usersService.getAllUsers() : [];

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-semibold">Impostazioni</h1>

      <Card>
        <CardHeader>
          <CardTitle>Stage Pipeline</CardTitle>
          <CardDescription>
            {isAdmin
              ? "Personalizza gli stage del tuo processo commerciale. Gli stage protetti (Chiuso Vinto, Chiuso Perso) non possono essere modificati."
              : "Visualizzazione degli stage pipeline (sola lettura)."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PipelineStageList stages={stages} isAdmin={isAdmin} />
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Gestione Utenti</CardTitle>
            <CardDescription>
              Invita nuovi utenti al team o rimuovi utenti esistenti.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserManagement initialUsers={allUsers} currentUserId={user.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
