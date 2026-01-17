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

// GET - Obtener una cuenta específica
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verificacion = await verificarAdmin();
    if (!verificacion.autorizado) {
      return NextResponse.json(
        { error: verificacion.error },
        { status: 403 }
      );
    }

    const { id } = await params;

    const result = await pool.query(
      `SELECT id, nombre, tipousuario, usuario, correo, telefono, estado, modulos
       FROM cuentassystem
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Cuenta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener cuenta:", error);
    return NextResponse.json(
      { error: "Error al obtener cuenta" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una cuenta
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verificacion = await verificarAdmin();
    if (!verificacion.autorizado) {
      return NextResponse.json(
        { error: verificacion.error },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { nombre, tipousuario, usuario, contrasena, correo, telefono, estado, modulos } = body;

    // Normalizar valores vacios a null
    const correoNormalizado = correo?.trim() || null;
    const telefonoNormalizado = telefono?.trim() || null;

    // Verificar que la cuenta exista
    const existente = await pool.query(
      `SELECT id FROM cuentassystem WHERE id = $1`,
      [id]
    );

    if (existente.rows.length === 0) {
      return NextResponse.json(
        { error: "Cuenta no encontrada" },
        { status: 404 }
      );
    }

    // Si se está cambiando el usuario, verificar que no exista otro con ese nombre
    if (usuario) {
      const duplicado = await pool.query(
        `SELECT id FROM cuentassystem WHERE usuario = $1 AND id != $2`,
        [usuario, id]
      );

      if (duplicado.rows.length > 0) {
        return NextResponse.json(
          { error: "El nombre de usuario ya existe" },
          { status: 400 }
        );
      }
    }

    // Si se está cambiando el correo, verificar que no exista otro con ese correo
    if (correoNormalizado) {
      const correoDuplicado = await pool.query(
        `SELECT id FROM cuentassystem WHERE correo = $1 AND id != $2`,
        [correoNormalizado, id]
      );

      if (correoDuplicado.rows.length > 0) {
        return NextResponse.json(
          { error: "El correo electronico ya esta registrado" },
          { status: 400 }
        );
      }
    }

    // Si se está cambiando el telefono, verificar que no exista otro con ese telefono
    if (telefonoNormalizado) {
      const telefonoDuplicado = await pool.query(
        `SELECT id FROM cuentassystem WHERE telefono = $1 AND id != $2`,
        [telefonoNormalizado, id]
      );

      if (telefonoDuplicado.rows.length > 0) {
        return NextResponse.json(
          { error: "El telefono ya esta registrado" },
          { status: 400 }
        );
      }
    }

    // Construir query de actualización dinámicamente
    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let paramCount = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramCount++}`);
      values.push(nombre || null);
    }
    if (tipousuario !== undefined) {
      updates.push(`tipousuario = $${paramCount++}`);
      values.push(tipousuario);
    }
    if (usuario !== undefined) {
      updates.push(`usuario = $${paramCount++}`);
      values.push(usuario);
    }
    if (contrasena !== undefined && contrasena !== "") {
      updates.push(`contrasena = $${paramCount++}`);
      values.push(contrasena);
    }
    if (correo !== undefined) {
      updates.push(`correo = $${paramCount++}`);
      values.push(correoNormalizado);
    }
    if (telefono !== undefined) {
      updates.push(`telefono = $${paramCount++}`);
      values.push(telefonoNormalizado);
    }
    if (estado !== undefined) {
      updates.push(`estado = $${paramCount++}`);
      values.push(estado);
    }
    if (modulos !== undefined) {
      updates.push(`modulos = $${paramCount++}`);
      values.push(JSON.stringify(modulos));
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    values.push(parseInt(id));

    const result = await pool.query(
      `UPDATE cuentassystem
       SET ${updates.join(", ")}
       WHERE id = $${paramCount}
       RETURNING id, nombre, tipousuario, usuario, correo, telefono, estado, modulos`,
      values
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar cuenta:", error);
    return NextResponse.json(
      { error: "Error al actualizar cuenta" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una cuenta
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verificacion = await verificarAdmin();
    if (!verificacion.autorizado) {
      return NextResponse.json(
        { error: verificacion.error },
        { status: 403 }
      );
    }

    const { id } = await params;

    // No permitir eliminar la propia cuenta
    if (verificacion.session && verificacion.session.id === parseInt(id)) {
      return NextResponse.json(
        { error: "No puede eliminar su propia cuenta" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `DELETE FROM cuentassystem WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Cuenta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    return NextResponse.json(
      { error: "Error al eliminar cuenta" },
      { status: 500 }
    );
  }
}
