import erasData from '../data/eras.json'

export const ERA_COLORS: Record<string, string> = {}
export const ERA_NAMES: Record<string, string> = {}

for (const era of erasData) {
  ERA_COLORS[era.id] = era.color
  ERA_NAMES[era.id] = era.name
}
