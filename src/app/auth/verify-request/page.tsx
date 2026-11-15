import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-4xl">✉️</div>
        <h1 className="text-xl font-semibold text-zinc-100">Check your email</h1>
        <p className="text-sm text-zinc-500">
          A sign-in link was sent. Click it to continue.
        </p>
        <p className="text-xs text-zinc-600">
          Running locally? The link is printed in the{" "}
          <span className="font-mono">npm run dev</span> terminal.
        </p>
        <Link
          href="/auth/signin"
          className="inline-block text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-2"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
