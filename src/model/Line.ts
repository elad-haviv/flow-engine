import Component from "./Component.ts";

export enum Isolation {
    NONE,
    PVC,
    XLPE
}

export type LineConfig = {
    length: number,
    crossSection: number,
    resistivity: number,
    inductance: number,
    isolation: Isolation
};

export default class Line extends Component {
    constructor(config: LineConfig) {
        super(config);
    }
}