import "@/features/showcase/showcase.css";

export default function BrandsLayout({ children }: { children: React.ReactNode }) {
  return <><a className="showcase-skip" href="#showcase-main">رفتن به محتوای برندها</a>{children}</>;
}
