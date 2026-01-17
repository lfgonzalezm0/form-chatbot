import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// PUT: Actualizar referencia para todas las tarifas con un destino específico
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    const esAdmin = session.tipousuario === "Administrador";

    // Verificar acceso al módulo de tarifas
    if (!esAdmin) {
      const modulos = session.modulos || [];
      if (!modulos.includes("tarifas")) {
        return NextResponse.json(
          { error: "No tiene acceso al módulo de tarifas" },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { destino, referencia } = body;

    if (!destino) {
      return NextResponse.json(
        { error: "El destino es requerido" },
        { status: 400 }
      );
    }

    let query: string;
    const params: (string | null)[] = [referencia || null, destino];

    if (esAdmin) {
      // Admin puede actualizar todas las tarifas con ese destino
      query = `
        UPDATE tarifas_transporte
        SET referencia = $1
        WHERE destino = $2
      `;
    } else {
      // Usuario normal solo puede actualizar tarifas de su cuenta
      query = `
        UPDATE tarifas_transporte
        SET referencia = $1
        WHERE destino = $2 AND telefonocaso = $3
      `;
      params.push(session.telefono);
    }

    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      actualizados: result.rowCount,
      message: `Referencia actualizada en ${result.rowCount} tarifas`
    });
  } catch (error) {
    console.error("Error al actualizar referencia:", error);
    return NextResponse.json(
      { error: "Error al actualizar referencia" },
      { status: 500 }
    );
  }
}
