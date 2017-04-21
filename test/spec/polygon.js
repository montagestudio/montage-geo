var Polygon = require("montage-geo/logic/model/polygon").Polygon,
    Position = require("montage-geo/logic/model/position").Position;

describe("A Polygon", function () {

    it("can be created", function () {
        var p1 = Polygon.withCoordinates([
            [[0,0], [0,10], [10,10], [10,0], [0,0]]
        ]);
        expect(p1.coordinates.length).toBe(1);
        expect(p1.coordinates[0].length).toBe(5);
    });

    it("can properly create a bbox", function () {
        var p1 = Polygon.withCoordinates([
            [[0,0], [0,10], [10,10], [10,0], [0,0]]
        ]);
        expect(p1.bbox.join(",")).toBe("0,0,10,10");
    });

    it("can properly update its bbox", function () {
        var p1 = Polygon.withCoordinates([
                [[0,0], [0,10], [10,10], [10,0], [0,0]]
            ]),
            p2 = Polygon.withCoordinates([
            [[0,0], [0,10], [10,10], [10,0], [0,0]]
        ]);
        p1.coordinates[0].splice(1, 1, Position.withCoordinates(0, 20));
        p2.coordinates[0].splice(2, 0, Position.withCoordinates(5, 20));
        expect(p1.bbox.join(",")).toBe("0,0,10,20");
        expect(p2.bbox.join(",")).toBe("0,0,10,20");
        p2.coordinates[0].splice(2, 1);
        expect(p2.bbox.join(",")).toBe("0,0,10,10");
        p1.coordinates = [
            [
                Position.withCoordinates(10, 10),
                Position.withCoordinates(20, 10),
                Position.withCoordinates(20, 20),
                Position.withCoordinates(10, 20),
                Position.withCoordinates(10, 10)
            ]
        ];
        expect(p1.bbox.join(",")).toBe("10,10,20,20");
    });

    it("can test another polygon for intersection", function () {
        var p1 = Polygon.withCoordinates([
                [[0,0], [0,10], [10,10], [10,0], [0,0]]
            ]),
            p2 = Polygon.withCoordinates([
                [[5,5], [5,15], [15,15], [15,5], [5,5]]
            ]);
        expect(p1.intersects(p2)).toBe(true);
    });

    it("can test another if polygon is in a hole", function () {
        var p1 = Polygon.withCoordinates([
                [[0,0], [0,40], [40,40], [40,0], [0,0]],
                [[10,10], [10,30], [30,30], [30,10], [10,10]]
            ]),
            p2 = Polygon.withCoordinates([
                [[15,15], [15,25], [25,25], [25,15], [15,15]]
            ]);
        expect(p1.intersects(p2)).toBe(false);
    });


});
