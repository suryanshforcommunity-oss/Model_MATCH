import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 text-[#0F172A]">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/" className="text-sm font-semibold text-[#4F46E5] hover:underline">← Back to home</Link>
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-[#64748B] leading-relaxed">
          By using ModelMatch, you agree to use the service responsibly and avoid submitting harmful, illegal, or misleading content.
          The recommendations are informational tools and should be reviewed before making a business, technical, or financial decision.
        </p>
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 space-y-3">
          <h2 className="text-lg font-semibold">Use of the service</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[#374151]">
            <li>Do not misuse the service or attempt to interfere with its operation.</li>
            <li>Respect the rights of other users and third-party tools.</li>
            <li>Use recommendations as a starting point, not a guarantee.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
