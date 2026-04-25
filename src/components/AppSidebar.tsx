import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Package,
  CheckSquare,
  MessageCircle,
  BarChart3,
  Settings,
  Bot,
  Zap,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSystemSettings } from "@/hooks/useSystemSettings";


const menuSections = [
  {
    group: "CRM & Vendas",
    items: [
      { title: "Painel", url: "/", icon: LayoutDashboard },
      { title: "Funil de Vendas", url: "/pipeline", icon: TrendingUp },
      { title: "Contatos", url: "/contacts", icon: Users },
      { title: "WhatsApp", url: "/whatsapp", icon: MessageCircle },
    ],
  },
  {
    group: "Inteligência S3",
    items: [
      { title: "Agentes S3", url: "/agents", icon: Bot },
      { title: "Automação Funil", url: "/automacao-funil", icon: Zap },
    ],
  },
  {
    group: "Gestão",
    items: [
      { title: "Financeiro", url: "/financeiro", icon: DollarSign },
      { title: "Produtos", url: "/products", icon: Package },
      { title: "Tarefas", url: "/tasks", icon: CheckSquare },
    ],
  },
  {
    group: "Sistema",
    items: [
      { title: "Relatórios", url: "/reports", icon: BarChart3 },
      { title: "Configurações", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { data: settings } = useSystemSettings();

  const companyName = settings?.company_name || "Bolten";
  const logoCollapsed = settings?.logo_collapsed;
  const logoCollapsedSize = settings?.logo_collapsed_size || 36;
  // Use theme color from settings; default to orange if not set or if set to black
  const rawThemeColor = settings?.theme_color;
  const themeColor =
    !rawThemeColor || rawThemeColor === "#000000" || rawThemeColor === "hsl(0,0%,0%)"
      ? "#f97316"
      : rawThemeColor;

  const firstLetter = companyName.charAt(0).toUpperCase();

  return (
    <aside
      className={cn(
        "flex flex-col h-full",
        "w-[220px] py-4 px-3 gap-2",
        "bg-background",
        "border-r border-border/60"
      )}
    >
      {/* Logo */}
      <div className="mb-3 flex items-center gap-3 px-1">
        {logoCollapsed ? (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ring-2 ring-orange-200 flex-shrink-0"
            style={{ backgroundColor: themeColor }}
          >
            <img
              src={logoCollapsed}
              alt={companyName}
              style={{ height: `${logoCollapsedSize}px`, width: `${logoCollapsedSize}px` }}
              className="object-contain"
            />
          </div>
        ) : (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center italic font-black text-white text-xl shadow-sm ring-2 ring-orange-200 flex-shrink-0"
            style={{ backgroundColor: themeColor }}
          >
            {firstLetter}
          </div>
        )}
        <span className="font-bold text-sm text-foreground truncate">{companyName}</span>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-border mb-1" />

      {/* Nav Items Grouped */}
      <nav className="flex flex-col gap-6 flex-1 w-full overflow-y-auto pr-1">
        {menuSections.map((section) => (
          <div key={section.group} className="flex flex-col gap-1.5">
            <h3 className="px-3 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
              {section.group}
            </h3>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group",
                      isActive
                        ? "bg-orange-50 shadow-sm ring-1 ring-orange-200/50"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          "h-4 w-4 flex-shrink-0 transition-colors",
                          isActive ? "" : "text-muted-foreground group-hover:text-foreground"
                        )}
                        style={isActive ? { color: themeColor } : {}}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium truncate transition-colors",
                          isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}
                        style={isActive ? { color: themeColor } : {}}
                      >
                        {item.title}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
