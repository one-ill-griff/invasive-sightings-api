export function rowToFeature(row) {
  const { geom_geojson, ...props } = row;
  return {
    type: "Feature",
    geometry: geom_geojson,
    properties: props
  };
}

export function featuresToCollection(features) {
  return { type: "FeatureCollection", features };
}
