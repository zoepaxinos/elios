"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const ELIOS_LNG = 144.971883;
const ELIOS_LAT = -37.730724;
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

function MapInner() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    let cancelled = false;

    (async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        await import("mapbox-gl/dist/mapbox-gl.css");

        if (cancelled || !mapContainer.current) return;

        mapboxgl.accessToken = TOKEN;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/zapdsgn/cmq3fplfn000g01pu2cu899h0",
          center: [ELIOS_LNG, ELIOS_LAT],
          zoom: 15,
          attributionControl: false,
        });

        // Elio's E icon marker
        const markerEl = document.createElement("div");
        markerEl.style.cssText = "width:50px;height:50px;cursor:pointer;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4));";
        const img = document.createElement("img");
        img.src = "/images/elios-map-icon.png";
        img.alt = "Elio's";
        img.style.cssText = "width:100%;height:100%;object-fit:contain;";
        markerEl.appendChild(img);

        new mapboxgl.Marker({ element: markerEl, anchor: "bottom" })
          .setLngLat([ELIOS_LNG, ELIOS_LAT])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div style="font-family:Futura,'Trebuchet MS',sans-serif;padding:8px 12px;background:#13322b;color:#ffffdc;border-radius:8px;">
                <strong style="font-size:15px;display:block;margin-bottom:4px;">Elio's Panino Italiano</strong>
                <span style="font-size:12px;opacity:0.8;line-height:1.4;">70 Newlands Road<br/>Coburg North, VIC 3058</span>
              </div>`
            )
          )
          .addTo(map.current);

        map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");
      } catch (e) {
        console.warn("Map failed to load:", e);
      }
    })();

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: "300px", backgroundColor: "#13322b" }}
    />
  );
}

export default function Map() {
  return <MapInner />;
}
