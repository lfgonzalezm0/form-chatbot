import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// GET: Obtener destinos únicos con su referencia
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    const esAdmin = session.tipousuario === "Administrador";

    // Verificar acceso al módulo de tarifas
    if (!esAdmin) {
      const modulos = session.modulos || [];
      if (!modulos.includes("tarifas")) {
        return NextResponse.json(
          { error: "No tiene acceso al módulo de tarifas" },
          { status: 403 }
        );
      }
    }

    let query: string;
    const params: string[] = [];

    if (esAdmin) {
      // Admin ve todos los destinos únicos
      query = `
        SELECT
          destino,
          ciudad_destino,
          MAX(referencia) as referencia,
          COUNT(*) as cantidad
        FROM tarifas_transporte
        GROUP BY destino, ciudad_destino
        ORDER BY destino ASC
      `;
    } else {
      // Usuario normal solo ve destinos de su cuenta
      query = `
        SELECT
          destino,
          ciudad_destino,
          MAX(referencia) as referencia,
          COUNT(*) as cantidad
        FROM tarifas_transporte
        WHERE telefonocaso = $1
        GROUP BY destino, ciudad_destino
        ORDER BY destino ASC
      `;
      params.push(session.telefono);
    }

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener destinos:", error);
    return NextResponse.json(
      { error: "Error al obtener destinos" },
      { status: 500 }
    );
  }
}
