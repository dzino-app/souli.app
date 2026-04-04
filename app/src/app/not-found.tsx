import Link from "next/link";
import { HelpCircle } from "lucide-react";

export default function RootNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This page does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
