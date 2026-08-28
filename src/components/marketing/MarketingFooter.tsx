import Link from "next/link";

// No dedicated pages exist yet for these links — point at "/" as a placeholder until they're built.
const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Changelog", href: "/" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/" },
  { label: "Blog", href: "/" },
  { label: "Contact", href: "/" },
];

const LEGAL_LINKS = [
  { label: "Privacy", href: "/" },
  { label: "Terms", href: "/" },
];

function FooterLink({ label, href }: { label: string; href: string }) {
  const className = "text-[0.88rem] text-marketing-text-muted hover:text-white";
  if (href.startsWith("#")) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-marketing-border px-6 pt-14 pb-7">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 pb-10 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2 text-[1.05rem] font-bold tracking-tight text-white">
            <span className="font-mono text-blue-500">&lt;/&gt;</span>
            DevDrop
          </Link>
          <p className="mt-3 max-w-60 text-[0.85rem] text-marketing-text-dim">
            Your unified hub for developer knowledge &amp; resources.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="mb-1 text-xs tracking-[0.06em] text-marketing-text-dim uppercase">Product</h4>
          {PRODUCT_LINKS.map((link) => (
            <FooterLink key={link.label} {...link} />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="mb-1 text-xs tracking-[0.06em] text-marketing-text-dim uppercase">Company</h4>
          {COMPANY_LINKS.map((link) => (
            <FooterLink key={link.label} {...link} />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="mb-1 text-xs tracking-[0.06em] text-marketing-text-dim uppercase">Legal</h4>
          {LEGAL_LINKS.map((link) => (
            <FooterLink key={link.label} {...link} />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl border-t border-marketing-border pt-6 text-[0.82rem] text-marketing-text-dim">
        <p>&copy; {year} DevDrop. All rights reserved.</p>
      </div>
    </footer>
  );
}
