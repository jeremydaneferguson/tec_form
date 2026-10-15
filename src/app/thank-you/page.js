import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">Thank you</h1>
        <p className="mt-4 text-base text-slate-700">
          Your proposal (steps 1–2) has been submitted for assessment and approval.
        </p>
        <p className="mt-2 text-base text-slate-700">
          Track its status under Projects. Approvers will complete steps 3–6.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          Return to form
        </Link>
      </div>
    </main>
  );
}
