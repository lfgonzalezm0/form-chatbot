import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        guid,
        telefonoCliente,
        telefonoEmpresa,
        pregunta,
        contexto,
        respuesta,
        creado
      FROM consultaNecesidad
      ORDER BY creado DESC
      LIMIT 1
    `);

    return NextResponse.json(result.rows[0] ?? null);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error consultando consultaNecesidad" },
      { status: 500 }
    );
  }
}