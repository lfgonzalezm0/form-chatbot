import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Servir imagen de respuesta desde base64 almacenado en consultanecesidad
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guid: string }> }
) {
  const { guid } = await params;

  if (!guid) {
    return NextResponse.json(
      { error: "GUID requerido" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `SELECT imagen FROM consultanecesidad WHERE guid = $1`,
      [guid]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    const base64Data = result.rows[0].imagen;

    if (!base64Data) {
      return NextResponse.json(
        { error: "Este registro no tiene imagen" },
        { status: 404 }
      );
    }

    // Formato esperado: data:image/png;base64,iVBORw0KGgo...
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);

    if (!matches) {
      return NextResponse.json(
        { error: "Formato de imagen inválido" },
        { status: 400 }
      );
    }

    const contentType = matches[1]; // ej: image/png, image/jpeg
    const imageBuffer = Buffer.from(matches[2], "base64");

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": imageBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400", // Cache por 24 horas
      },
    });
  } catch (error) {
    console.error("Error al servir imagen de respuesta:", error);
    return NextResponse.json(
      { error: "Error al obtener imagen" },
      { status: 500 }
    );
  }
}
