import { Link } from "@tanstack/react-router";

export function DefaultCatchBoundary() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-blue-50 p-8 text-blue-900">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-blue-400">An unexpected error occurred</p>
      <Link
        to="/"
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        Go Home
      </Link>
    </div>
  );
}
