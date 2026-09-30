type MobileBottomNavProps = {
  active?: "simulate" | "history" | "compare" | "account";
};

const items = [
  { key: "simulate", href: "/simulacao-v2", icon: "▦", label: "Simular" },
  { key: "history", href: "/dashboard", icon: "↺", label: "Histórico" },
  { key: "compare", href: "/comparar", icon: "▥", label: "Comparar" },
  { key: "account", href: "/upgrade", icon: "○", label: "Conta" },
] as const;

export default function MobileBottomNav({ active }: MobileBottomNavProps) {
  return (
    <nav className="mobileBottomNav" aria-label="Navegação principal mobile">
      {items.map((item) => (
        <a key={item.key} href={item.href} className={active === item.key ? "active" : ""}>
          <span aria-hidden="true">{item.icon}</span>
          <b>{item.label}</b>
        </a>
      ))}
    </nav>
  );
}
