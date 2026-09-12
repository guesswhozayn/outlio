export default function manifest() {
  return {
    name: "Outlio - AI Job Outreach Assistant",
    short_name: "Outlio",
    description: "AI-powered job application outreach and resume tailoring assistant.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0c",
    theme_color: "#111115",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable any",
      },
    ],
  };
}
