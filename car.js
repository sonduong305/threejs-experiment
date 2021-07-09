// var container = document.querySelector('body'),
//     w = container.clientWidth,
//     h = container.clientHeight,
//     scene = new THREE.Scene(),
//     camera = new THREE.PerspectiveCamera(75, w / h, 0.001, 100),
//     renderConfig = { antialias: true, alpha: true },
//     renderer = new THREE.WebGLRenderer(renderConfig);
// camera.position.set(-5, 7, -10);
// camera.lookAt(0, 0, 0);
// renderer.setPixelRatio(window.devicePixelRatio);
// renderer.setSize(w, h);
// container.appendChild(renderer.domElement);

// window.addEventListener('resize', function () {
//     w = container.clientWidth;
//     h = container.clientHeight;
//     camera.aspect = w / h;
//     camera.updateProjectionMatrix();
//     renderer.setSize(w, h);
// })

// var geometry = new THREE.PlaneGeometry(10, 10, 10);
// var material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
// var plane = new THREE.Mesh(geometry, material);
// plane.rotation.x = Math.PI / 2;
// scene.add(plane);

// var sunlight = new THREE.DirectionalLight(0xffffff, 1.0);
// sunlight.position.set(-10, 10, 0);
// scene.add(sunlight)


function add_car(scene, plane) {

    /**
    * Physics
    **/

    var world = new CANNON.World();
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.gravity.set(0, -10, 0);
    world.defaultContactMaterial.friction = 0;

    var groundMaterial = new CANNON.Material('groundMaterial');
    var wheelMaterial = new CANNON.Material('wheelMaterial');
    var wheelGroundContactMaterial = new CANNON.ContactMaterial(wheelMaterial, groundMaterial, {
        friction: 0.3,
        restitution: 0,
        contactEquationStiffness: 1000,
    });

    world.addContactMaterial(wheelGroundContactMaterial);
    var offset_x = 0.1;

    // car physics body
    var chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.3, 2));
    var chassisBody = new CANNON.Body({ mass: 150 });
    chassisBody.addShape(chassisShape);
    chassisBody.position.set(0, 0.2, 0);
    chassisBody.angularVelocity.set(0, 0, 0); // initial velocity

    // car visual body
    // var geometry = new THREE.BoxGeometry(2, 0.6, 4); // double chasis shape
    // var material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
    // var box = new THREE.Mesh(geometry, material);
    // box.scale.set(10, 10, 10);
    // scene.add(box);

    // parent vehicle object
    var vehicle = new CANNON.RaycastVehicle({
        chassisBody: chassisBody,
        indexRightAxis: 0, // x
        indexUpAxis: 1, // y
        indexForwardAxis: 2, // z
    });

    // wheel options
    var options = {
        radius: 0.4,
        directionLocal: new CANNON.Vec3(0, -1, 0),
        suspensionStiffness: 45,
        suspensionRestLength: 0.4,
        frictionSlip: 5,
        dampingRelaxation: 2.3,
        dampingCompression: 4.5,
        maxSuspensionForce: 200000,
        rollInfluence: 0.01,
        axleLocal: new CANNON.Vec3(-1, 0, 0),
        chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
        maxSuspensionTravel: 0.25,
        customSlidingRotationalSpeed: -30,
        useCustomSlidingRotationalSpeed: true,
    };

    var axlewidth = 0.9;
    var axlelong = 1.84;
    var offset_long = -0.2;
    var offset_y = 0;
    options.chassisConnectionPointLocal.set(axlewidth + offset_x, 0 + offset_y, -1 * axlelong + offset_long);
    vehicle.addWheel(options);

    options.chassisConnectionPointLocal.set(-axlewidth + offset_x, 0 + offset_y, -1 * axlelong + offset_long);
    vehicle.addWheel(options);

    options.chassisConnectionPointLocal.set(axlewidth + offset_x, 0 + offset_y, 1 * axlelong + offset_long);
    vehicle.addWheel(options);

    options.chassisConnectionPointLocal.set(-axlewidth + offset_x, 0 + offset_y, 1 * axlelong + offset_long);
    vehicle.addWheel(options);

    vehicle.addToWorld(world);

    // car wheels
    var wheelBodies = [],
        wheelVisuals = [];
    vehicle.wheelInfos.forEach(function (wheel) {
        var shape = new CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 20);
        var body = new CANNON.Body({ mass: 1, material: wheelMaterial });
        var q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
        body.addShape(shape, new CANNON.Vec3(), q);
        wheelBodies.push(body);
        // wheel visual body
        // let loader = new THREE.GLTFLoader();
        // loader.load('./assets/pickup/wheel/Wheel.gltf', function (gltf) {
        //     var wheel_v = gltf.scene;
        //     wheel_v.scale.set(50, 50, 50);
        //     var bbox = new THREE.Box3().setFromObject(wheel_v);
        //     console.log(bbox.max.x - bbox.min.x)
        //     console.log(bbox.max.y - bbox.min.y)
        //     console.log(bbox.max.z - bbox.min.z)
        //     // wheel_v.position.y = 1;
        //     // wheel_v.position.x = 3;
        //     // wheel_v.rotateY(Math.PI * 0.17)
        //     gltf.scene.traverse(function (node) {
        //         if (node.isMesh) {
        //             node.castShadow = true;
        //             node.receiveShadow = true;
        //         }

        //     });
        //     wheelVisuals.push(wheel_v);
        //     scene.add(gltf.scene);
        // });
        var geometry = new THREE.CylinderGeometry(wheel.radius, wheel.radius, 0.4, 32);
        var material = new THREE.MeshPhongMaterial({
            color: 0xd0901d,
            emissive: 0xaa0000,
            flatShading: true,
            opacity: 1,
            side: THREE.DoubleSide,
        });
        var cylinder = new THREE.Mesh(geometry, material);
        cylinder.geometry.rotateZ(Math.PI / 2);
        wheelVisuals.push(cylinder);
        scene.add(cylinder);
    });

    // update the wheels to match the physics
    world.addEventListener('postStep', function () {
        for (var i = 0; i < vehicle.wheelInfos.length; i++) {
            vehicle.updateWheelTransform(i);
            var t = vehicle.wheelInfos[i].worldTransform;
            // update wheel physics
            wheelBodies[i].position.copy(t.position);
            wheelBodies[i].position.x = t.position.x - 0.3;
            wheelBodies[i].quaternion.copy(t.quaternion);
            // update wheel visuals
            wheelVisuals[i].position.copy(t.position);
            wheelVisuals[i].position.x = t.position.x - 0.3;
            wheelVisuals[i].quaternion.copy(t.quaternion);
        }
    });

    var q = plane.quaternion;
    var planeBody = new CANNON.Body({
        mass: 0, // mass = 0 makes the body static
        material: groundMaterial,
        shape: new CANNON.Plane(),
        quaternion: new CANNON.Quaternion(-q._x, q._y, q._z, q._w)
    });
    world.add(planeBody)

    return { world, vehicle, chassisBody }
}

// const { world, box, vehicle, chassisBody } = add_car(scene, plane, camera, renderer)

/**
* Main
**/

// function updatePhysics() {
//     world.step(1 / 60);
//     // update the chassis position
//     box.position.copy(chassisBody.position);
//     box.quaternion.copy(chassisBody.quaternion);
// }

// function render() {
//     requestAnimationFrame(render);
//     // camera.lookAt(box);
//     renderer.render(scene, camera);
//     updatePhysics();
// }

// function navigate(e) {
//     if (e.type != 'keydown' && e.type != 'keyup') return;
//     var keyup = e.type == 'keyup';
//     vehicle.setBrake(0, 0);
//     vehicle.setBrake(0, 1);
//     vehicle.setBrake(0, 2);
//     vehicle.setBrake(0, 3);

//     var engineForce = 800,
//         maxSteerVal = 0.3;
//     switch (e.keyCode) {

//         case 38: // forward
//             vehicle.applyEngineForce(keyup ? 0 : -engineForce, 2);
//             vehicle.applyEngineForce(keyup ? 0 : -engineForce, 3);
//             break;

//         case 40: // backward
//             vehicle.applyEngineForce(keyup ? 0 : engineForce, 2);
//             vehicle.applyEngineForce(keyup ? 0 : engineForce, 3);
//             break;

//         case 39: // right
//             vehicle.setSteeringValue(keyup ? 0 : -maxSteerVal, 2);
//             vehicle.setSteeringValue(keyup ? 0 : -maxSteerVal, 3);
//             break;

//         case 37: // left
//             vehicle.setSteeringValue(keyup ? 0 : maxSteerVal, 2);
//             vehicle.setSteeringValue(keyup ? 0 : maxSteerVal, 3);
//             break;
//     }
// }

// window.addEventListener('keydown', navigate)
// window.addEventListener('keyup', navigate)

export { add_car }
// render();
