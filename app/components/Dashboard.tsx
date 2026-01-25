"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useMemo } from "react";

interface ModuleCard {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  modulo: string | null;
}

const modules: ModuleCard[] = [
  {
    href: "/preguntas",
    label: "Preguntas Pendientes",
    description: "Revisar y responder preguntas de usuarios que requieren atención",
    modulo: "preguntas",
    color: "turquoise",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
      </svg>
    ),
  },
  {
    href: "/necesidades",
    label: "Necesidades",
    description: "Gestionar necesidades y configurar preguntas frecuentes",
    modulo: "necesidades",
    color: "blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    ),
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    description: "Administrar usuarios y permisos del sistema",
    modulo: "usuarios",
    color: "purple",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    href: "/registros",
    label: "Registros",
    description: "Ver historial de consultas y movimientos del sistema",
    modulo: "movimientos",
    color: "orange",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
      </svg>
    ),
  },
  {
    href: "/tarifas",
    label: "Tarifas",
    description: "Configurar tarifas de transporte y servicios",
    modulo: "tarifas",
    color: "green",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
      </svg>
    ),
  },
  {
    href: "/clubes",
    label: "Clubes",
    description: "Gestionar clubes y membresías",
    modulo: "clubes",
    color: "pink",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
  },
  {
    href: "/bancos",
    label: "Bancos",
    description: "Administrar cuentas bancarias y datos financieros",
    modulo: "bancos",
    color: "indigo",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z" />
      </svg>
    ),
  },
  {
    href: "/formularios",
    label: "Formularios",
    description: "Ver y gestionar solicitudes de fondos",
    modulo: "formularios",
    color: "red",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
      </svg>
    ),
  },
];

export default function Dashboard() {
  const { usuario } = useAuth();

  const modulosFiltrados = useMemo(() => {
    if (!usuario) return [];

    if (usuario.tipousuario === "Administrador") {
      return modules;
    }

    const modulosUsuario = usuario.modulos || [];
    return modules.filter((item) => {
      if (item.modulo === null) return true;
      return modulosUsuario.includes(item.modulo);
    });
  }, [usuario]);

  if (!usuario) {
    return null;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-welcome">
        <div className="welcome-content">
          <h1>Bienvenido, {usuario.nombre || usuario.usuario}</h1>
          <p>Selecciona un módulo para comenzar a trabajar</p>
        </div>
        <div className="welcome-stats">
          <div className="stat-item">
            <span className="stat-number">{modulosFiltrados.length}</span>
            <span className="stat-label">Módulos disponibles</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {modulosFiltrados.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className={`module-card module-card-${module.color}`}
          >
            <div className="module-card-icon">
              {module.icon}
            </div>
            <div className="module-card-content">
              <h3>{module.label}</h3>
              <p>{module.description}</p>
            </div>
            <div className="module-card-arrow">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
