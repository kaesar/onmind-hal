import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-blue-50 p-8 text-blue-900">
      <h1 className="text-6xl font-bold text-blue-300">404</h1>
      <p className="mt-4 text-xl text-blue-400">Page not found</p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        Go Home
      </Link>
    </div>
  );
}
