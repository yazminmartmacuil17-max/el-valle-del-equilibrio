<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Game logic lives in `src/game/` as plain TS (rules.ts is pure and unit-tested; engine.ts owns the canvas loop, input and autosave); React components in `src/components/game/` only render HUD from the engine snapshot. Why: keeps rules testable and the render loop out of React.
- Daily simulation must be deterministic per seed + day and depend only on whole days crossed, never on real-time speed. Why: speed buttons must not change outcomes.
- Visuals are procedural pixel art: sprites as string maps in sprites.ts, colors lerped between two palettes by the meter in palette.ts. Why: gradual, meter-driven transitions without image assets.
- Progress persists in localStorage (single-player, no accounts). Why: autosave without a backend.
