import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  link?: string;
  href?: string;
};

export function SectionHeading({ eyebrow, title, link, href = "/shop" }: SectionHeadingProps) {
  return (
    <div className="mb-8 flex items-end justify-between gap-5 md:mb-12">
      <div>
        <p className="mb-3 flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.16em] text-wine">
          <span className="h-px w-8 bg-wine" />{eyebrow}
        </p>
        <h2 className="max-w-2xl text-3xl font-medium leading-[1.3] tracking-tight sm:text-4xl lg:text-5xl">{title}</h2>
      </div>
      {link ? (
        <Link href={href} className="hidden items-center gap-2 border-b border-foreground pb-1 text-sm transition-colors hover:border-wine hover:text-wine sm:flex">
          {link}<ArrowLeft className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
