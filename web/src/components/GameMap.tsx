import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import maplibregl, { type Map as MlMap, type LngLatBoundsLike, type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";
import { Crosshair, Minus, Plus } from "lucide-react";
import { beaches, beachById } from "@shared/coast";
import { isHotspot } from "@shared/game";
import type { BeachStanding, Report } from "@shared/types";
import { useI18n } from "@/lib/i18n";
import { useTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export type MapMode = "map" | "satellite";
export interface GameMapHandle {
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  fitBeach: (beachId: string) => void;
  showBeach: (beachId: string) => void;
  center: () => [number, number] | null;
}

const BALI: LngLatBoundsLike = [[114.42, -8.86], [115.72, -8.05]];
const MAX_BOUNDS: LngLatBoundsLike = [[113.9, -9.3], [116.3, -7.6]];
/** Base map colours per theme (match --sea, --canvas and --border in styles.css). `ring` outlines dots, `sel` the selected one. */
const MAP_COLORS: Record<Theme, { sea: string; land: string; edge: string; ring: string; sel: string }> = {
  light: { sea: "#cfe9ea", land: "#fbf6ec", edge: "#eadfc8", ring: "#ffffff", sel: "#12343b" },
  dark: { sea: "#0d3a45", land: "#17333a", edge: "#2d4d54", ring: "#0a1c21", sel: "#ffffff" },
};
const CORAL = "#ff6b4a";
const GOOD = "#22c55e";
const AMBER = "#f59e0b";
const GREY = "#b9c7c9";

export const healthColor = (s?: BeachStanding) => (!s || s.rank == null ? GREY : s.health >= 80 ? GOOD : s.health >= 50 ? AMBER : CORAL);
const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const canLocate = () => typeof window !== "undefined" && window.isSecureContext && "geolocation" in navigator;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function beachBounds(id: string): LngLatBoundsLike | null {
  const b = beachById(id);
  if (!b) return null;
  let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
  for (const line of b.coast) for (const [x, y] of line) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (x0 > x1) return [[b.center[0] - 0.01, b.center[1] - 0.01], [b.center[0] + 0.01, b.center[1] + 0.01]];
  return [[x0, y0], [x1, y1]];
}

export function GameMap({ reports, league, selectedId, onSelectReport, pick, onPick, pickLabel, ref }: {
  reports: Report[];
  league: BeachStanding[];
  selectedId?: string | null;
  onSelectReport: (id: string) => void;
  /** pick mode: a pin is shown here and taps call onPick */
  pick: { lng: number; lat: number } | null;
  onPick: (lng: number, lat: number) => void;
  pickLabel?: string;
  ref?: Ref<GameMapHandle>;
}) {
  const { t, lang } = useI18n();
  const tRef = useRef(t); tRef.current = t;
  const { theme } = useTheme();
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<MapMode>("map");
  const [locating, setLocating] = useState(false);
  const leagueRef = useRef(league); leagueRef.current = league;
  const reportsRef = useRef(reports); reportsRef.current = reports;
  const pickRef = useRef(pick); pickRef.current = pick;
  const onPickRef = useRef(onPick); onPickRef.current = onPick;
  const onSelectRef = useRef(onSelectReport); onSelectRef.current = onSelectReport;
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const pinRef = useRef<maplibregl.Marker | null>(null);
  const meRef = useRef<maplibregl.Marker | null>(null);

  const coastData = useMemo<GeoJSON.FeatureCollection>(() => {
    const by = new Map(league.map((s) => [s.beachId, s]));
    return {
      type: "FeatureCollection",
      features: beaches.map((b) => {
        const s = by.get(b.id);
        return { type: "Feature", geometry: { type: "MultiLineString", coordinates: b.coast }, properties: { id: b.id, color: healthColor(s), ranked: s?.rank != null } };
      }),
    };
  }, [league]);

  const reportData = useMemo<GeoJSON.FeatureCollection>(() => {
    const now = new Date();
    return {
      type: "FeatureCollection",
      features: reports.map((r) => ({
        type: "Feature", geometry: { type: "Point", coordinates: [r.lng, r.lat] },
        properties: { id: r.id, kind: r.status === "cleaned" ? "clean" : isHotspot(r, now) ? "hot" : "open", sel: r.id === selectedId },
      })),
    };
  }, [reports, selectedId]);

  const showBeach = (id: string, at?: maplibregl.LngLatLike) => {
    const map = mapRef.current;
    const b = beachById(id);
    if (!map || !b) return;
    const s = leagueRef.current.find((x) => x.beachId === id);
    const open = s?.open ?? reportsRef.current.filter((r) => r.beachId === id && r.status === "open").length;
    const health = s?.rank != null ? `${s.health}` : "–";
    const color = healthColor(s);
    const t = tRef.current;
    popupRef.current?.remove();
    popupRef.current = new maplibregl.Popup({ closeButton: true, offset: 10, maxWidth: "240px", className: "pantai-popup" })
      .setLngLat(at ?? b.center)
      .setHTML(`<div class="pp-name">${esc(b.name)}</div><div class="pp-kab">${esc(b.kab)}</div>
        <div class="pp-row"><span class="pp-dot" style="background:${color}"></span><b>${health}</b><span>${esc(t("map.health"))}</span></div>
        <div class="pp-row"><b>${open}</b><span>${esc(t("map.openReports", { count: open }))}</span></div>
        <div class="pp-rank">${esc(s?.rank != null ? t("map.rank", { rank: s.rank }) : t("map.noData"))}</div>`)
      .addTo(map);
  };

  useImperativeHandle(ref, () => ({
    flyTo: (lng, lat, zoom = 15) => { const m = mapRef.current; if (!m) return; m.resize(); m.flyTo({ center: [lng, lat], zoom: Math.max(m.getZoom(), zoom), duration: reduced() ? 0 : 1200 }); },
    fitBeach: (id) => { const m = mapRef.current; const b = beachBounds(id); if (!m || !b) return; m.resize(); m.fitBounds(b, { padding: { top: 120, bottom: 120, left: 50, right: 70 }, maxZoom: 14, duration: reduced() ? 0 : 1000 }); },
    showBeach: (id) => showBeach(id),
    center: () => { const c = mapRef.current?.getCenter(); return c ? [c.lng, c.lat] : null; },
  }));

  // A beach popup is plain HTML in the old language: close it when the language changes.
  useEffect(() => { popupRef.current?.remove(); }, [lang]);

  useEffect(() => {
    if (!box.current) return;
    const c = MAP_COLORS[theme];
    const map = new maplibregl.Map({
      container: box.current,
      style: {
        version: 8,
        sources: {
          sat: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 19, attribution: "Imagery © Esri, Maxar, Earthstar Geographics" },
          land: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
          coast: { type: "geojson", data: coastData },
          reports: { type: "geojson", data: reportData },
        },
        layers: [
          { id: "bg", type: "background", paint: { "background-color": c.sea } },
          { id: "sat", type: "raster", source: "sat", layout: { visibility: "none" } },
          { id: "land", type: "fill", source: "land", paint: { "fill-color": c.land } },
          { id: "land-edge", type: "line", source: "land", paint: { "line-color": c.edge, "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.4, 14, 1] } },
          { id: "coast-case", type: "line", source: "coast", layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 3.5, 10, 6.5, 12, 9.5, 15, 15] } },
          { id: "coast", type: "line", source: "coast", layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": ["get", "color"], "line-width": ["interpolate", ["linear"], ["zoom"], 8, 2, 10, 4, 12, 6, 15, 10] } },
          { id: "halo", type: "circle", source: "reports", filter: ["==", ["get", "kind"], "hot"],
            paint: { "circle-color": CORAL, "circle-opacity": 0.3, "circle-radius": 14, "circle-blur": 0.2 } },
          { id: "r-clean", type: "circle", source: "reports", filter: ["==", ["get", "kind"], "clean"],
            paint: { "circle-color": GOOD, "circle-stroke-color": ["case", ["get", "sel"], c.sel, c.ring], "circle-stroke-width": ["case", ["get", "sel"], 3, 1.5], "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 3, 14, 5, 17, 7] } },
          { id: "r-open", type: "circle", source: "reports", filter: ["!=", ["get", "kind"], "clean"],
            paint: { "circle-color": CORAL, "circle-stroke-color": ["case", ["get", "sel"], c.sel, c.ring], "circle-stroke-width": ["case", ["get", "sel"], 3, 2],
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, ["case", ["==", ["get", "kind"], "hot"], 6.5, 4.5], 14, ["case", ["==", ["get", "kind"], "hot"], 9, 7], 17, ["case", ["==", ["get", "kind"], "hot"], 12, 9]] } },
        ],
      },
      bounds: BALI,
      fitBoundsOptions: { padding: { top: 70, bottom: 110, left: 16, right: 64 } },
      maxBounds: MAX_BOUNDS,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    mapRef.current = map;
    if (import.meta.env.DEV) (window as unknown as { __pantaiMap?: MlMap }).__pantaiMap = map; // for browser tests

    map.on("load", () => {
      setReady(true);
      fetch("land.json").then((r) => r.json()).then((g) => (map.getSource("land") as GeoJSONSource | undefined)?.setData(g)).catch(() => { /* sea-only map still works */ });
    });

    map.on("click", (e) => {
      if (pickRef.current) { onPickRef.current(e.lngLat.lng, e.lngLat.lat); return; }
      const { x, y } = e.point;
      const hits = map.queryRenderedFeatures([[x - 12, y - 12], [x + 12, y + 12]], { layers: ["r-open", "r-clean"] });
      if (hits.length) {
        let best = hits[0], bd = Infinity;
        for (const h of hits) {
          const [lng, lat] = (h.geometry as GeoJSON.Point).coordinates;
          const p = map.project([lng, lat]);
          const d = (p.x - x) ** 2 + (p.y - y) ** 2;
          if (d < bd) { bd = d; best = h; }
        }
        onSelectRef.current(best.properties.id as string);
        return;
      }
      const lines = map.queryRenderedFeatures([[x - 8, y - 8], [x + 8, y + 8]], { layers: ["coast"] });
      if (lines.length) showBeach(lines[0].properties.id as string, e.lngLat);
    });
    const hoverOn = () => { map.getCanvas().style.cursor = "pointer"; };
    const hoverOff = () => { map.getCanvas().style.cursor = pickRef.current ? "crosshair" : ""; };
    for (const l of ["r-open", "r-clean", "coast"]) { map.on("mouseenter", l, hoverOn); map.on("mouseleave", l, hoverOff); }

    // Pulse the hotspot halo.
    let raf = 0;
    const tick = (t: number) => {
      if (map.getLayer("halo")) {
        const k = (t % 1600) / 1600;
        const z = map.getZoom();
        const base = z < 11 ? 8 : z < 14 ? 11 : 14;
        map.setPaintProperty("halo", "circle-radius", base + k * base * 1.3);
        map.setPaintProperty("halo", "circle-opacity", 0.45 * (1 - k));
      }
      raf = requestAnimationFrame(tick);
    };
    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const startPulse = () => { cancelAnimationFrame(raf); if (motion?.matches) { if (map.getLayer("halo")) { map.setPaintProperty("halo", "circle-radius", 15); map.setPaintProperty("halo", "circle-opacity", 0.3); } } else raf = requestAnimationFrame(tick); };
    map.on("load", startPulse);
    motion?.addEventListener?.("change", startPulse);

    // Kept mounted while hidden: resize when the tab shows again.
    const ro = new ResizeObserver(() => { if (box.current && box.current.clientWidth > 0) map.resize(); });
    ro.observe(box.current);

    return () => { cancelAnimationFrame(raf); motion?.removeEventListener?.("change", startPulse); ro.disconnect(); popupRef.current?.remove(); map.remove(); mapRef.current = null; setReady(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (ready) (mapRef.current?.getSource("coast") as GeoJSONSource | undefined)?.setData(coastData); }, [coastData, ready]);
  useEffect(() => { if (ready) (mapRef.current?.getSource("reports") as GeoJSONSource | undefined)?.setData(reportData); }, [reportData, ready]);

  // Recolour the base map when the theme changes. Satellite imagery is bright, so dots keep the light outline there.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const c = MAP_COLORS[theme];
    const dots = mode === "satellite" ? MAP_COLORS.light : c;
    map.setPaintProperty("bg", "background-color", c.sea);
    map.setPaintProperty("land", "fill-color", c.land);
    map.setPaintProperty("land-edge", "line-color", c.edge);
    for (const l of ["r-open", "r-clean"]) map.setPaintProperty(l, "circle-stroke-color", ["case", ["get", "sel"], dots.sel, dots.ring]);
  }, [theme, mode, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const sat = mode === "satellite";
    map.setLayoutProperty("sat", "visibility", sat ? "visible" : "none");
    map.setLayoutProperty("coast-case", "visibility", sat ? "visible" : "none");
    map.setLayoutProperty("land", "visibility", sat ? "none" : "visible");
    map.setLayoutProperty("land-edge", "visibility", sat ? "none" : "visible");
    // The compact attribution opens itself when imagery appears; fold it after a moment so it does not cover the buttons.
    const t = setTimeout(() => box.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show"), 2500);
    return () => clearTimeout(t);
  }, [mode, ready]);

  // Keep the selected report visible above the bottom sheet.
  useEffect(() => {
    const map = mapRef.current;
    const r = selectedId ? reportsRef.current.find((x) => x.id === selectedId) : null;
    if (!map || !r) return;
    const h = map.getContainer().clientHeight;
    const p = map.project([r.lng, r.lat]);
    if (p.y > 70 && p.y < h * 0.4 && p.x > 30 && p.x < map.getContainer().clientWidth - 70) return;
    map.easeTo({ center: [r.lng, r.lat], zoom: Math.max(map.getZoom(), 14), offset: [0, -Math.round(h * 0.3)], duration: reduced() ? 0 : 700 });
  }, [selectedId]);

  // Pick pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = pick ? "crosshair" : "";
    if (!pick) { pinRef.current?.remove(); pinRef.current = null; return; }
    if (!pinRef.current) {
      const el = document.createElement("div");
      el.className = "pick-pin";
      el.innerHTML = `<div class="pick-label"></div><svg viewBox="0 0 32 42" width="32" height="42" aria-hidden="true"><path d="M16 41c-1-4-14-15-14-25a14 14 0 0 1 28 0c0 10-13 21-14 25z" fill="#0e9f9a" stroke="#fff" stroke-width="2.5"/><circle cx="16" cy="16" r="5.5" fill="#fff"/></svg>`;
      pinRef.current = new maplibregl.Marker({ element: el, draggable: true, anchor: "bottom" }).setLngLat([pick.lng, pick.lat]).addTo(map);
      pinRef.current.on("dragend", () => { const p = pinRef.current?.getLngLat(); if (p) onPickRef.current(p.lng, p.lat); });
    } else pinRef.current.setLngLat([pick.lng, pick.lat]);
  }, [pick]);
  useEffect(() => {
    const label = pinRef.current?.getElement().querySelector(".pick-label") as HTMLElement | null;
    if (label) { label.textContent = pickLabel ?? ""; label.style.display = pickLabel ? "" : "none"; }
  }, [pickLabel, pick]);

  const locate = () => {
    if (!canLocate()) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition((p) => {
      setLocating(false);
      const map = mapRef.current;
      if (!map) return;
      const ll: [number, number] = [p.coords.longitude, p.coords.latitude];
      if (!meRef.current) { const el = document.createElement("div"); el.className = "me-dot"; meRef.current = new maplibregl.Marker({ element: el }).setLngLat(ll).addTo(map); }
      else meRef.current.setLngLat(ll);
      map.flyTo({ center: ll, zoom: Math.max(map.getZoom(), 14), duration: reduced() ? 0 : 1200 });
    }, () => setLocating(false), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  };

  const btn = "grid size-11 place-items-center rounded-full bg-card text-foreground shadow-md shadow-black/15 active:scale-95 transition";
  return (
    <div className="absolute inset-0">
      <div ref={box} className="size-full" role="region" aria-label={t("map.aria")} />
      <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-2">
        <div className="pointer-events-auto flex h-11 rounded-full bg-card p-1 shadow-md shadow-black/15" role="group" aria-label={t("map.style")}>
          {(["map", "satellite"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m}
              className={cn("rounded-full px-3 text-sm font-bold transition", mode === m ? "bg-brand text-white" : "text-muted-foreground")}>
              {m === "map" ? t("map.map") : t("map.satellite")}
            </button>
          ))}
        </div>
        <button type="button" className={cn(btn, "pointer-events-auto")} aria-label={t("map.zoomIn")} onClick={() => mapRef.current?.zoomIn()}><Plus className="size-5" /></button>
        <button type="button" className={cn(btn, "pointer-events-auto")} aria-label={t("map.zoomOut")} onClick={() => mapRef.current?.zoomOut()}><Minus className="size-5" /></button>
        {canLocate() && (
          <button type="button" className={cn(btn, "pointer-events-auto", locating && "text-brand animate-pulse")} aria-label={t("map.locate")} onClick={locate}><Crosshair className="size-5" /></button>
        )}
      </div>
    </div>
  );
}
