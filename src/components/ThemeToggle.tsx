import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark">(
        (localStorage.getItem("theme") as "light" | "dark") || "light"
    );

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
            root.classList.remove("light");
        } else {
            root.classList.add("light");
            root.classList.remove("dark");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-[13px] font-medium w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 outline-none focus:outline-none focus:ring-0"
            title={theme === "light" ? "Modo Escuro" : "Modo Claro"}
        >
            {theme === "light" ? (
                <>
                    <Moon className="h-5 w-5 shrink-0 opacity-70" />
                    <span className="truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">Modo Escuro</span>
                </>
            ) : (
                <>
                    <Sun className="h-5 w-5 shrink-0 text-accent opacity-70" />
                    <span className="truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">Modo Claro</span>
                </>
            )}
        </button>
    );
}
