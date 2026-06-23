export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-2 py-1 text-center text-[8px] leading-none text-slate-400 md:px-4 md:py-4 md:text-xs md:leading-relaxed">
        <p className="whitespace-nowrap md:hidden">
          © All Rights Reserved. Deep Think Team · 2026 AI 챔피언 해커톤
        </p>
        <div className="hidden md:block">
          <p>© All Rights Reserved. Deep Think Team</p>
          <p className="mt-0.5">2026 AI 챔피언 해커톤</p>
        </div>
      </div>
    </footer>
  );
}
