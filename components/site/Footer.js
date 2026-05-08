export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-white/80">
      <div className="mx-auto flex max-w-7xl items-center px-4 py-4 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500">
          &copy; {currentYear} JobFlow. Built by Kostas Altiparmakis.
        </p>
      </div>
    </footer>
  );
}
