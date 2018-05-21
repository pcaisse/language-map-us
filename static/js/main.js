var mapCenter = [39.8333333,-98.585522];
var map = L.map('map').setView(mapCenter, 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// NOTE: statesResponse is from states.js
statesResponse.results.map(function(result) {
  L.geoJSON(result.geom).addTo(map);
});

map.on('moveend', function() {
  console.log(map.getBounds());
});
