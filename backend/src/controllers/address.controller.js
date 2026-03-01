const Province = require('../models/Provinces');
const responses = require('../http/response');
const District = require('../models/Districts');
const Municipal = require('../models/Municipal');
const ServiceLocation = require('../models/Location');

const fetchProvinces = async (req, res, next) => {
    try {
      const provinces = await Province.findAll({
        attributes: ['id', 'name_en', 'name_np','province_code']
      });
      return responses.success(res, { provinces }, "Provinces fetched successfully");
    }
    catch (err) {
        console.error("Error fetching provinces:", err);
        return responses.serverError(res, "An error occurred while fetching provinces.");
        }
    };


const fetchDistrictsByProvince = async (req, res, next) => {
    try {
        const { province_code } = req.params;
        if (!province_code) {
            return responses.badRequest(res, {}, "Province code is required");
        }
        const districts = await District.findAll({
            where: { province_code },
            attributes: ['id', 'district_code', 'name_en', 'name_np','province_code']
        });
        return responses.success(res, { districts }, "Districts fetched successfully");
    } catch (err) {
        console.error("Error fetching districts:", err);
        return responses.serverError(res, "An error occurred while fetching districts.");
    }
}
const fetchMunicipalsByDistrict = async (req, res, next) => {
    try {
        const { district_code } = req.params;
        if (!district_code) {
            return responses.badRequest(res, {}, "District code is required");
        }
        const municipals = await Municipal.findAll({
            where: { district_code },
            attributes: ['id', 'name_en', 'name_np', 'district_code','municipal_code']
        });
        return responses.success(res, { municipals }, "Municipals fetched successfully");
    }
    catch (err) {
        console.error("Error fetching municipals:", err);
        return responses.serverError(res, "An error occurred while fetching municipals.");
    }
}


// location part


const fetchLocation = async (req, res, next) => {
  try {
    const locations = await ServiceLocation.findAll({
      attributes: ['id', 'city'],
    });

    return responses.success(res, { locations }, "Locations fetched successfully");
  } catch (err) {
    console.error('Error fetching locations:', err);
    return responses.serverError(res, "An error occurred while fetching locations.");
  }
};

module.exports = {
    fetchProvinces,
    fetchDistrictsByProvince,
    fetchMunicipalsByDistrict,
    fetchLocation
};