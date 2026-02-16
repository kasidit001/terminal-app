export function useGreatCircle() {
  const getArcPoints = (
    lat1: number, lng1: number,
    lat2: number, lng2: number,
    numPoints: number = 100
  ): [number, number][] => {
    const points: [number, number][] = []
    const phi1 = toRad(lat1)
    const lambda1 = toRad(lng1)
    const phi2 = toRad(lat2)
    const lambda2 = toRad(lng2)

    const d = 2 * Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((phi2 - phi1) / 2), 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.pow(Math.sin((lambda2 - lambda1) / 2), 2)
      )
    )

    if (d === 0) return [[lat1, lng1]]

    for (let i = 0; i <= numPoints; i++) {
      const f = i / numPoints
      const A = Math.sin((1 - f) * d) / Math.sin(d)
      const B = Math.sin(f * d) / Math.sin(d)
      const x = A * Math.cos(phi1) * Math.cos(lambda1) + B * Math.cos(phi2) * Math.cos(lambda2)
      const y = A * Math.cos(phi1) * Math.sin(lambda1) + B * Math.cos(phi2) * Math.sin(lambda2)
      const z = A * Math.sin(phi1) + B * Math.sin(phi2)
      const lat = Math.atan2(z, Math.sqrt(x * x + y * y))
      const lng = Math.atan2(y, x)
      points.push([toDeg(lat), toDeg(lng)])
    }

    return points
  }

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lng2 - lng1)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  return { getArcPoints, getDistance }
}

function toRad(deg: number) { return deg * (Math.PI / 180) }
function toDeg(rad: number) { return rad * (180 / Math.PI) }
