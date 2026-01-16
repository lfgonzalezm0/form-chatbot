import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// URL base de la aplicación
const APP_URL = "https://form-chatbot-production.up.railway.app";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { enlace, accion, respuesta, guid, imagen, video } = body;

    if (!enlace || !accion || !guid) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Validar que si la accion es responder, tenga respuesta
    if (accion === "responder" && !respuesta) {
      return NextResponse.json(
        { error: "Se requiere una respuesta" },
        { status: 400 }
      );
    }

    // Verificar si la conversacion ya esta cerrada
    const checkResult = await pool.query(
      `SELECT estado FROM consultanecesidad WHERE guid = $1`,
      [guid]
    );

    if (checkResult.rows.length > 0 && checkResult.rows[0].estado === "cerrado") {
      return NextResponse.json(
        { error: "Esta conversacion ya fue respondida" },
        { status: 409 }
      );
    }

    // Generar urlimagen si hay imagen
    const urlimagen = imagen ? `${APP_URL}/api/imagen-respuesta/${guid}` : null;

    // Preparar payload para n8n
    const n8nPayload = {
      guid,
      accion,
      respuesta: accion === "responder" ? respuesta : null,
      urlimagen,
      video: accion === "responder" ? video : null,
    };

    // Hacer POST al webhook de n8n
    let webhookSuccess = false;
    let webhookError = "";

    try {
      const response = await fetch(enlace, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(n8nPayload),
      });

      if (response.ok) {
        webhookSuccess = true;
      } else {
        webhookError = `${response.status} ${response.statusText}`;
        console.error("Error del webhook:", webhookError);

        // Si es 409 Conflict, el webhook ya fue consumido pero podemos continuar
        // para registrar la accion en la base de datos
        if (response.status === 409) {
          console.log("Webhook ya consumido (409), continuando con actualizacion de BD");
        }
      }
    } catch (fetchError) {
      console.error("Error de conexion al webhook:", fetchError);
      webhookError = "Error de conexion";
    }

    // Actualizar el estado y la respuesta en la base de datos
    // Lo hacemos incluso si el webhook fallo con 409, para mantener consistencia
    await pool.query(
      `
      UPDATE consultanecesidad
      SET estado = 'cerrado',
          accionadmin = $2,
          respuesta = $3,
          imagen = $4,
          video = $5,
          urlimagen = $6
      WHERE guid = $1
      `,
      [
        guid,
        accion,
        accion === "responder" ? respuesta : null,
        accion === "responder" ? imagen : null,
        accion === "responder" ? video : null,
        urlimagen
      ]
    );

    console.log("Estado actualizado para GUID:", guid, "- Accion:", accion);

    // Si el webhook fallo y no fue 409, advertimos pero no fallamos
    if (!webhookSuccess && !webhookError.includes("409")) {
      console.warn("Webhook fallo pero la BD fue actualizada:", webhookError);
    }

    return NextResponse.json({
      success: true,
      webhookSuccess,
      message: webhookSuccess
        ? "Respuesta enviada correctamente"
        : "Respuesta registrada (el webhook ya habia sido procesado)"
    });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
