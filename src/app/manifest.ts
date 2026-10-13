import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ESP32 Akıllı Lamba Kontrol",
    short_name: "ESP-Lamba",
    description: "ESP32 ve Deneyap Kart için Akıllı Lamba & Röle Kontrol Paneli",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0e17",
    theme_color: "#facc15",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
