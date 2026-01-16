"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavMenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const menuItems: NavMenuItem[] = [
  {
    href: "/",
    label: "Conversaciones",
    description: "Gestionar conversaciones del chatbot",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
      </svg>
    ),
  },
  {
    href: "/necesidades",
    label: "Necesidades",
    description: "Gestionar necesidades y preguntas",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    ),
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    description: "Gestionar usuarios del chatbot",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    href: "/registros",
    label: "Registros",
    description: "Ver historial de consultas",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
      </svg>
    ),
  },
];

export default function NavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const currentPage = menuItems.find((item) => item.href === pathname) || menuItems[0];

  return (
    <div className="nav-menu-container" ref={menuRef}>
      <button
        className={`nav-menu-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="nav-menu-trigger-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </div>
        <span className="nav-menu-trigger-label">Menu</span>
        <svg className="nav-menu-chevron" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      </button>

      <div className={`nav-menu-dropdown ${isOpen ? "open" : ""}`}>
        <div className="nav-menu-header">
          <span>Navegar a</span>
        </div>
        <div className="nav-menu-items">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-menu-item ${pathname === item.href ? "active" : ""}`}
              onClick={() => setIsOpen(false)}
            >
              <div className="nav-menu-item-icon">{item.icon}</div>
              <div className="nav-menu-item-content">
                <span className="nav-menu-item-label">{item.label}</span>
                <span className="nav-menu-item-description">{item.description}</span>
              </div>
              {pathname === item.href && (
                <div className="nav-menu-item-check">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
