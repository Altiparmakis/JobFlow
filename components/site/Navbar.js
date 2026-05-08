import Link from "next/link";
import Image from "next/image";
import NavbarAuth from "./NavbarAuth";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/95 shadow-sm">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"
      >
        <Link
          href="/"
          className="flex items-center transition hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          aria-label="jobFlow home"
        >
          <Image
            src="/finalLogo.png"
            alt="jobFlow logo"
            width={2172}
            height={724}
            priority
            className="h-auto w-45 sm:w-55"
          />
        </Link>

        <NavbarAuth />
      </nav>
    </header>
  );
}
