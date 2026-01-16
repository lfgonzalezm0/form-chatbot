import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usuario, contrasena } = body;

    if (!usuario || !contrasena) {
      return NextResponse.json(
        { error: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Buscar usuario en la base de datos
    const result = await pool.query(
      `SELECT id, nombre, tipousuario, usuario, correo, telefono, estado
       FROM cuentassystem
       WHERE usuario = $1 AND contrasena = $2`,
      [usuario, contrasena]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const cuenta = result.rows[0];

    // Verificar si la cuenta está bloqueada
    if (cuenta.estado === "bloqueado") {
      return NextResponse.json(
        { error: "Su cuenta está bloqueada. Contacte al administrador." },
        { status: 403 }
      );
    }

    // Crear sesión en cookie
    const sessionData = {
      id: cuenta.id,
      nombre: cuenta.nombre,
      tipousuario: cuenta.tipousuario,
      usuario: cuenta.usuario,
      correo: cuenta.correo,
      telefono: cuenta.telefono,
    };

    const cookieStore = await cookies();
    cookieStore.set("session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 horas
      path: "/",
    });

    return NextResponse.json({
      success: true,
      usuario: sessionData,
    });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: "Error al iniciar sesión" },
      { status: 500 }
    );
  }
}
