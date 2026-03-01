

// function to change the degree to radian

function degtoRad(deg) {
  return (deg * Math.PI) / 180;
}

// function to get distance in km

function getDistanceInKm(lat1,lon1,lat2,lon2){
    const earthRadiuskm = 6371;
    const dLat = degtoRad(lat2-lat1);

    const dLon = degtoRad(lon2-lon1);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(degtoRad(lat1)) * Math.cos(degtoRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = earthRadiuskm * c;
    return distance;

}


module.exports = {getDistanceInKm};