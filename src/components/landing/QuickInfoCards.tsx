export function QuickInfoCards() {
  return (
    <section className="grid grid-cols-2 gap-3 px-4">
      <div className="rounded-[1.5rem] bg-gradient-to-br from-brand-sky/15 to-brand-white p-4 shadow-[0_8px_24px_rgba(77,166,255,0.12)] ring-1 ring-brand-sky/20">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-white shadow-sm">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4DA6FF" strokeWidth="1.75">
            <circle cx="6" cy="17" r="2" />
            <circle cx="18" cy="17" r="2" />
            <path d="M4 17h2l2-7h8l2 7h2M9 10h6" />
          </svg>
        </div>
        <p className="mt-3 text-xs font-medium text-text-muted">Tahmini teslimat</p>
        <p className="text-lg font-bold text-brand-navy">15–20 dk</p>
      </div>

      <div className="rounded-[1.5rem] bg-gradient-to-br from-brand-orange/12 to-brand-white p-4 shadow-[0_8px_24px_rgba(255,122,0,0.12)] ring-1 ring-brand-orange/15">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-white shadow-sm">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF7A00" strokeWidth="1.75">
            <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </div>
        <p className="mt-3 text-xs font-medium text-text-muted">Yakındaki marketler</p>
        <p className="text-lg font-bold text-brand-navy">Sana en yakınlar</p>
      </div>
    </section>
  );
}
