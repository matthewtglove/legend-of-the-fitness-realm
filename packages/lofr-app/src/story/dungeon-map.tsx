import { GameLocation, GameLocationId } from '@lofr/game';
import { GameStoryRuntime } from './game-story-runtime';
import { useEffect, useRef } from 'react';

export const DungeonMap = ({ storyRuntime }: { storyRuntime: GameStoryRuntime }) => {
    const dungeonMap = useRef(buildDungeonMap(storyRuntime));

    useEffect(() => {
        dungeonMap.current = buildDungeonMap(storyRuntime);
    }, [storyRuntime, storyRuntime.gameRuntime.state.locations.length]);

    const s = 1;
    const bounds = dungeonMap.current.bounds;

    const l = (bounds.l - 2) * s;
    const t = (bounds.t - 2) * s;
    const w = (bounds.r - bounds.l + 5) * s;
    const h = (bounds.b - bounds.t + 5) * s;

    const wallSize = 0.1;
    const connectionSize = 0.02;
    const fontSize = 0.15;
    return (
        <div className="flex flex-col gap-2">
            <h1>Dungeon Map</h1>
            <svg
                viewBox={`${l} ${t} ${w} ${h}`}
                // className="max-h-[100vh]"
            >
                <rect x={l} y={t} width={w} height={h} fill="#eeeeee" />
                <g
                //transform={`translate(${w / 2},${h / 2})`}
                >
                    {Array.from(dungeonMap.current.grid.entries()).map(([gridPositionKey, locationId]) => {
                        const location = storyRuntime.gameRuntime.state.locations.find((x) => x.id === locationId);
                        const isPlayerLocation = storyRuntime.gameRuntime.state.players.some(
                            (p) => p.location === locationId,
                        );
                        const hasEnemies = storyRuntime.gameRuntime.state.characters.some(
                            (c) => c.location === locationId && c.role.alignment === `enemy` && !c.isDefeated,
                        );
                        const hasKeyItem = !!location?.keyItem;
                        const gridPosition = dungeonMap.current.locationLookup.get(locationId) ?? [0, 0];
                        return (
                            <>
                                <rect
                                    key={gridPositionKey}
                                    x={gridPosition[0] * s}
                                    y={gridPosition[1] * s}
                                    width={s}
                                    height={s}
                                    fill={isPlayerLocation ? `#aaaaff` : location?.isDiscovered ? `#aaffaa` : `#333333`}
                                    stroke="black"
                                    strokeWidth={wallSize}
                                >
                                    <title>{locationId}</title>
                                </rect>

                                {location?.connections.map((connection) => {
                                    const dest = dungeonMap.current.locationLookup.get(connection.location);
                                    if (!dest) {
                                        return null;
                                    }

                                    return (
                                        <line
                                            key={`${locationId}=>${connection.location}`}
                                            x1={gridPosition[0] * s + s / 2}
                                            y1={gridPosition[1] * s + s / 2}
                                            x2={(dest[0] + 0.5) * s}
                                            y2={(dest[1] + 0.5) * s}
                                            stroke="#880000ff"
                                            strokeWidth={connectionSize}
                                            // transform={`translate(${s * 0.4 - wallSize},${s * 0.4 - wallSize})`}
                                        />
                                    );
                                })}
                                <text
                                    x={(gridPosition[0] + wallSize) * s}
                                    y={(gridPosition[1] + wallSize - fontSize) * s}
                                    fontSize={fontSize}
                                    // anchor svg text to top left
                                    dominantBaseline="hanging"
                                    textAnchor="start"
                                    // svg whitespace handling
                                    className="whitespace-pre"
                                >
                                    {`${hasEnemies ? `⚔` : ``}${hasKeyItem ? `🔑` : ``}${locationId}`
                                        .replace(`location-`, ``)
                                        .replace(/-/g, ` `)
                                        .split(` `)
                                        .filter((x) => x)
                                        .map((word, i) => (
                                            <tspan key={i} x={(gridPosition[0] + wallSize) * s} dy={fontSize * s}>
                                                {word}
                                            </tspan>
                                        ))}
                                </text>
                            </>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};

const buildDungeonMap = (storyRuntime: GameStoryRuntime) => {
    const locations = storyRuntime.gameRuntime.state.locations;

    const map: DungeonMapSet = {
        grid: new Map(),
        locationLookup: new Map(),
        bounds: {
            l: 0,
            r: 0,
            t: 0,
            b: 0,
        },
    };

    const visited = new Set<GameLocationId>();
    const placeLocationInGridRecursive = (location: GameLocation, parentGridPosition: GridPosition) => {
        if (visited.has(location.id)) {
            return;
        }
        visited.add(location.id);

        // search for empty space in grid
        const emptyGridPosition = findEmptyGridPosition(map, parentGridPosition, 5);
        if (!emptyGridPosition) {
            // create new layer?
            console.error(`DungeonMap: No empty space found for location`, { location });
            return;
        }

        // place location in grid
        const gridPositionKey: GridPositionKey = `${emptyGridPosition[0]},${emptyGridPosition[1]}`;
        map.grid.set(gridPositionKey, location.id);
        map.locationLookup.set(location.id, emptyGridPosition);

        // place connected locations
        for (const connection of location.connections) {
            const connectedLocation = locations.find((x) => x.id === connection.location);
            if (!connectedLocation) {
                console.error(`DungeonMap: Connected location not found`, { connectedLocationId: connection.location });
                continue;
            }
            placeLocationInGridRecursive(connectedLocation, emptyGridPosition);
        }
    };

    for (const location of locations) {
        placeLocationInGridRecursive(location, [0, 0]);
    }

    // calculate bounds
    for (const gridPosition of map.locationLookup.values()) {
        const [x, y] = gridPosition;
        map.bounds.l = Math.min(map.bounds.l, x);
        map.bounds.r = Math.max(map.bounds.r, x);
        map.bounds.t = Math.min(map.bounds.t, y);
        map.bounds.b = Math.max(map.bounds.b, y);
    }

    return map;
};

type GridPosition = [number, number];
type GridPositionKey = `${number},${number}`;
type DungeonMapSet = {
    grid: Map<GridPositionKey, GameLocationId>;
    locationLookup: Map<GameLocationId, GridPosition>;
    bounds: {
        l: number;
        r: number;
        t: number;
        b: number;
    };
};

const findEmptyGridPosition = (
    map: DungeonMapSet,
    startPosition: GridPosition,
    /** x+y distance from startPosition (diamond shape) */
    maxDistance = 2,
) => {
    for (let r = 0; r < maxDistance; r++) {
        // search leftmost and rightmost first
        for (let xDelta = r; xDelta >= 0; xDelta--) {
            const x1 = startPosition[0] + xDelta;
            const y1 = startPosition[1] + r - xDelta;
            const x2 = startPosition[0] - xDelta;
            const y2 = startPosition[1] - r + xDelta;

            if (map.grid.get(`${x1},${y1}`) === undefined) {
                return [x1, y1] as GridPosition;
            }
            if (map.grid.get(`${x1},${y2}`) === undefined) {
                return [x1, y2] as GridPosition;
            }
            if (map.grid.get(`${x2},${y1}`) === undefined) {
                return [x2, y1] as GridPosition;
            }
            if (map.grid.get(`${x2},${y2}`) === undefined) {
                return [x2, y2] as GridPosition;
            }
        }
    }
};
