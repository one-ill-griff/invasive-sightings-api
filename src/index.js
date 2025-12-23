import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import { featuresToCollection, rowToFeature } from "./geojson.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "invasive-sightings-api" });
});

app.post("/sightings", async (req, res) => {
  try {
    const {
      species_common,
      species_scientific = null,
      category,
      severity,
      observed_at,
      observer = null,
      notes = null,
      lon,
      lat
    } = req.body ?? {};

    if (!species_common || !category || !observed_at) {
      return res.status(400).json({ error: "species_common, category, observed_at are required." });
    }
    if (typeof severity !== "number" || severity < 1 || severity > 5) {
      return res.status(400).json({ error: "severity must be a number between 1 and 5." });
    }
    if (typeof lon !== "number" || typeof lat !== "number") {
      return res.status(400).json({ error: "lon and lat must be numbers." });
    }

    const sql = `
      INSERT INTO sightings
        (species_common, species_scientific, category, severity, observed_at, observer, notes, geom)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7, ST_SetSRID(ST_MakePoint($8,$9), 4326))
      RETURNING
        id, species_common, species_scientific, category, severity, observed_at, observer, notes, created_at,
        ST_AsGeoJSON(geom)::json AS geom_geojson;
    `;

    const params = [
      species_common,
      species_scientific,
      category,
      severity,
      observed_at,
      observer,
      notes,
      lon, // ST_MakePoint(lon, lat)
      lat
    ];

    const { rows } = await pool.query(sql, params);
    return res.status(201).json(rowToFeature(rows[0]));
  } catch (err) {
    console.error("CREATE SIGHTING ERROR:", err);
    return res.status(500).json({ error: "Server error creating sighting." });
  }
});

app.get("/sightings/bbox", async (req, res) => {
  try {
    const { minLon, minLat, maxLon, maxLat } = req.query;

    const nums = [minLon, minLat, maxLon, maxLat].map(Number);
    if (nums.some((n) => Number.isNaN(n))) {
      return res.status(400).json({ error: "minLon, minLat, maxLon, maxLat must be numbers." });
    }

    const sql = `
      SELECT
        id, species_common, species_scientific, category, severity, observed_at, observer, notes, created_at,
        ST_AsGeoJSON(geom)::json AS geom_geojson
      FROM sightings
      WHERE geom && ST_MakeEnvelope($1,$2,$3,$4,4326)
      ORDER BY observed_at DESC
      LIMIT 2000;
    `;

    const { rows } = await pool.query(sql, nums);
    const features = rows.map(rowToFeature);
    res.json(featuresToCollection(features));
  } catch (err) {
    console.error("BBOX ERROR:", err);
    res.status(500).json({ error: "Server error querying bbox." });
  }
});

app.get("/sightings/near", async (req, res) => {
  try {
    const lon = Number(req.query.lon);
    const lat = Number(req.query.lat);
    const radius_m = Number(req.query.radius_m ?? 500);

    if ([lon, lat, radius_m].some(Number.isNaN)) {
      return res.status(400).json({ error: "lon, lat, radius_m must be numbers." });
    }

    const sql = `
      SELECT
        id, species_common, species_scientific, category, severity, observed_at, observer, notes, created_at,
        ST_AsGeoJSON(geom)::json AS geom_geojson
      FROM sightings
      WHERE ST_DWithin(
        geom::geography,
        ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
        $3
      )
      ORDER BY observed_at DESC
      LIMIT 2000;
    `;

    const { rows } = await pool.query(sql, [lon, lat, radius_m]);
    res.json(featuresToCollection(rows.map(rowToFeature)));
  } catch (err) {
    console.error("NEAR ERROR:", err);
    res.status(500).json({ error: "Server error querying near." });
  }
});

app.post("/sightings/within", async (req, res) => {
  try {
    const aoi = req.body?.aoi;
    if (!aoi) return res.status(400).json({ error: "Body must include { aoi: <GeoJSON Polygon/MultiPolygon> }" });

    const sql = `
      SELECT
        id, species_common, species_scientific, category, severity, observed_at, observer, notes, created_at,
        ST_AsGeoJSON(geom)::json AS geom_geojson
      FROM sightings
      WHERE ST_Within(
        geom,
        ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)
      )
      ORDER BY observed_at DESC
      LIMIT 2000;
    `;

    const { rows } = await pool.query(sql, [JSON.stringify(aoi)]);
    res.json(featuresToCollection(rows.map(rowToFeature)));
  } catch (err) {
    console.error("WITHIN ERROR:", err);
    res.status(500).json({ error: "Server error querying within." });
  }
});

app.get("/summary/by-species", async (req, res) => {
  try {
    const { minLon, minLat, maxLon, maxLat } = req.query;
    const nums = [minLon, minLat, maxLon, maxLat].map(Number);
    if (nums.some(Number.isNaN)) {
      return res.status(400).json({ error: "minLon, minLat, maxLon, maxLat must be numbers." });
    }

    const sql = `
      SELECT
        species_common,
        COUNT(*) AS n,
        AVG(severity)::numeric(10,2) AS avg_severity
      FROM sightings
      WHERE geom && ST_MakeEnvelope($1,$2,$3,$4,4326)
      GROUP BY species_common
      ORDER BY n DESC;
    `;

    const { rows } = await pool.query(sql, nums);
    res.json({ bbox: { minLon: nums[0], minLat: nums[1], maxLon: nums[2], maxLat: nums[3] }, rows });
  } catch (err) {
    console.error("SUMMARY ERROR:", err);
    res.status(500).json({ error: "Server error summarizing." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on port ${port}`));
