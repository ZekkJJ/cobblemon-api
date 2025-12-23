"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Navbar as NavbarContainer,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/src/components/ui/resizable-navbar";
import { LocalUser } from "@/src/lib/types/user";
import { ModsStorageService } from "@/src/lib/mods-storage";
import { modsAPI } from "@/src/lib/api-client";

export default function Navbar() {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newModsCount, setNewModsCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setLocalUser(JSON.parse(userStr));
      } catch (error) {
        console.error("Error parsing user:", error);
      }
    }
  }, []);

  // Verificar nuevos mods
  useEffect(() => {
    const checkNewMods = async () => {
      try {
        const response = await modsAPI.getAll();
        const currentModIds = response.mods.map((m: { _id: string }) => m._id);
        const newMods = ModsStorageService.detectNewMods(currentModIds);
        
        // También detectar actualizaciones
        const currentVersions: Record<string, string> = {};
        response.mods.forEach((m: { _id: string; version: string }) => {
          currentVersions[m._id] = m.version;
        });
        const updatedMods = ModsStorageService.detectUpdatedMods(currentVersions);
        
        setNewModsCount(newMods.length + updatedMods.length);
      } catch (error) {
        // Silenciar errores - no es crítico
        console.debug("Error checking new mods:", error);
      }
    };

    checkNewMods();
    
    // Verificar cada 5 minutos
    const interval = setInterval(checkNewMods, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLocalUser(null);
    window.location.reload();
  };

  const navItems = [
    { name: "Gacha", link: "/", icon: "fa-dice" },
    { name: "Tienda", link: "/tienda", icon: "fa-store" },
    { name: "Mods", link: "/mods", icon: "fa-puzzle-piece", badge: newModsCount > 0 ? newModsCount : undefined },
    { name: "Torneos", link: "/torneos", icon: "fa-trophy" },
    { name: "Jugadores", link: "/jugadores", icon: "fa-users" },
    { name: "Pokédex", link: "/pokedex", icon: "fa-book" },
    { name: "Mapa", link: "/mapa", icon: "fa-map" },
    { name: "Galería", link: "/galeria", icon: "fa-images" },
    { name: "Servidor", link: "/servidor", icon: "fa-server" },
  ];

  const isAdmin = localUser?.discordId === "478742167557505034";
  if (isAdmin) {
    navItems.push({ name: "Admin", link: "/admin", icon: "fa-cog" });
  }

  return (
    <NavbarContainer>
      {/* Desktop Navigation */}
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} />
        <div className="flex items-center gap-2">
          {localUser ? (
            <>
              {/* User Avatar */}
              <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-full pl-1 pr-3 py-1">
                {localUser.avatar ? (
                  <img
                    src={localUser.avatar}
                    alt={localUser.discordUsername}
                    className="w-7 h-7 rounded-full border-2 border-white/30"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-red-400 flex items-center justify-center border-2 border-white/30">
                    <span className="text-xs font-bold text-white">
                      {localUser.discordUsername.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm text-white font-medium">
                  {localUser.nickname || localUser.discordUsername}
                </span>
              </div>
              <NavbarButton
                as="button"
                variant="danger"
                onClick={handleLogout}
                className="text-xs px-3 py-1.5"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span className="hidden sm:inline">Salir</span>
              </NavbarButton>
            </>
          ) : (
            <NavbarButton
              href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/discord`}
              variant="discord"
            >
              <i className="fab fa-discord"></i>
              Login
            </NavbarButton>
          )}
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <div className="flex items-center gap-2">
            {localUser && (
              <div className="flex items-center gap-2 bg-white/10 rounded-full pl-1 pr-2 py-1">
                {localUser.avatar ? (
                  <img
                    src={localUser.avatar}
                    alt={localUser.discordUsername}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-red-400 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {localUser.discordUsername.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )}
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </div>
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {navItems.map((item, idx) => (
            <a
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                relative flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all
                ${pathname === item.link || (item.link !== "/" && pathname.startsWith(item.link))
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <div className="relative w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <i className={`fas ${item.icon}`}></i>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-poke-green text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="font-medium">{item.name}</span>
              {item.badge && item.badge > 0 && (
                <span className="ml-auto text-xs bg-poke-green/20 text-poke-green px-2 py-0.5 rounded-full">
                  {item.badge} nuevo{item.badge > 1 ? 's' : ''}
                </span>
              )}
            </a>
          ))}
          
          <div className="flex w-full flex-col gap-3 pt-4 border-t border-white/20">
            {localUser ? (
              <NavbarButton
                as="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                variant="danger"
                className="w-full justify-center"
              >
                <i className="fas fa-sign-out-alt"></i>
                Cerrar Sesión
              </NavbarButton>
            ) : (
              <NavbarButton
                href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/discord`}
                onClick={() => setIsMobileMenuOpen(false)}
                variant="discord"
                className="w-full justify-center"
              >
                <i className="fab fa-discord"></i>
                Iniciar con Discord
              </NavbarButton>
            )}
          </div>
        </MobileNavMenu>
      </MobileNav>
    </NavbarContainer>
  );
}
