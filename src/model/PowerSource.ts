import Component from "./Component.ts";

export type PowerSourceConfig = {
    voltage: number,
    frequency: number,
    phase: number,
    power: number,
    powerFactor: number,
    efficiency: number
};

export default class PowerSource extends Component {
    declare public properties: PowerSourceConfig;
    constructor(config: PowerSourceConfig) {
        super(config);
    }
}
