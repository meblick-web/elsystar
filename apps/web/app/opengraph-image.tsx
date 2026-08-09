import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ELSYSTAR — интеллектуальные транспортные системы";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 82px",
        background: "linear-gradient(135deg, #f6faf8 0%, #e8f1ed 55%, #d9e8e1 100%)",
        color: "#10231d",
        fontFamily: "Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: 0.2, display: "flex" }}>
        <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
          <path d="M-80 470 C180 310 300 520 520 360 S850 190 1280 360" fill="none" stroke="#2f6d59" strokeWidth="18" />
          <path d="M-80 420 C170 270 315 470 520 320 S850 145 1280 315" fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="18 18" />
          <path d="M710 -60 L710 690" stroke="#2f6d59" strokeWidth="12" />
          <path d="M670 -60 L670 690" stroke="#ffffff" strokeWidth="2" strokeDasharray="15 15" />
          <circle cx="710" cy="330" r="58" fill="none" stroke="#2f6d59" strokeWidth="4" />
        </svg>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 800, letterSpacing: 3 }}>
        <span>ELSY</span><span style={{ color: "#2f7d62" }}>STAR</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 900 }}>
        <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.05 }}>Интеллектуальные транспортные системы</div>
        <div style={{ fontSize: 29, color: "#426158", lineHeight: 1.35 }}>Дорожные контроллеры · АСУДТ «Мегаполис» · инженерные решения</div>
      </div>
      <div style={{ fontSize: 22, color: "#59736b" }}>elsystar.com</div>
    </div>,
    size,
  );
}
