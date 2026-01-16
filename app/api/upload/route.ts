import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { cookies } from "next/headers";

// URL base de la aplicacion
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://form-chatbot-production.up.railway.app";

// Directorio de uploads
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticacion
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener el archivo del FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const tipo = formData.get("tipo") as string | null; // "imagen" o "video"

    if (!file) {
      return NextResponse.json(
        { error: "No se proporciono archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const esImagen = file.type.startsWith("image/");
    const esVideo = file.type.startsWith("video/");

    if (!esImagen && !esVideo) {
      return NextResponse.json(
        { error: "Solo se permiten imagenes y videos" },
        { status: 400 }
      );
    }

    // Validar tamaño (5MB para imagenes, 50MB para videos)
    const maxSize = esImagen ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `El archivo no debe superar ${esImagen ? "5MB" : "50MB"}` },
        { status: 400 }
      );
    }

    // Crear directorio si no existe
    if (!existsSync(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true });
    }

    // Generar nombre unico para el archivo
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || (esImagen ? "jpg" : "mp4");
    const nombreArchivo = `${tipo || (esImagen ? "imagen" : "video")}_${timestamp}.${extension}`;
    const rutaArchivo = path.join(UPLOADS_DIR, nombreArchivo);

    // Guardar archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(rutaArchivo, buffer);

    // Generar URL publica
    const url = `${APP_URL}/api/uploads/${nombreArchivo}`;

    return NextResponse.json({
      success: true,
      filename: nombreArchivo,
      url,
      tipo: esImagen ? "imagen" : "video",
    });
  } catch (error) {
    console.error("Error al subir archivo:", error);
    return NextResponse.json(
      { error: "Error al subir archivo" },
      { status: 500 }
    );
  }
}
