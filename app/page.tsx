import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main
      style={{
        backgroundColor: "#F5F0E8",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        padding: "1rem",
      }}
    >
      {/* LOGO */}
      <Image
        src="/images/logo_oscuro.png"
        alt="Caleo"
        width={400}
        height={300}
        priority
        style={{
          width: "clamp(200px, 50vw, 400px)",
          height: "auto",
        }}
      />

      {/* ESLOGAN */}
      <p
        style={{
          color: "#8C7B6B",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontSize: "clamp(1rem, 3vw, 1.4rem)",
          textAlign: "center",
          maxWidth: "500px",
          padding: "0 1rem",
        }}
      >
        "No se trata de gastar menos, se trata de gastar bien"
      </p>

      {/* BOTONES */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "1.5rem",
          marginTop: "1rem",
          justifyContent: "center",
        }}
      >
        <Link href="/login">
          <button className="btn-primary">Iniciar sesión</button>
        </Link>
        <Link href="/register">
          <button className="btn-secondary">Registrarse</button>
        </Link>
      </div>

    </main>
  );
}