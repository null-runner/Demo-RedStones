"use client";

import { Ban } from "lucide-react";

import type { LostReasonItem } from "../_lib/dashboard.service";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEUR } from "@/lib/format";

interface Props {
  data: LostReasonItem[];
}

export function LostDealsBreakdown({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deal Persi per Motivazione</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-10">
          <Ban className="h-8 w-8" />
          <p>Nessun deal perso nel periodo</p>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const totalValue = data.reduce((sum, d) => sum + d.totalValue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Deal Persi per Motivazione{" "}
          <span className="text-muted-foreground text-sm font-normal">
            ({total} deal — {formatEUR(totalValue)})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item) => {
            const pct = Math.round((item.count / total) * 100);
            return (
              <div key={item.reason}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{item.reason}</span>
                  <span className="text-muted-foreground">
                    {item.count} ({pct}%) — {formatEUR(item.totalValue)}
                  </span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-destructive/70 h-full rounded-full transition-all"
                    style={{ width: `${String(pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
