import Busbar from "./model/Busbar.ts";
import Line, { Isolation } from "./model/Line.ts";
import Network from "./model/Network.ts";
import PowerSource from "./model/PowerSource.ts";
import Switch from "./model/Switch.ts";
import "./style.css";
import { Hz, V, deg, kW } from "./units.ts";

let grid = new Network();

let components = {
    "grid": new PowerSource({
        voltage: 400*V,
        frequency: 50*Hz,
        power: 630*kW,
        phase: 0*deg,
        powerFactor: 1,
        efficiency: 1
    }),
    "q0": new Switch({
        initialState: true
    }),
    "w0": new Busbar({
        crossSection: 400
    }),
    "q1": new Switch({
        initialState: true
    }),
    "q2": new Switch({
        initialState: true
    }),
    "w1": new Busbar({
        crossSection: 400
    }),
    "w2": new Busbar({
        crossSection: 400
    }),
}

Object.values(components).forEach(component => {
    grid.addVertex(component);
})

grid.simulate();

//          |---()---|
// o---()---|
//          |---()---|
grid.addEdge(components.grid, components.q0, true);
grid.addEdge(components.q0, components.w0, true);
grid.addEdge(components.w0, components.q1, true);
grid.addEdge(components.w0, components.q2, true);
grid.addEdge(components.q1, components.w1, true);
grid.addEdge(components.q2, components.w2, true);