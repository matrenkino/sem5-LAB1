var imagedata;
var container;
var camera, scene, renderer;
var terrainGeometry, terrainMaterial, terrainMesh, terrainTexture;
var spotlight;

init();
animate();

function init() {
    container = document.getElementById('container');
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.set(0, -1000, 900);
    camera.lookAt(new THREE.Vector3(0, 0.0, 0));

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    // Точечный источник света в позиции камеры
    spotlight = new THREE.PointLight(0xffffff);
    spotlight.position.set(1000, 1000, 1000);
    spotlight.intensity = 2;
    scene.add(spotlight);

    // Загрузка текстуры
    var textureLoader = new THREE.TextureLoader();
    terrainTexture = textureLoader.load('img/grasstile.jpg');

    // Загрузка карты высот (асинхронно)
    var img = new Image();
    img.onload = function () {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        imagedata = context.getImageData(0, 0, img.width, img.height);
        CreateTerrain(img.width, img.height, scene);
    };
    img.src = 'img/plateau.jpg';
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    renderer.render(scene, camera);
}

function CreateTerrain(width, height, scene) {
    terrainGeometry = new THREE.PlaneGeometry(1000, 1000, width - 1, height - 1);

    var positions = terrainGeometry.attributes.position.array;
    var uvs       = terrainGeometry.attributes.uv.array;

    // PlaneGeometry строит сетку в плоскости XY — обходим вершины и задаём высоту по Z
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var idx = y * width + x;
            // Высота из карты высот, нормированная в диапазон [0, 100]
            positions[idx * 3 + 2] = getPixel(imagedata, x, y) / 255 * 100;

            // Текстурные координаты: U = x/(width-1), V = y/(height-1)
            uvs[idx * 2]     = x / (width - 1);
            uvs[idx * 2 + 1] = y / (height - 1);
        }
    }

    // Сообщаем Three.js что буферы изменились
    terrainGeometry.attributes.position.needsUpdate = true;
    terrainGeometry.attributes.uv.needsUpdate = true;

    // Пересчёт нормалей для корректного освещения
    terrainGeometry.computeVertexNormals();

    // MeshLambertMaterial — модель освещения Ламберта с текстурой
    terrainMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
    terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
    scene.add(terrainMesh);
}

function getPixel(imagedata, x, y) {
    var position = (x + imagedata.width * y) * 4;
    var data = imagedata.data;
    return data[position];
}
