"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface Usuario {
  id: number;
  nombre: string;
  tipousuario: string;
  usuario: string;
  correo: string | null;
  telefono: string | null;
}

interface AuthContextType {
  usuario: Usuario | null;
  cargando: boolean;
  cerrarSesion: () => Promise<void>;
  recargarUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Rutas públicas que no requieren autenticación
const RUTAS_PUBLICAS = ["/login"];

// Rutas de administrador
const RUTAS_ADMIN = ["/admin", "/admin/cuentas"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const verificarSesion = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUsuario(data.usuario);
        return data.usuario;
      } else {
        setUsuario(null);
        return null;
      }
    } catch {
      setUsuario(null);
      return null;
    } finally {
      setCargando(false);
    }
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignorar errores de logout
    } finally {
      setUsuario(null);
      router.push("/login");
    }
  }, [router]);

  const recargarUsuario = useCallback(async () => {
    await verificarSesion();
  }, [verificarSesion]);

  useEffect(() => {
    const verificarYRedirigir = async () => {
      const usuarioActual = await verificarSesion();

      // Si está en ruta pública, no hacer nada
      if (RUTAS_PUBLICAS.includes(pathname)) {
        // Si ya está autenticado y está en login, redirigir
        if (usuarioActual) {
          if (usuarioActual.tipousuario === "Administrador") {
            router.push("/admin/cuentas");
          } else {
            router.push("/");
          }
        }
        return;
      }

      // Si no está autenticado, redirigir a login
      if (!usuarioActual) {
        router.push("/login");
        return;
      }

      // Verificar acceso a rutas de admin
      const esRutaAdmin = RUTAS_ADMIN.some((ruta) => pathname.startsWith(ruta));
      if (esRutaAdmin && usuarioActual.tipousuario !== "Administrador") {
        router.push("/");
        return;
      }
    };

    verificarYRedirigir();
  }, [pathname, router, verificarSesion]);

  return (
    <AuthContext.Provider value={{ usuario, cargando, cerrarSesion, recargarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
