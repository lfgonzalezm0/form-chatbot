import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// GET - Obtener todos los módulos
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

    const result = await pool.query(
      `SELECT id, nombre, categoria, creado, modificado
       FROM modulossystem
       ORDER BY categoria ASC, nombre ASC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener módulos:", error);
    return NextResponse.json(
      { error: "Error al obtener módulos" },
      { status: 500 }
    );
  }
}
