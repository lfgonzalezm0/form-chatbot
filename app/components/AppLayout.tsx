"use client";

import { Suspense } from "react";
import Sidebar from "./Sidebar";

interface Props {
  children: React.ReactNode;
}

export default function AppLayout({ children }: Props) {
  return (
    <div className="app-container">
      <Suspense fallback={<div className="sidebar-loading">Cargando...</div>}>
        <Sidebar />
      </Suspense>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
