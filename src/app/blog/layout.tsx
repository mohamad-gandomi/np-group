import "./journal.css";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <><a className="journal-skip" href="#journal-main">رفتن به محتوای مجله</a>{children}</>;
}
