"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Cuando cambia la ruta, iniciar transición
    setIsTransitioning(true);

    // Después de la animación de salida, actualizar contenido
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <div className={`page-transition ${isTransitioning ? "transitioning" : "visible"}`}>
      {displayChildren}
    </div>
  );
}
