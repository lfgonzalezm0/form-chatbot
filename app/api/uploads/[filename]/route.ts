import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Directorio de uploads
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Mapeo de extensiones a content-types
const CONTENT_TYPES: Record<string, string> = {
  // Imagenes
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  // Videos
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!filename) {
    return NextResponse.json(
      { error: "Nombre de archivo requerido" },
      { status: 400 }
    );
  }

  // Validar que el nombre del archivo no contenga rutas maliciosas
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json(
      { error: "Nombre de archivo invalido" },
      { status: 400 }
    );
  }

  const rutaArchivo = path.join(UPLOADS_DIR, filename);

  // Verificar que el archivo exista
  if (!existsSync(rutaArchivo)) {
    return NextResponse.json(
      { error: "Archivo no encontrado" },
      { status: 404 }
    );
  }

  try {
    const fileBuffer = await readFile(rutaArchivo);
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    const contentType = CONTENT_TYPES[extension] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400", // Cache por 24 horas
      },
    });
  } catch (error) {
    console.error("Error al servir archivo:", error);
    return NextResponse.json(
      { error: "Error al obtener archivo" },
      { status: 500 }
    );
  }
}
