import "@/features/showcase/showcase.css";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <><a className="showcase-skip" href="#showcase-main">رفتن به محتوای پروژه‌ها</a>{children}</>;
}
