import PowerSource from "../model/PowerSource";

export default class Voltage {
    constructor(
        public source: PowerSource,
        public magnitude: number,
        public phase: number,
        public frequency: number,
        public fault: boolean
    ) {  }

    public get Vr() {
        return this.magnitude * Math.cos(this.phase);
    }

    public get Vx() {
        return this.magnitude * Math.sin(this.phase);
    }

    public get dU() {
        return this.magnitude / this.source.properties.voltage;
    }
}