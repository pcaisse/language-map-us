const mapCenter = [37.69164172115731, -94.65820312500001];
const map = L.map('map').setView(mapCenter, 5);

// NOTE: Response to get GeoJSON for all states is saved as a static file since
// it takes ~10s to calculate (too long to wait) though the payload is only
// 500KB. This is because the query involves the simplification of the geometry
// which brings down the file size but takes more time. This simplification
// isn't noticable until you zoom in more, at which point we've already
// switched to showing PUMA geometries.

let layers;
let isStateLevel;

function drawTiles() {
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    $.getJSON(url, response => {
      if (response.success) {
        resolve(response.results);
      } else {
        reject(response.message);
      }
    }).fail(xhr => {
      reject(xhr.responseJSON.errors);
    });
  });
}

function createLayers(results) {
  return L.layerGroup(
    results.map(result => {
      return L.geoJSON(result.geom).on("click", e => {
        return map.fitBounds(e.layer.getBounds());
      });
    })
  );
}

function drawMap(currIsStateLevel) {
  // NOTE: Query params should be the same for both async requests
  const search = window.location.search;
  fetchJSON('/api/speakers/' + search).then(speakerResults => {
    // We have speaker data. Now we need layers that reflect that data.
    if (currIsStateLevel) {
      return fetchJSON('static/json/states.json');
    } else {
      return fetchJSON('/api/geojson/' + search);
    }
  }).then(geojsonResults => {
    // TODO: Use speakerResults
    if (layers) {
      map.removeLayer(layers);
    }
    layers = createLayers(geojsonResults).addTo(map);
  }).catch(console.log);
}

function refreshMap() {
  const bounds = map.getBounds();
  const boundingBoxStr = bounds.toBBoxString();

  const prevIsStateLevel = isStateLevel;
  const currIsStateLevel = map.getZoom() < 8;
  const levelStr = currIsStateLevel ? "state" : "puma";

  history.pushState({
    level: levelStr,
    boundingBox: boundingBoxStr
  },
    'Map refresh',
    window.location.origin + '?level=' + levelStr + '&boundingBox=' + boundingBoxStr
  );

  if (layers) {
    map.removeLayer(layers);
  }
  drawMap(currIsStateLevel);

  // Update global level state
  isStateLevel = currIsStateLevel;
}

drawTiles();
// TODO: Rate limit map refresh
refreshMap();
map.on('moveend', refreshMap);
