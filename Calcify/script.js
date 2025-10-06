const Calculator = {
    state: {
        currentExpression: '',
        currentResult: '0',
        calculationHistory: [],
        currentDimension: 3
    },

    init() {
        this.loadHistory();
        this.updateDisplay();
        Graph.init();
        this.changeDimension(3);
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
    },

    handleKeyDown(event) {
        if (event.target.tagName === 'INPUT') return;
        event.preventDefault(); // Prevent default browser actions

        const keyMap = {
            '0': () => this.appendNumber(0),
            '1': () => this.appendNumber(1),
            '2': () => this.appendNumber(2),
            '3': () => this.appendNumber(3),
            '4': () => this.appendNumber(4),
            '5': () => this.appendNumber(5),
            '6': () => this.appendNumber(6),
            '7': () => this.appendNumber(7),
            '8': () => this.appendNumber(8),
            '9': () => this.appendNumber(9),
            '+': () => this.appendOperation('+'),
            '-': () => this.appendOperation('-'),
            '*': () => this.appendOperation('*'),
            '/': () => this.appendOperation('/'),
            '.': () => this.appendDecimal(),
            'Enter': () => this.calculate(),
            '=': () => this.calculate(),
            'Escape': () => this.clearAll(),
            'Backspace': () => this.backspace(),
            '(': () => this.appendOperation('('),
            ')': () => this.appendOperation(')'),
            '^': () => this.appendOperation('^'),
            'x': () => this.appendVariable('x'),
            'y': () => this.appendVariable('y'),
            'z': () => this.appendVariable('z'),
            't': () => this.appendVariable('t'),
            'w': () => this.appendVariable('w'),
            'p': () => this.appendOperation('pi'),
            'e': () => this.appendOperation('e')
        };

        const action = keyMap[event.key.toLowerCase()];
        if (action) action();
    },

    appendNumber(number) {
        this.state.currentExpression += number;
        this.updateDisplay();
        Graph.updateExpression(this.state.currentExpression);
    },

    appendOperation(operation) {
        this.state.currentExpression += operation;
        this.updateDisplay();
        Graph.updateExpression(this.state.currentExpression);
    },

    appendVariable(variable) {
        this.state.currentExpression += variable;
        this.updateDisplay();
        Graph.updateExpression(this.state.currentExpression);
    },

    appendDecimal() {
        const lastToken = this.state.currentExpression.split(/[^0-9.]/).pop() || '';
        if (!lastToken.includes('.')) {
            this.state.currentExpression += '.';
            this.updateDisplay();
            Graph.updateExpression(this.state.currentExpression);
        }
    },

    calculate() {
        try {
            const expression = this.state.currentExpression
                .replace(/×/g, '*')
                .replace(/π/g, 'pi')
                .replace(/√/g, 'sqrt')
                .replace(/\^/g, '**');

            const result = math.evaluate(expression);
            if (!isFinite(result)) throw new Error('Resultado no finito');
            this.state.currentResult = this.formatResult(result);
            History.add(this.state.currentExpression, this.state.currentResult);
            this.state.currentExpression = this.state.currentResult.toString();
            this.updateDisplay();
            Graph.updateExpression(this.state.currentExpression);
        } catch (error) {
            this.state.currentResult = 'Error';
            this.updateDisplay();
            setTimeout(() => {
                this.state.currentResult = '0';
                this.updateDisplay();
            }, 1500);
        }
    },

    formatResult(result) {
        if (typeof result === 'number') {
            return Number.isInteger(result) ? result : Math.round(result * 1e8) / 1e8;
        }
        return result.toString();
    },

    clearAll() {
        this.state.currentExpression = '';
        this.state.currentResult = '0';
        this.updateDisplay();
        Graph.updateExpression(this.state.currentExpression);
    },

    backspace() {
        this.state.currentExpression = this.state.currentExpression.slice(0, -1);
        this.updateDisplay();
        Graph.updateExpression(this.state.currentExpression);
    },

    updateDisplay() {
        const expressionEl = document.getElementById('expression');
        const resultEl = document.getElementById('result');
        if (expressionEl && resultEl) {
            expressionEl.textContent = this.state.currentExpression;
            resultEl.textContent = this.state.currentResult;
        }
    },

    changeDimension(dimension) {
        this.state.currentDimension = dimension;
        document.querySelectorAll('.dimension-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.getAttribute('onclick').match(/\d+/)[0]) === dimension);
        });

        const inputs = {
            zMin: document.getElementById('zMin'),
            zMax: document.getElementById('zMax'),
            paramMin: document.getElementById('paramMin'),
            paramMax: document.getElementById('paramMax'),
            graphExpression: document.getElementById('graphExpression')
        };

        if (dimension === 2) {
            inputs.zMin.style.display = 'none';
            inputs.zMax.style.display = 'none';
            inputs.paramMin.style.display = 'none';
            inputs.paramMax.style.display = 'none';
            inputs.graphExpression.value = 'sin(x)';
        } else if (dimension === 3) {
            inputs.zMin.style.display = 'inline-block';
            inputs.zMax.style.display = 'inline-block';
            inputs.paramMin.style.display = 'none';
            inputs.paramMax.style.display = 'none';
            inputs.graphExpression.value = 'x^4 + y^4 + z^4 - 1';
        } else if (dimension >= 4) {
            inputs.zMin.style.display = 'inline-block';
            inputs.zMax.style.display = 'inline-block';
            inputs.paramMin.style.display = 'inline-block';
            inputs.paramMax.style.display = 'inline-block';
            inputs.graphExpression.value = dimension === 4 ? 'sin(sqrt(x^2 + y^2 + t))' : 'sin(x * w + y * t)';
        }
        Graph.graphFunction();
    },

    loadHistory() {
        try {
            const savedHistory = localStorage.getItem('calculatorHistory');
            if (savedHistory) {
                this.state.calculationHistory = JSON.parse(savedHistory);
                History.render();
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }
};

const Graph = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    transformControls: null,
    graphObjects: [],
    addedObjects: [],
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    updateTimeout: null,

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a202c);

        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        const canvas = document.getElementById('graph-canvas');
        if (!canvas) return;
        canvas.innerHTML = '';
        canvas.appendChild(this.renderer.domElement);
        if (window.devicePixelRatio) {
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
        this.renderer.shadowMap.enabled = true;
        this.updateRendererSize();

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        this.transformControls = new THREE.TransformControls(this.camera, this.renderer.domElement);
        this.transformControls.addEventListener('dragging-changed', event => {
            this.controls.enabled = !event.value;
        });
        this.scene.add(this.transformControls);

        this.scene.add(new THREE.AxesHelper(5));
        this.scene.add(new THREE.GridHelper(10, 10));

        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 8, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.set(1024, 1024);
        this.scene.add(directionalLight);

        this.animate();
        window.addEventListener('resize', this.updateRendererSize.bind(this));
        this.renderer.domElement.addEventListener('mousedown', this.onCanvasMouseDown.bind(this));
        this.graphFunction();
    },

    updateExpression(expression) {
        const graphExpression = document.getElementById('graphExpression');
        if (graphExpression) graphExpression.value = expression;
        this.scheduleGraphUpdate();
    },

    scheduleGraphUpdate() {
        if (this.updateTimeout) clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => this.graphFunction(), 300);
    },

    validateInputs() {
        const inputs = {
            xMin: parseFloat(document.getElementById('xMin').value) || -5,
            xMax: parseFloat(document.getElementById('xMax').value) || 5,
            yMin: parseFloat(document.getElementById('yMin').value) || -5,
            yMax: parseFloat(document.getElementById('yMax').value) || 5,
            zMin: parseFloat(document.getElementById('zMin').value) || -2,
            zMax: parseFloat(document.getElementById('zMax').value) || 2,
            paramMin: parseFloat(document.getElementById('paramMin').value) || 0,
            paramMax: parseFloat(document.getElementById('paramMax').value) || 10,
            resolution: parseInt(document.getElementById('resolution').value) || 30
        };
        if (inputs.xMin >= inputs.xMax || inputs.yMin >= inputs.yMax || inputs.zMin >= inputs.zMax || inputs.paramMin >= inputs.paramMax) {
            throw new Error('Rangos inválidos');
        }
        if (inputs.resolution < 10 || inputs.resolution > 100) {
            throw new Error('Resolución debe estar entre 10 y 100');
        }
        return inputs;
    },

    graphFunction() {
        this.clearGraph();
        const expression = document.getElementById('graphExpression').value || Calculator.state.currentExpression;
        if (!expression) return;

        try {
            const inputs = this.validateInputs();
            if (Calculator.state.currentDimension === 2) {
                this.graph2DFunction(expression, inputs);
            } else if (Calculator.state.currentDimension === 3) {
                this.graph3DFunction(expression, inputs);
            } else if (Calculator.state.currentDimension === 4) {
                this.graph4DFunction(expression, inputs);
            } else if (Calculator.state.currentDimension === 5) {
                this.graph5DFunction(expression, inputs);
            }
        } catch (error) {
            console.error('Error graphing:', error);
            alert(`Error al graficar: ${error.message}`);
        }
    },

    graph2DFunction(expression, { xMin, xMax, resolution }) {
        const points = [];
        const step = (xMax - xMin) / resolution;

        for (let x = xMin; x <= xMax; x += step) {
            try {
                const y = math.evaluate(expression, { x });
                if (typeof y === 'number' && isFinite(y)) {
                    points.push(new THREE.Vector3(x, y, 0));
                }
            } catch (error) {}
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x9f7aea });
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        this.graphObjects.push(line);
    },

    graph3DFunction(expression, { xMin, xMax, yMin, yMax, zMin, zMax, resolution }) {
        const points = [];
        const colors = [];
        const xStep = (xMax - xMin) / resolution;
        const yStep = (yMax - yMin) / resolution;
        const zStep = (zMax - zMin) / resolution;

        for (let i = 0; i <= resolution; i++) {
            const x = xMin + i * xStep;
            for (let j = 0; j <= resolution; j++) {
                const y = yMin + j * yStep;
                for (let k = 0; k <= resolution; k++) {
                    const z = zMin + k * zStep;
                    try {
                        const value = math.evaluate(expression, { x, y, z });
                        if (Math.abs(value) < 0.1) {
                            points.push(new THREE.Vector3(x, y, z));
                            const t = (z - zMin) / Math.max(1e-6, zMax - zMin);
                            const c = new THREE.Color().setHSL(0.72 - 0.6 * t, 0.75, 0.55);
                            colors.push(c.r, c.g, c.b);
                        }
                    } catch (error) {}
                }
            }
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        if (colors.length === points.length * 3) {
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        }

        const material = new THREE.PointsMaterial({
            size: 0.05,
            transparent: true,
            opacity: 0.85,
            vertexColors: true
        });

        const pointsMesh = new THREE.Points(geometry, material);
        this.scene.add(pointsMesh);
        this.graphObjects.push(pointsMesh);
    },

    graph4DFunction(expression, { xMin, xMax, yMin, yMax, paramMin, paramMax, resolution }) {
        const tSteps = 5;
        const tStep = (paramMax - paramMin) / tSteps;

        for (let tIndex = 0; tIndex <= tSteps; tIndex++) {
            const t = paramMin + tIndex * tStep;
            const points = [];
            const xStep = (xMax - xMin) / resolution;
            const yStep = (yMax - yMin) / resolution;

            for (let i = 0; i <= resolution; i++) {
                const x = xMin + i * xStep;
                for (let j = 0; j <= resolution; j++) {
                    const y = yMin + j * yStep;
                    try {
                        const z = math.evaluate(expression, { x, y, t });
                        points.push(new THREE.Vector3(x, isFinite(z) ? z : 0, y));
                    } catch (error) {
                        points.push(new THREE.Vector3(x, 0, y));
                    }
                }
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.PointsMaterial({
                color: new THREE.Color().setHSL(tIndex / tSteps, 0.8, 0.5),
                size: 0.1,
                transparent: true,
                opacity: 0.7
            });

            const pointsMesh = new THREE.Points(geometry, material);
            this.scene.add(pointsMesh);
            this.graphObjects.push(pointsMesh);
        }
    },

    graph5DFunction(expression, { xMin, xMax, yMin, yMax, paramMin, paramMax, resolution }) {
        const tSteps = 3;
        const wSteps = 3;
        const tStep = (paramMax - paramMin) / tSteps;
        const wStep = (paramMax - paramMin) / wSteps;

        for (let tIndex = 0; tIndex <= tSteps; tIndex++) {
            const t = paramMin + tIndex * tStep;
            for (let wIndex = 0; wIndex <= wSteps; wIndex++) {
                const w = paramMin + wIndex * wStep;
                const points = [];
                const xStep = (xMax - xMin) / resolution;
                const yStep = (yMax - yMin) / resolution;

                for (let i = 0; i <= resolution; i++) {
                    const x = xMin + i * xStep;
                    for (let j = 0; j <= resolution; j++) {
                        const y = yMin + j * yStep;
                        try {
                            const z = math.evaluate(expression, { x, y, t, w });
                            points.push(new THREE.Vector3(x, isFinite(z) ? z : 0, y));
                        } catch (error) {
                            points.push(new THREE.Vector3(x, 0, y));
                        }
                    }
                }

                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.PointsMaterial({
                    color: new THREE.Color().setHSL(tIndex / tSteps, 0.8, 0.5),
                    size: 0.05 + (wIndex / wSteps) * 0.1,
                    transparent: true,
                    opacity: 0.6
                });

                const pointsMesh = new THREE.Points(geometry, material);
                this.scene.add(pointsMesh);
                this.graphObjects.push(pointsMesh);
            }
        }
    },

    clearGraph() {
        this.graphObjects.forEach(obj => this.scene.remove(obj));
        this.graphObjects = [];
    },

    addPrimitive(type) {
        let geometry;
        switch (type) {
            case 'cube':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(0.6, 32, 24);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(0.6, 0.2, 16, 64);
                break;
            default:
                return;
        }

        const material = new THREE.MeshStandardMaterial({ color: 0x9f7aea, roughness: 0.6, metalness: 0.1 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0.5, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.addedObjects.push(mesh);
        this.selectObject(mesh);
        this.renderObjectList();
    },

    onCanvasMouseDown(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.addedObjects, true);
        if (intersects.length > 0) {
            const mesh = intersects[0].object.isMesh ? intersects[0].object : intersects[0].object.parent;
            this.selectObject(mesh);
        }
    },

    selectObject(obj) {
        if (!obj || !obj.isMesh) return;
        this.transformControls.attach(obj);
        this.syncMaterialUI();
        this.highlightSelectedInList(obj);
    },

    setTransformMode(mode) {
        if (['translate', 'rotate', 'scale'].includes(mode)) {
            this.transformControls.setMode(mode);
        }
    },

    toggleShadows() {
        this.renderer.shadowMap.enabled = !this.renderer.shadowMap.enabled;
    },

    exportGLB() {
        try {
            const exporter = new THREE.GLTFExporter();
            const target = this.transformControls.object || this.scene;
            exporter.parse(target, result => {
                const blob = new Blob([result], { type: 'model/gltf-binary' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'calcify.glb';
                document.body.appendChild(link);
                link.click();
                URL.revokeObjectURL(link.href);
                link.remove();
            }, { binary: true });
        } catch (error) {
            alert(`Error al exportar GLB: ${error.message}`);
        }
    },

    screenshotPNG() {
        try {
            const dataURL = this.renderer.domElement.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'calcify_view.png';
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert(`Error al capturar PNG: ${error.message}`);
        }
    },

    updateRendererSize() {
        const canvas = document.getElementById('graph-canvas');
        if (!canvas || !this.renderer) return;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    },

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    },

    renderObjectList() {
        const list = document.getElementById('objectList');
        if (!list) return;
        list.innerHTML = '';
        this.addedObjects.forEach((obj, i) => {
            const row = document.createElement('div');
            row.className = 'object-item';
            row.innerHTML = `
                <span class="name">${obj.name || `Objeto ${i + 1}`}</span>
                <div class="actions">
                    <button onclick="Graph.selectObjectByIndex(${i})">Seleccionar</button>
                    <button onclick="Graph.renameObject(${i})">Renombrar</button>
                    <button onclick="Graph.deleteObject(${i})">Eliminar</button>
                </div>
            `;
            list.appendChild(row);
        });
        this.highlightSelectedInList(this.transformControls.object);
    },

    selectObjectByIndex(i) {
        const obj = this.addedObjects[i];
        if (obj) this.selectObject(obj);
    },

    renameObject(i) {
        const obj = this.addedObjects[i];
        if (!obj) return;
        const newName = prompt('Nuevo nombre', obj.name || `Objeto ${i + 1}`);
        if (newName) {
            obj.name = newName;
            this.renderObjectList();
        }
    },

    deleteObject(i) {
        const obj = this.addedObjects[i];
        if (!obj) return;
        if (this.transformControls.object === obj) this.transformControls.detach();
        if (obj.parent) obj.parent.remove(obj);
        this.addedObjects.splice(i, 1);
        this.renderObjectList();
    },

    clearAddedObjects() {
        this.addedObjects.forEach(obj => {
            if (obj.parent) obj.parent.remove(obj);
        });
        this.addedObjects = [];
        this.transformControls.detach();
        this.renderObjectList();
    },

    highlightSelectedInList(obj) {
        const list = document.getElementById('objectList');
        if (!list) return;
        Array.from(list.querySelectorAll('.object-item')).forEach((row, idx) => {
            row.style.background = this.addedObjects[idx] === obj ? 'rgba(128,90,213,0.15)' : 'transparent';
        });
    },

    syncMaterialUI() {
        const obj = this.transformControls.object;
        if (!obj || !obj.material) return;
        const mat = obj.material;
        const inputs = {
            color: document.getElementById('matColor'),
            metal: document.getElementById('matMetal'),
            rough: document.getElementById('matRough'),
            wire: document.getElementById('matWire')
        };
        if (inputs.color && mat.color) inputs.color.value = '#' + mat.color.getHexString();
        if (inputs.metal && 'metalness' in mat) inputs.metal.value = mat.metalness;
        if (inputs.rough && 'roughness' in mat) inputs.rough.value = mat.roughness;
        if (inputs.wire) inputs.wire.checked = !!mat.wireframe;
    },

    applyMaterial() {
        const obj = this.transformControls.object;
        if (!obj || !obj.material) return;
        const mat = obj.material;
        const inputs = {
            color: document.getElementById('matColor').value,
            metal: parseFloat(document.getElementById('matMetal').value),
            rough: parseFloat(document.getElementById('matRough').value),
            wire: document.getElementById('matWire').checked
        };
        if (mat.color) mat.color.set(inputs.color);
        if ('metalness' in mat) mat.metalness = inputs.metal;
        if ('roughness' in mat) mat.roughness = inputs.rough;
        mat.wireframe = inputs.wire;
        mat.needsUpdate = true;
    }
};

const History = {
    save() {
        try {
            localStorage.setItem('calculatorHistory', JSON.stringify(Calculator.state.calculationHistory));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    },

    add(expression, result) {
        Calculator.state.calculationHistory.unshift({
            expression,
            result,
            timestamp: new Date().toLocaleString()
        });
        if (Calculator.state.calculationHistory.length > 50) {
            Calculator.state.calculationHistory.pop();
        }
        this.save();
        this.render();
    },

    render() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        historyList.innerHTML = Calculator.state.calculationHistory.length === 0
            ? '<div class="history-item">No hay operaciones recientes</div>'
            : Calculator.state.calculationHistory.map(item => `
                <div class="history-item">
                    <div>
                        <div class="history-expression">${item.expression}</div>
                        <div class="history-result">= ${item.result}</div>
                        <div class="timestamp">${item.timestamp}</div>
                    </div>
                    <button class="btn number" onclick="Calculator.useHistory('${item.expression.replace(/'/g, "\\'")}')">Usar</button>
                </div>
            `).join('');
    },

    clear() {
        Calculator.state.calculationHistory = [];
        this.save();
        this.render();
    }
};

// Expose functions to global scope for HTML event handlers
window.clearAll = () => Calculator.clearAll();
window.backspace = () => Calculator.backspace();
window.appendNumber = num => Calculator.appendNumber(num);
window.appendOperation = op => Calculator.appendOperation(op);
window.appendVariable = var_ => Calculator.appendVariable(var_);
window.appendDecimal = () => Calculator.appendDecimal();
window.calculate = () => Calculator.calculate();
window.changeDimension = dim => Calculator.changeDimension(dim);
window.graphFunction = () => Graph.graphFunction();
window.addPrimitive = type => Graph.addPrimitive(type);
window.setTransformMode = mode => Graph.setTransformMode(mode);
window.toggleShadows = () => Graph.toggleShadows();
window.exportGLB = () => Graph.exportGLB();
window.screenshotPNG = () => Graph.screenshotPNG();
window.clearAddedObjects = () => Graph.clearAddedObjects();
window.clearHistory = () => History.clear();
window.useHistory = expr => {
    Calculator.state.currentExpression = expr;
    Calculator.updateDisplay();
    Graph.updateExpression(expr);
};

// Initialize on load
window.onload = () => Calculator.init();