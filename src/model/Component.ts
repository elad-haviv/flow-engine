import PowerSource from "./PowerSource";

export enum ComponentPowerState {
    Off,
    On,
    Fault
}

export interface BaseComponentState {
    state: ComponentPowerState,
}

export default abstract class Component extends EventTarget {

    private _state: any;
    public properties: Object;

    public get state(): any {
        return this._state;
    }

    public set state(_value: {}) {
        throw new Error("Cannot set Component's state directly.");
    }

    constructor(config: Object) {
        super();
        this.properties = config;
    }

    public setState(update: any | ((previous: any) => void)) {
        this._state = update;
    }

    public convertSignal(signal : Signal) : Signal {
        return signal;
    }
}
