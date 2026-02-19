import { Skeleton } from "@/components/ui/skeleton";

export default function CompaniesLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
