export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
      <p className="mb-4 rounded-full border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-medium text-cyan-200">
        CoachSphere
      </p>
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
        Internal stories, concepts, and GTM ideas in one secure channel.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-slate-300">
        A private podcast and video experience for company teams, built for Okta SSO,
        responsive iOS playback, admin publishing, and Slack-first release notifications.
      </p>
    </main>
  );
}
