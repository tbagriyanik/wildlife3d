export const GAME_CONSTANTS = {
    DAY_LENGTH: 2400, // Game units
    TIME_TICK_RATE: 1, // Progress per tick

    CONSUMPTION: {
        HUNGER: 0.05,
        THIRST: 0.1,
        HEALTH_DRAIN: 0.5, // per tick when starving/dehydrated
    },

    TEMPERATURE: {
        DAY: 25,
        NIGHT: 5,
        IDEAL: 37,
    },

    RESOURCES: {
        WOOD_PER_TREE: 3,
        STONE_PER_ROCK: 2,
        APPLE_PER_BUSH: 1,
    }
};
