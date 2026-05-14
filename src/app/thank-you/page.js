export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">Thank you</h1>
        <p className="mt-4 text-base text-slate-700">
          Your TEC assessment form has been submitted successfully.
        </p>
        <p className="mt-2 text-base text-slate-700">
          You can close this page or return to the form if you need to start a new submission.
        </p>
        <a
          href="/"
          className="mt-8 inline-flex rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          Return to form
        </a>
      </div>
    </main>
  );
}
