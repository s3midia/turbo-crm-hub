import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Home,
    Scan,
    Columns3,
    Briefcase,
    Calculator,
    Calendar,
    DollarSign,
    FileText,
    Bot,
    Brain,
    Building2,
    Plug,
    CreditCard,
    Star,
    LogOut,
    MessageSquare,
    Users,
    Moon,
    Sun,
    Settings,
    PanelLeft,
    Wrench,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

const NAV_SECTIONS = [
    {
        label: "Principal",
        items: [
            { label: "Visão Geral", icon: Home, to: "/" },
        ]
    },
    {
        label: "AI (Visão Geral)",
        items: [
            { label: "Agentes S3", icon: Bot, to: "/agentes-s3" },
            { label: "Treinamento IA", icon: Brain, to: "/treinamento-ia" },
            { label: "Radar de Leads", icon: Scan, to: "/radar-leads" },
            { label: "Gerador de Sites", icon: Scan, to: "/generator" },
        ]
    },
    {
        label: "Vendas & Leads",
        items: [
            { label: "Funil Kanban", icon: Columns3, to: "/pipeline" },
            { label: "Clientes", icon: Users, to: "/clientes" },
            { label: "Agenda", icon: Calendar, to: "/agenda" },
            { label: "Atendimentos", icon: MessageSquare, to: "/atendimentos" },
            { label: "Modelos de Docs", icon: FileText, to: "/modelos-docs" },
            { label: "Serviços", icon: Briefcase, to: "/servicos" },
        ]
    },
    {
        label: "Financeiro",
        items: [
            { label: "Financeiro", icon: DollarSign, to: "/financeiro" },
        ]
    },
    {
        label: "Empresa",
        items: [
            {
                label: "Ferramentas",
                icon: Wrench,
                subItems: [
                    { label: "Configurações", icon: Settings, to: "/settings" },
                    { label: "Integrações", icon: Plug, to: "/integracoes" },
                    { label: "Equipe", icon: Users, to: "/equipe" },
                    { label: "Perfil da Empresa", icon: Building2, to: "/perfil-empresa" },
                ]
            },
        ]
    }
];

export function AppSidebar() {
    const { data: settings } = useSystemSettings();
    const navigate = useNavigate();
    const location = useLocation();

    // Sidebar collapsed state — persisted in localStorage
    const [collapsed, setCollapsed] = useState(
        () => localStorage.getItem("sidebar_collapsed") === "true"
    );

    // Theme state — default light
    const [theme, setTheme] = useState<"light" | "dark">(
        (localStorage.getItem("theme") as "light" | "dark") || "light"
    );

    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    const companyName = settings?.company_name || "S3 Mídia";
    const logoExpanded = settings?.logo_expanded;
    const logoCollapsed = settings?.logo_collapsed;
    const logoExpandedSize = settings?.logo_expanded_size || 32;
    const logoCollapsedSize = settings?.logo_collapsed_size || 32;

    const rawThemeColor = settings?.theme_color;
    const themeColor =
        !rawThemeColor || rawThemeColor === "#000000" || rawThemeColor === "hsl(0,0%,0%)"
            ? "#f97316"
            : rawThemeColor;

    const firstLetter = companyName.charAt(0).toUpperCase();

    // Apply theme to document
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

    // Persist collapsed state
    const toggleCollapsed = () => {
        setCollapsed((c) => {
            const next = !c;
            localStorage.setItem("sidebar_collapsed", String(next));
            return next;
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    return (
        <aside
            className={cn(
                "flex flex-col h-full bg-background border-r border-border/60 flex-shrink-0 transition-all duration-300",
                collapsed ? "w-[64px] items-center px-2 py-3" : "w-[200px] px-3 py-4"
            )}
        >
            {/* Header: Logo + PanelLeft toggle */}
            <div className={cn("flex items-center mb-4 flex-shrink-0", collapsed ? "flex-col gap-2 w-full" : "justify-between gap-2")}>
                {/* Logo */}
                {collapsed ? (
                    <div
                        className="w-10 h-10 rounded-none flex items-center justify-center shadow-sm flex-shrink-0"
                        style={{ backgroundColor: themeColor }}
                    >
                        {logoCollapsed ? (
                            <img src={logoCollapsed} alt={companyName}
                                style={{ height: `${logoCollapsedSize}px`, width: `${logoCollapsedSize}px` }}
                                className="object-contain rounded-none" />
                        ) : (
                            <span className="text-white font-black text-xl italic leading-none">{firstLetter}</span>
                        )}
                    </div>
                ) : (
                    <div className="flex items-baseline gap-0.5 min-w-0 flex-1">
                        {logoExpanded ? (
                            <img src={logoExpanded} alt={companyName}
                                style={{ height: `${logoExpandedSize}px`, width: "auto", maxWidth: "140px" }}
                                className="object-contain rounded-none" />
                        ) : (
                            <>
                                <span className="text-[22px] font-black tracking-tight text-foreground italic truncate">
                                    {companyName}
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full mb-0.5 flex-shrink-0"
                                    style={{ backgroundColor: themeColor }} />
                            </>
                        )}
                    </div>
                )}

                {/* PanelLeft toggle */}
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <button
                            onClick={toggleCollapsed}
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex-shrink-0"
                        >
                            <PanelLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs font-medium">
                        {collapsed ? "Expandir" : "Recolher"}
                    </TooltipContent>
                </Tooltip>
            </div>

            {/* Nav Items */}
            <nav className={cn(
                "flex flex-col flex-1 w-full overflow-y-auto overflow-x-hidden gap-6",
                "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
                collapsed && "items-center gap-4"
            )}>
                {NAV_SECTIONS.map((section) => (
                    <div key={section.label} className={cn("flex flex-col gap-1", collapsed && "items-center")}>
                        {!collapsed && (
                            <h3 className="px-3 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 mb-1">
                                {section.label}
                            </h3>
                        )}
                        <div className={cn("flex flex-col gap-0.5", collapsed && "items-center")}>
                            {section.items.map((item) => {
                                const hasSubItems = 'subItems' in item && item.subItems;
                                const isSubMenuOpen = openMenus[item.label];

                                if (hasSubItems) {
                                    return (
                                        <div
                                            key={item.label}
                                            className="flex flex-col gap-0.5 w-full relative"
                                            onMouseEnter={() => setOpenMenus(prev => ({ ...prev, [item.label]: true }))}
                                            onMouseLeave={() => setOpenMenus(prev => ({ ...prev, [item.label]: false }))}
                                        >
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        onClick={() => setOpenMenus(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                                                        className={cn(
                                                            "flex flex-row items-center transition-all duration-200 group rounded-xl outline-none",
                                                            collapsed
                                                                ? "justify-center w-10 h-10"
                                                                : "gap-3 px-3 py-2 w-full",
                                                            isSubMenuOpen
                                                                ? "bg-accent/10"
                                                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        <item.icon
                                                            className={cn(
                                                                "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                                                                !isSubMenuOpen && "text-muted-foreground group-hover:text-foreground"
                                                            )}
                                                            style={isSubMenuOpen ? { color: themeColor } : {}}
                                                        />
                                                        {!collapsed && (
                                                            <>
                                                                <span className={cn("text-[13px] font-medium whitespace-nowrap flex-1 text-left", isSubMenuOpen ? "text-foreground" : "")}>
                                                                    {item.label}
                                                                </span>
                                                                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200 opacity-50", isSubMenuOpen ? "rotate-180" : "")} />
                                                            </>
                                                        )}
                                                    </button>
                                                </TooltipTrigger>
                                                {collapsed && (
                                                    <TooltipContent side="right" className="text-xs font-medium">
                                                        {item.label}
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>

                                            {isSubMenuOpen && !collapsed && (
                                                <div className="flex flex-col gap-0.5 ml-9 mt-0.5 border-l border-border/40 pl-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    {item.subItems.map((subItem) => (
                                                        <Link
                                                            key={subItem.to}
                                                            to={subItem.to}
                                                            className={cn(
                                                                "flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] transition-colors",
                                                                location.pathname.startsWith(subItem.to)
                                                                    ? "text-foreground font-semibold bg-accent/5"
                                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                            )}
                                                        >
                                                            {subItem.icon && <subItem.icon className="h-3.5 w-3.5 opacity-70" />}
                                                            {subItem.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                            {isSubMenuOpen && collapsed && (
                                                <div 
                                                    className="absolute left-14 top-0 bg-background border border-border shadow-xl rounded-xl py-2 px-1.5 min-w-[180px] z-[100] flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-200"
                                                    onMouseEnter={() => setOpenMenus(prev => ({ ...prev, [item.label]: true }))}
                                                    onMouseLeave={() => setOpenMenus(prev => ({ ...prev, [item.label]: false }))}
                                                >
                                                    <div className="px-3 py-1.5 mb-1 border-b border-border/50">
                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">{item.label}</span>
                                                    </div>
                                                    {item.subItems.map((subItem) => (
                                                        <Link
                                                            key={subItem.to}
                                                            to={subItem.to}
                                                            onClick={() => setOpenMenus(prev => ({ ...prev, [item.label]: false }))}
                                                            className={cn(
                                                                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200",
                                                                location.pathname.startsWith(subItem.to)
                                                                    ? "text-foreground font-semibold bg-accent/10"
                                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                            )}
                                                        >
                                                            {subItem.icon && <subItem.icon className="h-4 w-4 opacity-70" />}
                                                            {subItem.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <Tooltip key={item.to} delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Link
                                                to={item.to!}
                                                className={cn(
                                                    "flex flex-row items-center transition-all duration-200 group rounded-xl outline-none",
                                                    collapsed
                                                        ? "justify-center w-10 h-10"
                                                        : "gap-3 px-3 py-2 w-full",
                                                    location.pathname.startsWith(item.to!)
                                                        ? "bg-accent/10"
                                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                                                        !location.pathname.startsWith(item.to!) && "text-muted-foreground group-hover:text-foreground"
                                                    )}
                                                    style={location.pathname.startsWith(item.to!) ? { color: themeColor } : {}}
                                                />
                                                {!collapsed && (
                                                    <span className={cn("text-[13px] font-medium whitespace-nowrap", location.pathname.startsWith(item.to!) ? "text-foreground" : "")}>
                                                        {item.label}
                                                    </span>
                                                )}
                                            </Link>
                                        </TooltipTrigger>
                                        {collapsed && (
                                            <TooltipContent side="right" className="text-xs font-medium">
                                                {item.label}
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className={cn(
                "mt-auto pt-2 border-t border-border/40 flex flex-col gap-0.5",
                collapsed ? "w-full items-center" : "w-full"
            )}>
                {/* Theme toggle */}
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                            className={cn(
                                "flex flex-row items-center rounded-xl transition-all duration-200 text-muted-foreground hover:bg-muted hover:text-foreground",
                                collapsed ? "justify-center w-10 h-10" : "gap-3 px-3 py-2.5 w-full"
                            )}
                        >
                            {theme === "light" ? <Moon className="h-[18px] w-[18px] flex-shrink-0" /> : <Sun className="h-[18px] w-[18px] flex-shrink-0" />}
                            {!collapsed && <span className="text-[13px] font-medium whitespace-nowrap">{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>}
                        </button>
                    </TooltipTrigger>
                    {collapsed && (
                        <TooltipContent side="right" className="text-xs font-medium">
                            {theme === "light" ? "Modo Escuro" : "Modo Claro"}
                        </TooltipContent>
                    )}
                </Tooltip>

                {/* Logout */}
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <button
                            onClick={handleLogout}
                            className={cn(
                                "flex flex-row items-center rounded-xl transition-all duration-200 text-red-400 hover:bg-red-50 hover:text-red-500",
                                collapsed ? "justify-center w-10 h-10" : "gap-3 px-3 py-2.5 w-full"
                            )}
                        >
                            <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
                            {!collapsed && <span className="text-[13px] font-medium whitespace-nowrap">Sair</span>}
                        </button>
                    </TooltipTrigger>
                    {collapsed && (
                        <TooltipContent side="right" className="text-xs font-medium">Sair</TooltipContent>
                    )}
                </Tooltip>
            </div>
        </aside>
    );
}
