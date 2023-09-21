import Line, { Isolation, LineConfig } from "./Line.ts";

export type BusConfig = {
    crossSection: number;
};

export default class Busbar extends Line {
    constructor(config: BusConfig) {
        super({
            length: 0,
            isolation: Isolation.NONE,
            inductance: 0,
            resistivity: 0,
            ...config
        });
    }
}
