import { Skeleton } from "@/components/ui/skeleton";

export default function ContactsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-64 w-full rounded-md" />
    </div>
  );
}
