import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "No hay sesión activa" },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);

    return NextResponse.json({
      authenticated: true,
      usuario: session,
    });
  } catch (error) {
    console.error("Error al verificar sesión:", error);
    return NextResponse.json(
      { error: "Error al verificar sesión" },
      { status: 500 }
    );
  }
}
