# NYSAWWA New York 10 Regions

Reference artwork and county mapping for the **togglable regions overlay** on OWW Leaflet maps (Jobs board, National map).

## Assets

| File | Purpose |
|------|---------|
| [NY10Regions.png](./NY10Regions.png) | Official-style 10-region choropleth (source artwork) |
| [jobs-board-map-reference.png](./jobs-board-map-reference.png) | Example jobs board map with utility pins |
| [regions.json](./regions.json) | Machine-readable region → county list + colors |

Runtime GeoJSON (county polygons + region properties) ships with the frontend:

- `frontend/public/maps/ny-counties-regions.geojson`
- Reference PNG also copied to `frontend/public/maps/NY10Regions.png`

## Regions (from artwork)

1. **North Country** — St. Lawrence, Jefferson, Lewis, Franklin, Clinton, Essex, Hamilton  
2. **Western New York** — Niagara, Erie, Chautauqua, Cattaraugus, Allegany  
3. **Finger Lakes** — Orleans, Genesee, Wyoming, Livingston, Monroe, Ontario, Wayne, Seneca, Yates  
4. **Southern Tier** — Steuben, Schuyler, Chemung, Tompkins, Tioga, Broome, Delaware (+ Chenango)  
5. **Central New York** — Oswego, Cayuga, Onondaga, Cortland, Madison  
6. **Mohawk Valley** — Oneida, Herkimer, Fulton, Montgomery, Otsego, Schoharie  
7. **Capital District** — Warren, Washington, Saratoga, Schenectady, Albany, Rensselaer, Greene, Columbia  
8. **Mid-Hudson** — Sullivan, Ulster, Dutchess, Orange, Putnam, Rockland, Westchester  
9. **New York City** — Bronx, New York, Kings, Queens, Richmond  
10. **Long Island** — Nassau, Suffolk  

Chenango is not labeled on the reference PNG; it is assigned to Southern Tier (common ED grouping).

## Map UX

Every Leaflet map surface includes a **NY regions** toggle (default on for NY-centered views). Turning it off removes the choropleth; markers and basemap remain.
