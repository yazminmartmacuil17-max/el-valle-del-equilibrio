import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/components/game/Game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Valle Equilibrio — RPG pixel art cozy" },
      { name: "description", content: "Guía a una comunidad recién asentada durante 100 días. Cada acción inclina el valle hacia la sostenibilidad o la catástrofe." },
      { property: "og:title", content: "Valle Equilibrio — RPG pixel art cozy" },
      { property: "og:description", content: "Tala, pesca, construye y recicla: tus decisiones transforman el valle en 100 días." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <Game />;
}
