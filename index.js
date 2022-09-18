const RENDERING_MODES = {
    SHADED: 0,
    SOLID: 1,
    WIREFRAME: 2,
}
const LIGHT_DIRECTION = { x: 1, y: -1, z: -1 }
const COLORS = {
    BLACK: [0, 0, 30],
    WHITE: [255, 255, 255],
    BLUE: [0, 0, 225],
}
const DIRECTIONS = {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3,
}
const MIN_Z_POSITION = 3
const MAX_Z_POSITION = 8

let renderingMode = RENDERING_MODES.SHADED
let screenWidth = 0
let screenHeight = 0
let center = { x: 0, y: 0 }
let shouldRotate = true
let rotationDirection = DIRECTIONS.RIGHT
let drawableTriangleIndex = -1
let drawableTriangles = []

const canvas = document.querySelector('canvas')
const context = canvas.getContext('2d')
const vertices = [
    { x:-1, y:-1, z:-1 },
    { x:-1, y: 1, z:-1 },
    { x: 1, y: 1, z:-1 },
    { x: 1, y:-1, z:-1 },
    { x:-1, y:-1, z: 1 },
    { x:-1, y: 1, z: 1 },
    { x: 1, y: 1, z: 1 },
    { x: 1, y:-1, z: 1 },
]
const verticesCopy = []
const cube = {
    triangles: [
        { vertices: [0, 1, 2], color: COLORS.WHITE },
        { vertices: [0, 2, 3], color: COLORS.WHITE },
        { vertices: [3, 2, 6], color: COLORS.WHITE },
        { vertices: [3, 6, 7], color: COLORS.WHITE },
        { vertices: [1, 5, 6], color: COLORS.WHITE },
        { vertices: [1, 6, 2], color: COLORS.WHITE },
        { vertices: [4, 5, 1], color: COLORS.WHITE },
        { vertices: [4, 1, 0], color: COLORS.WHITE },
        { vertices: [4, 0, 3], color: COLORS.WHITE },
        { vertices: [4, 3, 7], color: COLORS.WHITE },
        { vertices: [7, 6, 5], color: COLORS.WHITE },
        { vertices: [7, 5, 4], color: COLORS.WHITE },
    ],
    position: { x: 0, y: 0, z: 5 },
    rotation: { x: 0, y: 0, z: 0 },
}
const camera = { x: 0, y: 0, z: 0 }
const fieldOfView = 60
const clippingPlanes = {
    near: 1,
    far: 100,
}

const startGame = () => {
    setCanvasSize()
    animate()
}

const setCanvasSize = () => {
    // Get the no. of physical pixels on the device per CSS pixel
    const devicePixelRatio = Math.ceil(window.devicePixelRatio)

    // Get screen dimensions in CSS pixels
    screenWidth = window.innerWidth
    screenHeight = window.innerHeight

    // Set canvas dimensions in physical pixels
    canvas.width = screenWidth * devicePixelRatio
    canvas.height = screenHeight * devicePixelRatio

    // Set the canvas CSS dimensions in "CSS pixels"
    canvas.style.width = `${screenWidth}px`
    canvas.style.height = `${screenHeight}px`
    canvas.getContext('2d').scale(devicePixelRatio, devicePixelRatio)
    
    // Get center of screen
    center.x = screenWidth / 2
    center.y = screenHeight / 2
}

const convertToRadians = angle => angle * Math.PI / 180

const normalize = vector => {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z) 
    vector.x /= length
    vector.y /= length
    vector.z /= length
    return vector
}

const rotateVertex = (vertex, rotation) => {
    switch (rotationDirection) {
        case DIRECTIONS.LEFT:
        case DIRECTIONS.RIGHT:
            return {
                x: vertex.x * Math.cos(convertToRadians(rotation.y)) - vertex.z * Math.sin(convertToRadians(rotation.y)),
                y: vertex.y,
                z: vertex.x * Math.sin(convertToRadians(rotation.y)) + vertex.z * Math.cos(convertToRadians(rotation.y)),
            }
        case DIRECTIONS.UP:
        case DIRECTIONS.DOWN:
            return {
                x: vertex.x,
                y: vertex.y * Math.cos(convertToRadians(rotation.x)) + vertex.z * Math.sin(convertToRadians(rotation.x)),
                z: -vertex.y * Math.sin(convertToRadians(rotation.x)) + vertex.z * Math.cos(convertToRadians(rotation.x)),
            }
        default:
            return vertex
    }
}

const translateVertex = (vertex, translation) => {
    return {
        x: vertex.x + translation.x,
        y: vertex.y + translation.y,
        z: vertex.z + translation.z,
    }
}

const getNormal = translatedVertices => {
    const normal = { x: 0, y: 0, z: 0 }
    const line1 = { x: 0, y: 0, z: 0 }
    const line2 = { x: 0, y: 0, z: 0 }

    line1.x = translatedVertices[1].x - translatedVertices[0].x
    line1.y = translatedVertices[1].y - translatedVertices[0].y
    line1.z = translatedVertices[1].z - translatedVertices[0].z

    line2.x = translatedVertices[2].x - translatedVertices[0].x
    line2.y = translatedVertices[2].y - translatedVertices[0].y
    line2.z = translatedVertices[2].z - translatedVertices[0].z

    normal.x = (line1.y * line2.z) - (line1.z * line2.y)
    normal.y = (line1.z * line2.x) - (line1.x * line2.z)
    normal.z = (line1.x * line2.y) - (line1.y * line2.x)

    return normalize(normal)
}

const getDotProduct = (vectorA, vectorB) => {
    return (vectorA.x * vectorB.x) + (vectorA.y * vectorB.y) + (vectorA.z * vectorB.z)
}

const getRGBByWeight = (color1, color2, weight) => {
    weight = weight * 2 - 1
    const color1Weight = (weight/1 + 1) / 2
    const color2Weight = 1 - color1Weight
    const rgb = [
        Math.round(color1[0] * color1Weight + color2[0] * color2Weight),
        Math.round(color1[1] * color1Weight + color2[1] * color2Weight),
        Math.round(color1[2] * color1Weight + color2[2] * color2Weight)
    ]
    return rgb
}

const getColor = dotProductOfTriangleAndLight => {
    return getRGBByWeight(COLORS.BLACK, COLORS.BLUE, dotProductOfTriangleAndLight)
}

const projectVertex = vertex => {
    return {
        x: vertex.x / vertex.z / Math.tan(convertToRadians(fieldOfView / 2)),
        y: vertex.y / vertex.z / Math.tan(convertToRadians(fieldOfView / 2)),
        z: vertex.z * (clippingPlanes.near + clippingPlanes.far) + vertex.z * (-clippingPlanes.far * clippingPlanes.near),
    }
}

const scaleVertex = vertex => {
    smallestDimension = Math.min(screenWidth, screenHeight)
    const x = center.x + (vertex.x * smallestDimension / 2)
    const y = center.y + (-vertex.y * smallestDimension / 2)

    return {
        x: x,
        y: y,
        // z not used
    }
}

/*
 * Apply rotation, translation, hidden surface removal,
 * shading, perspective & scaling to each triangle
 */
const getDrawableTriangles = cube => {
    let triangles = []
    let color = ''
    cube.triangles.forEach(triangle => {
        rotatedVertices = []
        translatedVertices = []
        projectedVertices = []
        scaledVertices = []

        // Rotate
        triangle.vertices.forEach(vertexIndex => {
            const rotatedVertex = rotateVertex(vertices[vertexIndex], cube.rotation)
            rotatedVertices.push(rotatedVertex)
            verticesCopy[vertexIndex] = rotatedVertex
        })

        // Translate
        rotatedVertices.forEach(vertex => {
            translatedVertices.push(translateVertex(vertex, cube.position))
        })

        // Get normal
        const normal = getNormal(translatedVertices)

        const lineFromCameraToTriangle = {
            x: translatedVertices[0].x - camera.x,
            y: translatedVertices[0].y - camera.y,
            z: translatedVertices[0].z - camera.z,
        }

        // Hidden surface removal
        if (renderingMode !== RENDERING_MODES.WIREFRAME) {
            // Get dot product of triangle normal & camera direction
            const dotProduct = getDotProduct(normal, lineFromCameraToTriangle)
            // Don't draw triangles which are facing away from the camera
            if (dotProduct > 0) return
        }

        // Shading
        if (renderingMode === RENDERING_MODES.SHADED) {
            const normalizedLightDirection = normalize(LIGHT_DIRECTION)
            const dotProductOfTriangleAndLight = getDotProduct(normal, normalizedLightDirection)
            color = getColor(dotProductOfTriangleAndLight)
        } else {
            color = COLORS.WHITE
        }

        // Perspective project
        translatedVertices.forEach(vertex => {
            projectedVertices.push(projectVertex(vertex))
        })

        // Scale
        projectedVertices.forEach(vertex => {
            scaledVertices.push(scaleVertex(vertex))
        })

        triangles.push({ vertices: scaledVertices, color: color })
    })

    return triangles
}

const drawTriangle = triangle => {
    context.strokeStyle = `rgb(${triangle.color[0]}, ${triangle.color[1]}, ${triangle.color[2]})`
    context.fillStyle = `rgb(${triangle.color[0]}, ${triangle.color[1]}, ${triangle.color[2]})`
    switch (renderingMode) {
        case RENDERING_MODES.SHADED:
            context.beginPath()
            context.moveTo(triangle.vertices[0].x, triangle.vertices[0].y)
            context.lineTo(triangle.vertices[1].x, triangle.vertices[1].y)
            context.lineTo(triangle.vertices[2].x, triangle.vertices[2].y)
            context.closePath()
            context.lineWidth = 0.5
            context.stroke()
            context.fill()
            break
        case RENDERING_MODES.SOLID:
        case RENDERING_MODES.WIREFRAME:
            context.lineWidth = 3
            const lines = [
                { start: triangle.vertices[0], end: triangle.vertices[1] },
                { start: triangle.vertices[1], end: triangle.vertices[2] },
                { start: triangle.vertices[2], end: triangle.vertices[0] },
            ]
            lines.forEach(line => {
                context.beginPath()
                context.moveTo(line.start.x, line.start.y)
                context.lineTo(line.end.x, line.end.y)
                context.closePath()
                context.stroke()
            })
            break
    }
}

const animate = () => {
    drawableTriangles = getDrawableTriangles(cube)
    if (drawableTriangleIndex >= 0) {
        if (drawableTriangleIndex >= drawableTriangles.length) {
            drawableTriangleIndex = 0
        }
        drawTriangle(drawableTriangles[drawableTriangleIndex])
    }
    else {
        // Clear screen
        context.clearRect(0, 0, canvas.width, canvas.height)
    
        // Spin the cube
        if (shouldRotate) {
            switch (rotationDirection) {
                case DIRECTIONS.LEFT:
                    cube.rotation.y -= 1
                    break
                case DIRECTIONS.RIGHT:
                    cube.rotation.y += 1
                    break
                case DIRECTIONS.UP:
                    cube.rotation.x -= 1
                    break
                case DIRECTIONS.DOWN:
                    cube.rotation.x += 1
                    break
            }
        }
    
        // Draw each triangle
        drawableTriangles.forEach(triangle => { drawTriangle(triangle) })
    }

    // Go to the next frame
    requestAnimationFrame(animate)
}

const onKeyDown = event => {
    switch (event.key) {
        case ' ':
            if (drawableTriangleIndex !== -1) {
                drawableTriangleIndex = -1
                shouldRotate = true
            } else {
                shouldRotate = !shouldRotate
            }
            break
        case 'ArrowLeft':
            applyRotation()
            rotationDirection = DIRECTIONS.LEFT
            shouldRotate = true
            break
        case 'ArrowRight':
            applyRotation()
            rotationDirection = DIRECTIONS.RIGHT
            shouldRotate = true
            break
        case 'ArrowUp':
            applyRotation()
            rotationDirection = DIRECTIONS.UP
            shouldRotate = true
            break
        case 'ArrowDown':
            applyRotation()
            rotationDirection = DIRECTIONS.DOWN
            shouldRotate = true
            break
        case 'w':
            if (cube.position.z <= MIN_Z_POSITION) return
            cube.position.z -= 1
            context.clearRect(0, 0, canvas.width, canvas.height)
            break
        case 's':
            if (cube.position.z >= MAX_Z_POSITION) return
            cube.position.z += 1
            context.clearRect(0, 0, canvas.width, canvas.height)
            break
        case 'z':
            switch (renderingMode) {
                case RENDERING_MODES.SHADED:
                    renderingMode = RENDERING_MODES.SOLID
                    break
                case RENDERING_MODES.SOLID:
                    renderingMode = RENDERING_MODES.WIREFRAME
                    break
                case RENDERING_MODES.WIREFRAME:
                    renderingMode = RENDERING_MODES.SHADED
                    break
            }
            context.clearRect(0, 0, canvas.width, canvas.height)
            if (drawableTriangleIndex !== -1) {
                drawableTriangleIndex = 0
            }
            break
        case 't':
            drawableTriangleIndex++
            if (drawableTriangleIndex === drawableTriangles.length) {
                drawableTriangleIndex = 0
            }
            if (drawableTriangleIndex === 0) {
                context.clearRect(0, 0, canvas.width, canvas.height)
    
                // Spin the cube
                if (shouldRotate) {
                    switch (rotationDirection) {
                        case DIRECTIONS.LEFT:
                            cube.rotation.y -= 1
                            break
                        case DIRECTIONS.RIGHT:
                            cube.rotation.y += 1
                            break
                        case DIRECTIONS.UP:
                            cube.rotation.x -= 1
                            break
                        case DIRECTIONS.DOWN:
                            cube.rotation.x += 1
                            break
                    }
                }
            }
            break
    }
}

const applyRotation = () => {
    for (let i = 0; i < verticesCopy.length; i++) {
        vertices[i] = verticesCopy[i]
    }
    cube.rotation = { x: 0, y: 0, z: 0 }
}

/* EVENT LISTENERS */
window.addEventListener('resize', setCanvasSize)
window.addEventListener('orientationchange', setCanvasSize)
window.addEventListener('keydown', onKeyDown)

startGame()