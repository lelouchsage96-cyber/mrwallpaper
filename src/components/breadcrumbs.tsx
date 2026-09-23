export function Breadcrumbs({
  items,
}: {
  items: { name: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const href = item.href;
          const name = item.name.replace(/^title\s*:\s*/i, "");
          return (
            <li key={`${item.name}-${i}`} className="flex items-center gap-1.5">
              {i > 0 ? <span aria-hidden="true">/</span> : null}
              {href ? (
                <a href={href} className="hover:text-fg">
                  {name}
                </a>
              ) : (
                <span className="text-fg">{name}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
