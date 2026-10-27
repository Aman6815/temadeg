import Link from "next/link";
import { site } from "@/config/site";
import { Logo } from "./site-header";

export default function SiteFooter() {
  const { contact } = site;
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">{site.tagline}.</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Families</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/signup?role=parent" className="hover:text-brand-dark">Find a tutor</Link></li>
            <li><Link href="/login" className="hover:text-brand-dark">Log in</Link></li>
            <li><Link href="/#how-it-works" className="hover:text-brand-dark">How it works</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Tutors</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/signup?role=tutor" className="hover:text-brand-dark">Apply as a tutor</Link></li>
            <li><Link href="/#for-tutors" className="hover:text-brand-dark">Why teach with us</Link></li>
            <li><Link href="/#safety" className="hover:text-brand-dark">How we check tutors</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>{contact.email}</li>
            <li>{contact.phone}</li>
            <li>{contact.address}</li>
            <li>{contact.hours}</li>
            {contact.telegram && (
              <li><a href={contact.telegram} className="hover:text-brand-dark" rel="noopener noreferrer">Telegram</a></li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto w-full max-w-6xl px-5 py-5 text-sm text-muted">
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
