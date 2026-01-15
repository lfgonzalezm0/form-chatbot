import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const guid = searchParams.get("guid");

  if (!guid) {
    return NextResponse.json(
      { error: "GUID requerido" },
      { status: 400 }
    );
  }

  console.log("DATABASE_URL:", process.env.DATABASE_URL);

  const result = await pool.query(
    `
    SELECT pregunta, contexto, enlace
    FROM consultanecesidad
    WHERE guid = $1
    LIMIT 1
    `,
    [guid]
  );

  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: "Consulta no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(result.rows[0]);
}