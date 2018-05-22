var mapCenter = [37.69164172115731, -94.65820312500001];
var map = L.map('map').setView(mapCenter, 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// NOTE: statesResponse is from states.js
statesResponse.results.map(function(result) {
  L.geoJSON(result.geom).addTo(map);
});

map.on('moveend', function() {
  bounds = map.getBounds();
  $.ajax({
    url: '/api/speakers/?level=state&boundingBox=' + bounds.toBBoxString(),
    type: 'get',
  }, function(data) {
    if (data.success) {
      console.log(data.results);
    }
  });
});
