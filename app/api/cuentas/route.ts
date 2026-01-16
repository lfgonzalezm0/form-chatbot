import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

// Verificar que el usuario sea administrador
async function verificarAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie) {
    return { autorizado: false, error: "No hay sesión activa" };
  }

  const session = JSON.parse(sessionCookie.value);

  if (session.tipousuario !== "Administrador") {
    return { autorizado: false, error: "No tiene permisos de administrador" };
  }

  return { autorizado: true, session };
}

// GET - Obtener todas las cuentas
export async function GET() {
  try {
    const verificacion = await verificarAdmin();
    if (!verificacion.autorizado) {
      return NextResponse.json(
        { error: verificacion.error },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `SELECT id, nombre, tipousuario, usuario, correo, telefono, estado
       FROM cuentassystem
       ORDER BY nombre ASC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener cuentas:", error);
    return NextResponse.json(
      { error: "Error al obtener cuentas" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva cuenta
export async function POST(request: Request) {
  try {
    const verificacion = await verificarAdmin();
    if (!verificacion.autorizado) {
      return NextResponse.json(
        { error: verificacion.error },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nombre, tipousuario, usuario, contrasena, correo, telefono, estado } = body;

    if (!usuario || !contrasena || !tipousuario) {
      return NextResponse.json(
        { error: "Usuario, contraseña y tipo de usuario son requeridos" },
        { status: 400 }
      );
    }

    // Convertir valores vacios a null para evitar problemas con restricciones UNIQUE
    const correoNormalizado = correo?.trim() || null;
    const telefonoNormalizado = telefono?.trim() || null;

    // Verificar que el usuario no exista
    const existente = await pool.query(
      `SELECT id FROM cuentassystem WHERE usuario = $1`,
      [usuario]
    );

    if (existente.rows.length > 0) {
      return NextResponse.json(
        { error: "El nombre de usuario ya existe" },
        { status: 400 }
      );
    }

    // Verificar que el correo no exista (si se proporciono uno)
    if (correoNormalizado) {
      const correoExistente = await pool.query(
        `SELECT id FROM cuentassystem WHERE correo = $1`,
        [correoNormalizado]
      );

      if (correoExistente.rows.length > 0) {
        return NextResponse.json(
          { error: "El correo electronico ya esta registrado" },
          { status: 400 }
        );
      }
    }

    // Verificar que el telefono no exista (si se proporciono uno)
    if (telefonoNormalizado) {
      const telefonoExistente = await pool.query(
        `SELECT id FROM cuentassystem WHERE telefono = $1`,
        [telefonoNormalizado]
      );

      if (telefonoExistente.rows.length > 0) {
        return NextResponse.json(
          { error: "El telefono ya esta registrado" },
          { status: 400 }
        );
      }
    }

    const result = await pool.query(
      `INSERT INTO cuentassystem (nombre, tipousuario, usuario, contrasena, correo, telefono, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nombre, tipousuario, usuario, correo, telefono, estado`,
      [nombre || null, tipousuario, usuario, contrasena, correoNormalizado, telefonoNormalizado, estado || "activo"]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error al crear cuenta:", error);
    return NextResponse.json(
      { error: "Error al crear cuenta" },
      { status: 500 }
    );
  }
}
