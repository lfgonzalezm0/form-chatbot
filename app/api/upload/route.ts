import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { cookies } from "next/headers";

// Configurar Cloudinary usando CLOUDINARY_URL
// La variable CLOUDINARY_URL configura automáticamente cloud_name, api_key y api_secret

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

    // Validar tamaño (10MB para imagenes, 100MB para videos - Cloudinary permite más)
    const maxSize = esImagen ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `El archivo no debe superar ${esImagen ? "10MB" : "100MB"}` },
        { status: 400 }
      );
    }

    // Convertir archivo a base64 para subirlo a Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    // Generar nombre único
    const timestamp = Date.now();
    const publicId = `${tipo || (esImagen ? "imagen" : "video")}_${timestamp}`;

    // Subir a Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      resource_type: esVideo ? "video" : "image",
      folder: "form-chatbot",
    });

    return NextResponse.json({
      success: true,
      filename: result.public_id,
      url: result.secure_url,
      tipo: esImagen ? "imagen" : "video",
    });
  } catch (error) {
    console.error("Error al subir archivo a Cloudinary:", error);
    return NextResponse.json(
      { error: "Error al subir archivo" },
      { status: 500 }
    );
  }
}
