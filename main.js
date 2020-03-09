(function () {

    let DATA_URL = "https://hrmbuses.herokuapp.com/";

/***  little hack starts here ***/
    // source: http://jsfiddle.net/paulovieira/yVLJf/
    L.Map = L.Map.extend({
        openPopup: function (popup) {
            //        this.closePopup();  // just comment this
            this._popup = popup;

            return this.addLayer(popup).fire('popupopen', {
                popup: this._popup
            });
        }
    }); /***  end of hack ***/

    //create map in leaflet and tie it to the div called 'theMap'
    var map = L.map('theMap').setView([44.650627, -63.597140], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Data by <a href="https://www.halifax.ca/home/open-data/halifax-transit-open-data">Halifax Transit</a>'
    }).addTo(map);

    var busIcon = L.icon({
        iconUrl: 'bus2.png',
        iconSize: [50, 50], // size of the icon
    });

    let markers = null;

    let fetchData = async () => {

        // fetch real-time transit data
        fetch(DATA_URL)
            .then((response) => {
                return response.json();
            })
            .then((myJson) => {

                // console.log(myJson.entity);
                let geojsonFeatureBus = myJson.entity
                    // .filter((bus) => parseInt(bus.vehicle.trip.routeId) <= 10)
                    .map((bus) => {
                        return {
                            type: "Feature",
                            properties: {
                                unique_id: bus.id,
                                trip_id: bus.vehicle.trip.tripId,
                                start_date: bus.vehicle.trip.startDate,
                                route_id: bus.vehicle.trip.routeId,
                                speed: bus.vehicle.position.speed,
                                bearing: bus.vehicle.position.bearing,
                                veh_id: bus.vehicle.vehicle.id,
                                label: bus.vehicle.vehicle.label
                            },
                            geometry: {
                                type: "Point",
                                coordinates: [bus.vehicle.position.longitude, bus.vehicle.position.latitude]
                            }
                        };
                    });

                // console.log(markers);
                if (markers !== null) {
                    markers.clearLayers();
                    markers = null;
                    ctr = 0;
                    // console.log(markers);
                }
                //  plot the markers on the map
                markers = L.geoJSON(geojsonFeatureBus, {
                    pointToLayer: function (feature, latlng) {
                        let start_date;
                        if (feature.properties.start_date.length !== 8) {
                            start_date = feature.properties.start_date;
                        }
                        else {
                            let year = feature.properties.start_date.slice(0, 4);
                            let month = feature.properties.start_date.slice(4, 6);
                            let day = feature.properties.start_date.slice(6, 8);
                            start_date = new Date(month + " " + day + " " + year).toDateString();
                            console.log(feature.properties.start_date);
                        }

                        let marker = L.marker(latlng, { icon: busIcon, rotationAngle: feature.properties.bearing });
                        marker.bindPopup(
                            '<h3>Bus #' + feature.properties.route_id + '</h3>' +
                            'Unique ID: ' + feature.properties.unique_id + '<br/>' +
                            'Trip ID: ' + feature.properties.trip_id + '<br/>' +
                            'Start Date: ' + start_date + '<br/>' +
                            'Speed: ' + feature.properties.speed + '<br/>' +
                            'Vehicle ID: ' + feature.properties.veh_id + '<br/>'
                        ).openPopup();
                        return marker;
                    }
                }).addTo(map);
            });
    };

    // fetchData();
    setInterval(fetchData, 3000);
})()