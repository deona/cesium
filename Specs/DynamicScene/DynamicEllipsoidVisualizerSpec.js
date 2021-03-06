/*global defineSuite*/
defineSuite([
             'DynamicScene/DynamicEllipsoidVisualizer',
             'Core/Matrix3',
             'Core/Matrix4',
             'Specs/createScene',
             'Specs/destroyScene',
             'Specs/MockProperty',
             'DynamicScene/DynamicEllipsoid',
             'DynamicScene/DynamicObjectCollection',
             'DynamicScene/DynamicObject',
             'Scene/Material',
             'Core/JulianDate',
             'Core/Quaternion',
             'Core/Cartesian3',
             'Core/Spherical',
             'Core/Color',
             'Scene/Scene'
            ], function(
              DynamicEllipsoidVisualizer,
              Matrix3,
              Matrix4,
              createScene,
              destroyScene,
              MockProperty,
              DynamicEllipsoid,
              DynamicObjectCollection,
              DynamicObject,
              Material,
              JulianDate,
              Quaternion,
              Cartesian3,
              Spherical,
              Color,
              Scene) {
    "use strict";
    /*global jasmine,describe,xdescribe,it,xit,expect,beforeEach,afterEach,beforeAll,afterAll,spyOn,runs,waits,waitsFor*/

    var scene;
    var visualizer;

    beforeAll(function() {
        scene = createScene();
    });

    afterAll(function() {
        destroyScene(scene);
    });

    afterEach(function() {
        visualizer = visualizer && visualizer.destroy();
    });

    it('constructor throws if no scene is passed.', function() {
        expect(function() {
            return new DynamicEllipsoidVisualizer();
        }).toThrow();
    });

    it('constructor sets expected parameters.', function() {
        var dynamicObjectCollection = new DynamicObjectCollection();
        visualizer = new DynamicEllipsoidVisualizer(scene, dynamicObjectCollection);
        expect(visualizer.getScene()).toEqual(scene);
        expect(visualizer.getDynamicObjectCollection()).toEqual(dynamicObjectCollection);
    });

    it('update throws if no time specified.', function() {
        var dynamicObjectCollection = new DynamicObjectCollection();
        visualizer = new DynamicEllipsoidVisualizer(scene, dynamicObjectCollection);
        expect(function() {
            visualizer.update();
        }).toThrow();
    });

    it('update does nothing if no dynamicObjectCollection.', function() {
        visualizer = new DynamicEllipsoidVisualizer(scene);
        visualizer.update(new JulianDate());
    });

    it('isDestroy returns false until destroyed.', function() {
        visualizer = new DynamicEllipsoidVisualizer(scene);
        expect(visualizer.isDestroyed()).toEqual(false);
        visualizer.destroy();
        expect(visualizer.isDestroyed()).toEqual(true);
        visualizer = undefined;
    });

    it('object with no ellipsoid does not create a primitive.', function() {
        var dynamicObjectCollection = new DynamicObjectCollection();
        visualizer = new DynamicEllipsoidVisualizer(scene, dynamicObjectCollection);

        var testObject = dynamicObjectCollection.getOrCreateObject('test');
        testObject.position = new MockProperty(new Cartesian3(1234, 5678, 9101112));
        testObject.orientation = new MockProperty(new Quaternion(0, 0, 0, 1));
        visualizer.update(new JulianDate());
        expect(scene.getPrimitives().getLength()).toEqual(0);
    });

    it('object with no position does not create a primitive.', function() {
        var dynamicObjectCollection = new DynamicObjectCollection();
        visualizer = new DynamicEllipsoidVisualizer(scene, dynamicObjectCollection);

        var testObject = dynamicObjectCollection.getOrCreateObject('test');
        testObject.orientation = new MockProperty(new Quaternion(0, 0, 0, 1));
        var ellipsoid = testObject.ellipsoid = new DynamicEllipsoid();
        ellipsoid.radii = new MockProperty(new Cartesian3(1, 2, 3));
        visualizer.update(new JulianDate());
        expect(scene.getPrimitives().getLength()).toEqual(0);
    });

    it('object with no radii does not create a primitive.', function() {
        var dynamicObjectCollection = new DynamicObjectCollection();
        visualizer = new DynamicEllipsoidVisualizer(scene, dynamicObjectCollection);

        var testObject = dynamicObjectCollection.getOrCreateObject('test');
        testObject.position = new MockProperty(new Cartesian3(1234, 5678, 9101112));
        testObject.orientation = new MockProperty(new Quaternion(0, 0, 0, 1));
        testObject.ellipsoid = new DynamicEllipsoid();
        visualizer.update(new JulianDate());
        expect(scene.getPrimitives().getLength()).toEqual(0);
    });

    it('object with no orientation does not create a primitive.', function() {
        var dynamicObjectCollection = new DynamicObjectCollection();
        visualizer = new DynamicEllipsoidVisualizer(scene, dynamicObjectCollection);

        var testObject = dynamicObjectCollection.getOrCreateObject('test');
        testObject.position = new MockProperty(new Cartesian3(1234, 5678, 9101112));
        testObject.ellipsoid = new DynamicEllipsoid();
        testObject.ellipsoid.radii = new MockProperty(new Cartesian3(1, 2, 3));
        visualizer.update(new JulianDate());
        expect(scene.getPrimitives().getLength()).toEqual(0);
    });

    it('A DynamicEllipsoid causes a EllipsoidPrimitive to be created and updated.', function() {
        var time = new JulianDate();
        var dynamicObjectCollection = new DynamicObjectCollection();
        visualizer = new DynamicEllipsoidVisualizer(scene, dynamicObjectCollection);

        var testObject = dynamicObjectCollection.getOrCreateObject('test');
        testObject.position = new MockProperty(new Cartesian3(1234, 5678, 9101112));
        testObject.orientation = new MockProperty(new Quaternion(0, 0, 0, 1));

        var ellipsoid = testObject.ellipsoid = new DynamicEllipsoid();
        ellipsoid.directions = new MockProperty([new Spherical(0, 0, 0), new Spherical(1, 0, 0), new Spherical(2, 0, 0), new Spherical(3, 0, 0)]);
        ellipsoid.radii = new MockProperty(123.5);
        ellipsoid.show = new MockProperty(true);
        var redMaterial = Material.fromType(scene.getContext(), Material.ColorType);
        redMaterial.uniforms.color = Color.RED;
        ellipsoid.material = new MockProperty(redMaterial);
        visualizer.update(time);

        expect(scene.getPrimitives().getLength()).toEqual(1);
        var p = scene.getPrimitives().get(0);
        expect(p.radii).toEqual(testObject.ellipsoid.radii.getValue(time));
        expect(p.show).toEqual(testObject.ellipsoid.show.getValue(time));
        expect(p.material).toEqual(testObject.ellipsoid.material.getValue(time));
        expect(p.modelMatrix).toEqual(Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(testObject.orientation.getValue(time).conjugate()), testObject.position.getValueCartesian(time)));

        ellipsoid.show.value = false;
        visualizer.update(time);
        expect(p.show).toEqual(testObject.ellipsoid.show.getValue(time));
    });

    it('clear hides ellipsoids.', function() {
        var dynamicObjectCollection = new DynamicObjectCollection();
        visualizer = new DynamicEllipsoidVisualizer(scene, dynamicObjectCollection);

        var testObject = dynamicObjectCollection.getOrCreateObject('test');
        testObject.position = new MockProperty(new Cartesian3(1234, 5678, 9101112));
        testObject.orientation = new MockProperty(new Quaternion(0, 0, 0, 1));
        var ellipsoid = testObject.ellipsoid = new DynamicEllipsoid();
        ellipsoid.radii = new MockProperty(new Cartesian3(1, 2, 3));

        var time = new JulianDate();
        expect(scene.getPrimitives().getLength()).toEqual(0);
        visualizer.update(time);
        expect(scene.getPrimitives().getLength()).toEqual(1);
        expect(scene.getPrimitives().get(0).show).toEqual(true);
        dynamicObjectCollection.clear();
        visualizer.update(time);
        expect(scene.getPrimitives().getLength()).toEqual(1);
        expect(scene.getPrimitives().get(0).show).toEqual(false);
    });

    it('Visualizer sets dynamicObject property.', function() {
        var dynamicObjectCollection = new DynamicObjectCollection();
        visualizer = new DynamicEllipsoidVisualizer(scene, dynamicObjectCollection);

        var testObject = dynamicObjectCollection.getOrCreateObject('test');
        testObject.position = new MockProperty(new Cartesian3(1234, 5678, 9101112));
        testObject.orientation = new MockProperty(new Quaternion(0, 0, 0, 1));
        var ellipsoid = testObject.ellipsoid = new DynamicEllipsoid();
        ellipsoid.radii = new MockProperty(new Cartesian3(1, 2, 3));

        var time = new JulianDate();
        visualizer.update(time);
        expect(scene.getPrimitives().get(0).dynamicObject).toEqual(testObject);
    });

    it('setDynamicObjectCollection removes old objects and add new ones.', function() {
        var dynamicObjectCollection = new DynamicObjectCollection();
        var testObject = dynamicObjectCollection.getOrCreateObject('test');
        testObject.position = new MockProperty(new Cartesian3(1234, 5678, 9101112));
        testObject.orientation = new MockProperty(new Quaternion(0, 0, 0, 1));
        var ellipsoid = testObject.ellipsoid = new DynamicEllipsoid();
        ellipsoid.radii = new MockProperty(new Cartesian3(1, 2, 3));

        var dynamicObjectCollection2 = new DynamicObjectCollection();
        var testObject2 = dynamicObjectCollection2.getOrCreateObject('test2');
        testObject2.position = new MockProperty(new Cartesian3(5678, 9101112, 1234));
        testObject2.orientation = new MockProperty(new Quaternion(1, 0, 0, 0));
        var ellipsoid2 = testObject2.ellipsoid = new DynamicEllipsoid();
        ellipsoid2.radii = new MockProperty(new Cartesian3(4, 5, 6));

        visualizer = new DynamicEllipsoidVisualizer(scene, dynamicObjectCollection);

        var time = new JulianDate();

        visualizer.update(time);
        expect(scene.getPrimitives().getLength()).toEqual(1);
        var ellipsoidPrimitive = scene.getPrimitives().get(0);
        expect(ellipsoidPrimitive.dynamicObject).toEqual(testObject);

        visualizer.setDynamicObjectCollection(dynamicObjectCollection2);
        visualizer.update(time);
        expect(scene.getPrimitives().getLength()).toEqual(1);
        ellipsoidPrimitive = scene.getPrimitives().get(0);
        expect(ellipsoidPrimitive.dynamicObject).toEqual(testObject2);
    });
});