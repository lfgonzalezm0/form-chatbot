import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Verificar acceso al módulo de tarifas
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

  // Verificar si el usuario tiene el módulo de tarifas
  if (session.modulos && Array.isArray(session.modulos)) {
    if (session.modulos.includes("tarifas")) {
      return { autorizado: true, session };
    }
  }

  return { autorizado: false, error: "No tiene acceso al módulo de tarifas" };
}

// GET - Obtener todas las tarifas
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
    const origen = searchParams.get("origen");
    const destino = searchParams.get("destino");
    const ciudad = searchParams.get("ciudad");

    let query = `SELECT id, origen, destino, ciudad_destino, precio FROM tarifas_transporte`;
    const conditions: string[] = [];
    const params: string[] = [];
    let paramCount = 1;

    if (origen) {
      conditions.push(`origen ILIKE $${paramCount++}`);
      params.push(`%${origen}%`);
    }
    if (destino) {
      conditions.push(`destino ILIKE $${paramCount++}`);
      params.push(`%${destino}%`);
    }
    if (ciudad) {
      conditions.push(`ciudad_destino ILIKE $${paramCount++}`);
      params.push(`%${ciudad}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY origen ASC, ciudad_destino ASC, precio ASC`;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener tarifas:", error);
    return NextResponse.json(
      { error: "Error al obtener tarifas" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva tarifa
export async function POST(req: NextRequest) {
  try {
    const verificacion = await verificarAcceso();
    if (!verificacion.autorizado) {
      return NextResponse.json(
        { error: verificacion.error },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { origen, destino, ciudad_destino, precio } = body;

    if (!origen || !destino || !ciudad_destino || precio === undefined) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO tarifas_transporte (origen, destino, ciudad_destino, precio)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [origen, destino, ciudad_destino, precio]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error al crear tarifa:", error);
    return NextResponse.json(
      { error: "Error al crear tarifa" },
      { status: 500 }
    );
  }
}
