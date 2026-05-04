import Link from "next/link";
import NavbarAuth from "./NavbarAuth";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/95 shadow-sm">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"
      >
        <Link
          href="/"
          className="flex items-center text-2xl font-bold leading-none tracking-normal text-teal-700 transition hover:text-teal-800 sm:text-4xl"
        >
          JobTrack.
        </Link>

        <NavbarAuth />
      </nav>
    </header>
  );
}
