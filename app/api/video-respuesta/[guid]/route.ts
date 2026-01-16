import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Servir video de respuesta desde base64 almacenado en consultanecesidad
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
      `SELECT video FROM consultanecesidad WHERE guid = $1`,
      [guid]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    const base64Data = result.rows[0].video;

    if (!base64Data) {
      return NextResponse.json(
        { error: "Este registro no tiene video" },
        { status: 404 }
      );
    }

    // Si es una URL externa (enlace de YouTube, etc.), redirigir
    if (base64Data.startsWith("http://") || base64Data.startsWith("https://")) {
      return NextResponse.redirect(base64Data);
    }

    // Formato esperado: data:video/mp4;base64,AAAA...
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);

    if (!matches) {
      return NextResponse.json(
        { error: "Formato de video invalido" },
        { status: 400 }
      );
    }

    const contentType = matches[1]; // ej: video/mp4, video/webm
    const videoBuffer = Buffer.from(matches[2], "base64");

    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": videoBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400", // Cache por 24 horas
      },
    });
  } catch (error) {
    console.error("Error al servir video de respuesta:", error);
    return NextResponse.json(
      { error: "Error al obtener video" },
      { status: 500 }
    );
  }
}
