import Link from "next/link";

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 text-[#0F172A]">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/" className="text-sm font-semibold text-[#4F46E5] hover:underline">← Back to home</Link>
        <h1 className="text-3xl font-bold">Security Overview</h1>
        <p className="text-[#64748B] leading-relaxed">
          ModelMatch is built with security in mind. We aim to protect account access, keep platform data handling transparent, and make sure sensitive content is handled with care.
        </p>
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 space-y-3">
          <h2 className="text-lg font-semibold">What we do</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[#374151]">
            <li>Use standard authentication practices for sign-in and account access.</li>
            <li>Limit the data we store to what is necessary for the experience.</li>
            <li>Review and update our controls as the product evolves.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
