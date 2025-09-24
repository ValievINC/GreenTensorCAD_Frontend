import { primitives, booleans, transforms } from '@jscad/modeling'

const { sphere, cuboid } = primitives
const { subtract, intersect } = booleans
const { translate, rotate } = transforms

export const generateMultiLayerSphere = (layers, slicePosition = 0, sliceEnabled = true) => {
    const result = []

    const halfSpace = translate([0, 20, 0],
        cuboid({ size: [40, 40, 40] })
    )

    const rotatedHalfSpace = rotate([0, 0, slicePosition], halfSpace)

    layers.filter(layer => layer.visible).forEach((layer) => {
        let sphereLayer

        if (layer.thickness > 0) {
            // Полый слой
            const outer = sphere({ radius: layer.outerRadius, segments: 64 })
            const inner = sphere({ radius: layer.outerRadius - layer.thickness, segments: 64 })
            sphereLayer = subtract(outer, inner)
        } else {
            // Сплошной слой
            sphereLayer = sphere({ radius: layer.outerRadius, segments: 64 })
        }

        // Применяем срез если включен
        const finalGeometry = sliceEnabled
            ? intersect(sphereLayer, rotatedHalfSpace)
            : sphereLayer

        result.push(finalGeometry)
    })

    return result
}