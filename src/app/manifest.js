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
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable any",
      },
    ],
  };
}
