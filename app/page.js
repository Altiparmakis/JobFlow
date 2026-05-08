import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingAuthActions from "@/components/site/LandingAuthActions";
import Video from "@/components/site/Video";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/applications");
  }

  return (
    <main className="relative flex flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,#dff7f2_0,#f8fafc_34rem)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 -left-28 h-96 w-96 rounded-full bg-[radial-gradient(circle,#dff7f2_0,rgba(223,247,242,0.42)_38%,rgba(248,250,252,0)_72%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-11rem] top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#dff7f2_0,rgba(223,247,242,0.6)_50%,rgba(248,250,252,0)_72%)]"
      />

      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-between gap-8 px-4  pt-8 text-center sm:px-6 sm:pb-5 sm:pt-10 lg:px-8 lg:pt-14 xl:pt-[clamp(5rem,8vh,7rem)] 2xl:pt-[clamp(6rem,9vh,8.5rem)]">
        <div className="max-w-4xl">
          <p className="mx-auto inline-flex rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-800 shadow-sm">
            A focused workspace for your job search
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
            Track every job application in one organized place.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Save opportunities, monitor your progress, and stay focused
            throughout your job search.
          </p>

          <LandingAuthActions />
        </div>
        <Video />
      </section>
    </main>
  );
}
