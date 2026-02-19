import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import type { StagnantDeal } from "../_lib/dashboard.service";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEUR } from "@/lib/format";

interface Props {
  deals: StagnantDeal[];
}

export function StagnantDealsList({ deals }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Stagnanti</CardTitle>
      </CardHeader>
      <CardContent>
        {deals.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-10">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <p>Nessun deal stagnante — ottimo lavoro!</p>
          </div>
        ) : (
          <ul className="divide-y">
            {deals.map((deal) => (
              <li key={deal.id} className="py-3">
                <Link
                  href={`/deals/${deal.id}`}
                  className="flex items-center justify-between gap-2 transition-opacity hover:opacity-80"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{deal.title}</span>
                    <Badge variant="outline">{deal.stage}</Badge>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-sm">
                    <span className={deal.daysInactive >= 30 ? "text-red-600" : "text-amber-600"}>
                      {deal.daysInactive} giorni
                    </span>
                    <span className="text-muted-foreground">{formatEUR(deal.value)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
