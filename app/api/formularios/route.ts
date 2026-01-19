import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Verificar acceso al módulo de formularios
async function verificarAcceso() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie) {
    return { autorizado: false, error: "No hay sesión activa" };
  }

  const session = JSON.parse(sessionCookie.value);

  // Los administradores siempre tienen acceso
  if (session.tipousuario === "Administrador") {
    return { autorizado: true, session };
  }

  // Verificar si el usuario tiene el módulo de formularios
  if (session.modulos && Array.isArray(session.modulos)) {
    if (session.modulos.includes("formularios")) {
      return { autorizado: true, session };
    }
  }

  return { autorizado: false, error: "No tiene acceso al módulo de formularios" };
}

// GET - Obtener todos los formularios
export async function GET(req: NextRequest) {
  try {
    const verificacion = await verificarAcceso();
    if (!verificacion.autorizado) {
      return NextResponse.json(
        { error: verificacion.error },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const busqueda = searchParams.get("busqueda");
    const tiposolicitud = searchParams.get("tiposolicitud");

    let query = `
      SELECT
        id, telefono, nombre, cuenta, tiposolicitud,
        cantidadfondos, cuentatransferencia, datosconversion,
        guid, club, enlace, urlimagen, bancodeposito
      FROM formdv0
    `;
    const conditions: string[] = [];
    const params: string[] = [];
    let paramCount = 1;

    if (busqueda) {
      conditions.push(`(
        telefono ILIKE $${paramCount} OR
        nombre ILIKE $${paramCount} OR
        cuenta ILIKE $${paramCount} OR
        club ILIKE $${paramCount}
      )`);
      params.push(`%${busqueda}%`);
      paramCount++;
    }

    if (tiposolicitud) {
      conditions.push(`tiposolicitud = $${paramCount++}`);
      params.push(tiposolicitud);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY id DESC`;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener formularios:", error);
    return NextResponse.json(
      { error: "Error al obtener formularios" },
      { status: 500 }
    );
  }
}
