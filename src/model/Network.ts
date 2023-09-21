import Graph, { GraphType } from "../graph/Graph.ts";
import Vertex from "../graph/Vertex.ts";
import Component from "./Component.ts";
import PowerSource from "./PowerSource.ts";

export default class Network extends Graph<Component> {
    simulate() {

    }

    constructor() {
        super(GraphType.Unidirectional);
    }

    getSources(): Vertex<PowerSource>[] {
        let sources : Vertex<PowerSource>[] = [];
        this.vertices.forEach((vertex) => {
            if (vertex.data instanceof PowerSource) sources.push(vertex);
        });
        return sources;
    }
}
