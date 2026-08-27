export function Breadcrumbs({
  items,
}: {
  items: { name: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={`${item.name}-${i}`} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <a href={item.href} className="hover:text-fg">
                {item.name}
              </a>
            ) : (
              <span className="text-fg">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
