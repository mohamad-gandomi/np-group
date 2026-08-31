export default function ShopLoading() {
  return <main className="container-shell py-16" aria-label="در حال بارگذاری محصولات"><div className="mb-10 h-20 animate-pulse bg-muted" /><div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[4/5] animate-pulse bg-muted" />)}</div></main>;
}
