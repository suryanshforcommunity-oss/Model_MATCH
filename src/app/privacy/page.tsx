import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 text-[#0F172A]">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/" className="text-sm font-semibold text-[#4F46E5] hover:underline">← Back to home</Link>
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-[#64748B] leading-relaxed">
          ModelMatch uses the minimum information needed to provide recommendations and save search history for signed-in users.
          We do not sell personal data and we only retain account and history information as long as it is needed to improve your experience.
        </p>
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 space-y-3">
          <h2 className="text-lg font-semibold">What we collect</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[#374151]">
            <li>Account details you provide when signing in.</li>
            <li>Search prompts and saved history if you choose to store them.</li>
            <li>Basic usage data needed to keep the service secure and reliable.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 space-y-3">
          <h2 className="text-lg font-semibold">How we use it</h2>
          <p className="text-sm text-[#374151] leading-relaxed">
            We use this information to generate AI recommendations, save your search history, and maintain the platform. We do not use your data for unrelated advertising purposes.
          </p>
        </div>
      </div>
    </main>
  );
}
