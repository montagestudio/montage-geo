var Montage = require("montage/core/core").Montage,
    GeometryCollection = require("logic/model/geometry-collection").GeometryCollection,
    Position = require("logic/model/position").Position;

/**
 *
 * A bounding box represents an area defined by two longitudes and
 * two latitudes
 *
 * @class
 * @extends external:Montage
 */
exports.BoundingBox = Montage.specialize(/** @lends BoundingBox.prototype */ {

    /********************************************
     * Properties
     */

    /**
     * The maximum longitude
     * @type {number}
     */
    xMax: {
        get: function () {
            return this._xMax;
        },
        set: function (x) {
            this._xMax = x;
            if (this._bbox) {
                this._bbox.splice(2, 1, x);
            }
        }
    },

    /**
     * The minimum longitude
     * @type {number}
     */
    xMin: {
        get: function () {
            return this._xMin;
        },
        set: function (x) {
            this._xMin = x;
            if (this._bbox) {
                this._bbox.splice(0, 1, x);
            }
        }
    },

    /**
     * The maximum latitude
     * @type {number}
     */
    yMax: {
        get: function () {
            return this._yMax;
        },
        set: function (y) {
            this._yMax = y;
            if (this._bbox) {
                this._bbox.splice(3, 1, y);
            }
        }
    },

    /**
     * The minimum latitude
     * @type {number}
     */
    yMin: {
        get: function () {
            return this._yMin;
        },
        set: function (y) {
            this._yMin = y;
            if (this._bbox) {
                this._bbox.splice(1, 1, y);
            }
        }
    },

    /********************************************
     * Derived Properties
     */

    /**
     * A Geometry MAY have a member named "bbox" to include
     * information on the coordinate range for its coordinates.
     * The value of the bbox member MUST be an array of
     * length 2*n where n is the number of dimensions represented
     * in the contained geometries, with all axes of the most south-
     * westerly point followed by all axes of the more northeasterly
     * point.  The axes order of a bbox follows the axes order of
     * geometries.
     *
     * @type {Array.<number>}
     */
    bbox: {
        get: function () {
            if (!this._bbox) {
                this._bbox = [this.xMin, this.yMin, this.xMax, this.yMax];
            }
            return this._bbox;
        },
        set: function (box) {
            this.xMin = box[0];
            this.xMax = box[2];
            this.yMin = box[1];
            this.yMax = box[3];
        }
    },

    /**
     *
     * Returns this bounding box with the coordinates of
     * a polygon.
     * TODO: Make Observable
     * @method
     * @returns {Array<Position>}
     */
    coordinates: {
        get: function () {
            var southEast = Position.withCoordinates(this.xMax, this.yMin),
                southWest = Position.withCoordinates(this.xMin, this.yMin),
                northWest = Position.withCoordinates(this.xMin, this.yMax),
                northEast = Position.withCoordinates(this.xMax, this.yMax);
            return [
                [southWest, northWest, northEast, southEast, southWest]
            ];
        }
    },

    /**
     * The positions of this bounding box.
     * TODO: Make Observable
     * @returns {array<Position>}
     */
    positions: {
        get: function () {
            var bbox = this.bbox,
                positions = [],
                i, j, x, y;
            for (i = 0; i < 2; i += 1) {
                for (j = 0; j < 2; j += 1) {
                    x = i === 0 ? bbox[0] : bbox[2];
                    y = j === 0 ? bbox[1] : bbox[3];
                    positions.push(Position.withCoordinates(x, y));
                }
            }
            return positions;
        }
    },

    /******************************************************
     * Testing
     */

    /**
     * Determines whether or not the bounds contains the
     * position.
     *
     * @method
     * @param {Position} position - The position to test.
     * @returns {boolean}
     */
    contains: {
        value: function (position) {
            var lng = position.longitude,
                lat = position.latitude;
            return  lng <= this.xMax &&
                    lng >= this.xMin &&
                    lat <= this.yMax &&
                    lat >= this.yMin;
        }
    },

    /**
     * Determines whether or not the bounds intersects,
     * contains or is within the passed in feature.
     *
     * @method
     * @param {Feature}
     * @returns {boolean}
     */
    containsFeature: {
        value: function (feature) {
            var geometry = feature.geometry;
            return this.splitAlongAntimeridian().some(function (bounds) {
                return geometry instanceof GeometryCollection ? geometry.geometries.some(function (geometry) {
                    return geometry.intersects(bounds);
                }) : geometry.intersects(bounds)
            });
        }
    },

    equals: {
        value: function (other) {
            return other === this ||
                other && other.xMin === this.xMin &&
                other.yMin === this.yMin &&
                other.xMax === this.xMax &&
                other.yMax === this.yMax;
        }
    },

    /***
     * Returns true if this bounds intersects the passed in bounds.
     * @param {Object} Bounds - the bounds to compare to this bounds.
     * @return {Boolean}
     */
    intersects: {
        value: function (other) {
            var otherSplits = other.splitAlongAntimeridian();
            return this.splitAlongAntimeridian().some(function (thisSplit) {
                return otherSplits.some(function (otherSplit) {
                    // Taken from leaflet.Bounds#intersects.
                    return  otherSplit.xMax >= thisSplit.xMin &&
                            otherSplit.xMin <= thisSplit.xMax &&
                            otherSplit.yMax >= thisSplit.yMin &&
                            otherSplit.yMin <= thisSplit.yMax;
                });
            });
        }
    },

    /**
     * Test if any of the position's coordinates are on
     * any of the boundaries of this bounds.
     * @param {Position}
     * @returns {boolean}
     */
    isOnBoundary: {
        value: function (position) {
            var lng = position.longitude,
                lat = position.latitude;
            return  this.xMin === lng || this.xMax === lng ||
                this.yMin === lat || this.yMax === lat;
        }
    },

    /******************************************************
     * Measurement
     */

    /**
     * Returns the area of this bounding box in square meters
     * @method
     * @returns {number}
     */
    area: {
        get: function() {
            var southWest = Position.withCoordinates(this.xMin, this.yMin),
                northWest = Position.withCoordinates(this.xMin, this.yMax),
                southEast = Position.withCoordinates(this.xMax, this.yMin),
                height = southWest.distance(northWest),
                width = southWest.distance(southEast);
            return height * width;
        }
    },

    /******************************************************
     * Mutating
     */

    extend: {
        value: function (position) {
            var lng = position.longitude,
                lat = position.latitude;
            if (this.xMin > lng) this.xMin = lng;
            if (this.xMax < lng) this.xMax = lng;
            if (this.yMin > lat) this.yMin = lat;
            if (this.yMax < lat) this.yMax = lat;
        }
    },

    setWithPositions: {
        value: function (positions) {
            var xMin = Infinity,
                yMin = Infinity,
                xMax = -Infinity,
                yMax = -Infinity;
            positions = positions || [];
            positions.forEach(function (position) {
                var lng = position.longitude,
                    lat = position.latitude;
                if (xMin > lng) xMin = lng;
                if (xMax < lng) xMax = lng;
                if (yMin > lat) yMin = lat;
                if (yMax < lat) yMax = lat;
            });
            if (this.xMin !== xMin) this.xMin = xMin;
            if (this.yMin !== yMin) this.yMin = yMin;
            if (this.xMax !== xMax) this.xMax = xMax;
            if (this.yMax !== yMax) this.yMax = yMax;
        }
    },

    /******************************************************
     * Utilities
     */

    /**
     * @todo [Charles]: The array of split bounds will be cached, but the cache
     * is not updated or cleared if the bound values change. Either the cache
     * should be cleared on bound changes, or preferably bounds should be made
     * an immutable object.
     */
    splitAlongAntimeridian: {
        value: function () {
            if (!this._split) {
                this._split = [];
                if (this.xMin <= this.xMax) {
                    this._split.push(this);
                } else {
                    this._split.push(exports.BoundingBox.withCoordinates(this.xMin, this.yMin, 179.99999, this.yMax));
                    this._split.push(exports.BoundingBox.withCoordinates(-179.99999, this.yMin, this.xMax, this.yMax));
                }
            }
            return this._split;
        }
    }

}, {

    withBbox: {
        value: function (bbox, projection) {
            return exports.BoundingBox.withCoordinates(bbox[0], bbox[1], bbox[2], bbox[3], projection);
        }
    },

    withCoordinates: {
        value: function (xMin, yMin, xMax, yMax, projection) {
            var bounds = new this(),
                minimums = projection ? projection.inverseProjectPoint([xMin, yMin]) : [xMin, yMin],
                maximums = projection ? projection.inverseProjectPoint([xMax, yMax]) : [xMax, yMax];
            bounds.xMin = minimums[0];
            bounds.yMin = minimums[1];
            bounds.xMax = maximums[0];
            bounds.yMax = maximums[1];
            return bounds;
        }
    }

});

exports.BoundingBox.EARTH = exports.BoundingBox.withCoordinates(-180.0, -85.05112878, 180.0, 85.05112878);
