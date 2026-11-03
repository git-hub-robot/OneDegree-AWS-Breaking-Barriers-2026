import { Suspense } from "react";
import Screener from "@/components/Screener";

export default function ScreenerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
        </div>
      }
    >
      <Screener />
    </Suspense>
  );
}
