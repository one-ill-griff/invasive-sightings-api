Invasive Species Sightings API
---

A cloud-deployed geospatial REST API for storing, querying, and analyzing invasive species sightings using PostgreSQL + PostGIS.
Designed to support common GIS workflows such as map viewports, proximity analysis, polygon AOIs, and summary reporting.

---

Overview
---

This project simulates the type of backend service a geospatial data analyst or environmental monitoring team might build to support:
- Field data collection
- Spatial analysis
- Integration with GIS tools (QGIS / ArcGIS)
- Web map clients

The API stores point-based invasive species observations and exposes spatial queries that return GeoJSON, allowing results to be visualized directly in GIS software or mapping applications.

---

Tech Stack
---

- Backend: Node.js
- Database: PostgreSQL
- Spatial Extension: PostGIS
- Deployment: Cloud-hosted API + managed cloud database
- Data Format: GeoJSON (RFC 7946)
- Coordinate System: WGS 84 (SRID 4326)

---

Data Model
---

Table: Sightings

| Column               | Type                  | Description              |
| -------------------- | --------------------- | ------------------------ |
| `id`                 | UUID                  | Unique identifier        |
| `species_common`     | TEXT                  | Common species name      |
| `species_scientific` | TEXT                  | Scientific name          |
| `category`           | TEXT                  | Plant, shrub, tree, etc. |
| `severity`           | SMALLINT              | Invasion severity (1–5)  |
| `observed_at`        | TIMESTAMPTZ           | Observation timestamp    |
| `observer`           | TEXT                  | Observer or source       |
| `notes`              | TEXT                  | Field notes              |
| `geom`               | geometry(Point, 4326) | Geographic location      |
| `created_at`         | TIMESTAMPTZ           | Record creation time     |

---

Spatial Indexing
---

A GiST index is applied to the geometry column to support fast spatial queries.

---

API Endpoints
---

A GiST index is applied to the geometry column to support fast spatial queries.

---

Health Check
---

GET /health

Confirms the API is running.

---

Create a Sighting
---

POST /sightings

Insert a new invasive species observation.

Body (JSON):

{
  "species_common": "Japanese knotweed",
  "species_scientific": "Reynoutria japonica",
  "category": "plant",
  "severity": 4,
  "observed_at": "2025-12-22T20:00:00Z",
  "observer": "field_team",
  "notes": "Dense patch along creek bank",
  "lon": -86.8651,
  "lat": 39.6412
}

---

Bounding Box Query (Map Viewport)
---

GET /sightings/bbox

Returns sightings within a rectangular bounding box.

Query parameters:

minLon, minLat, maxLon, maxLat


Example:

/sightings/bbox?minLon=-87&minLat=39&maxLon=-86&maxLat=40

---

Proximity Query (Nearby)
---

GET /sightings/bbox

Returns sightings within a rectangular bounding box.

Query parameters:

minLon, minLat, maxLon, maxLat


Example:

/sightings/bbox?minLon=-87&minLat=39&maxLon=-86&maxLat=40

---

Polygon AOI Query
---

POST /sightings/within

Returns sightings inside an arbitrary polygon (AOI).

Body (GeoJSON):

{
  "aoi": {
    "type": "Polygon",
    "coordinates": [
      [
        [-86.87, 39.63],
        [-86.86, 39.63],
        [-86.86, 39.65],
        [-86.87, 39.65],
        [-86.87, 39.63]
      ]
    ]
  }
}

---

Summary Statistics
---

GET /summary/by-species

Returns counts and average severity by species within a bounding box.

Example:

/summary/by-species?minLon=-87&minLat=39&maxLon=-86&maxLat=40

---

Spatial SQL Used
---

This project makes direct use of PostGIS spatial functions:

- ST_MakePoint
- ST_SetSRID
- ST_AsGeoJSON
- ST_MakeEnvelope
- ST_DWithin
- ST_Within

Spatial performance is optimized using GiST indexing

---

Using with QGIS / ArcGIS
---

Because endpoints return GeoJSON, results can be loaded directly into GIS software.

QGIS Example

1. Layer → Add Layer → Add Vector Layer
2. Source: HTTP
3. Format: GeoJSON
4. aste a bbox or near endpoint URL
5. Click Add

Points will render immediately on the map.

---

Running Locally
---

npm install
npm start

Environment Vairables:
DATABASE_URL=<PostgreSQL connection URI>

---

Deployment
---

The API is deployed as a cloud web service and connects to a managed PostgreSQL + PostGIS database.
Environment variables are provided through the hosting platform.

---

Why This Project
---

This project demonstrates:

- Real-world geospatial data modeling
- Spatial indexing and query optimization
- Cloud backend deployment
- GIS-friendly API design
- Integration with professional GIS tooling
- It reflects the type of infrastructure used in environmental monitoring, invasive species management, and geospatial analytics workflows.

---

