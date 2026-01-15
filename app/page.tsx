export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: { guid?: string };
}) {
  console.log("searchParams:", searchParams);

  const guid = searchParams?.guid;

  if (!guid) {
    return (
      <div style={{ padding: 20 }}>
        ❌ Enlace inválido o incompleto
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      ✅ GUID recibido correctamente:
      <pre>{guid}</pre>
    </div>
  );
}