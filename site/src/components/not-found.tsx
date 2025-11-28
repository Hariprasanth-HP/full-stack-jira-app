import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom"; // or next/link for Next.js

export default function NotFoundPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center text-center px-6">
      <h1 className="text-8xl font-bold text-primary">404</h1>

      <h2 className="mt-4 text-2xl font-semibold tracking-tight">
        Page Not Found
      </h2>

      <p className="mt-2 max-w-md text-muted-foreground">
        Sorry, the page you’re looking for doesn’t exist or has been moved.
      </p>

      <div className="mt-6">
        <Button asChild>
          <Link to="/login" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
