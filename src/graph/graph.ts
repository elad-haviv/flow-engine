import Edge from "./Edge.ts";
import Vertex from "./Vertex.ts";

export enum GraphType {
    Unidirectional,
    Bidirectional,
}

export default class Graph<T> {
    public vertices: Map<T, Vertex<T>>;
    public type: GraphType;

    public get edges(): Array<Edge<T, T>> {
        const edges: Array<Edge<T, T>> = [];

        for (const vertex of this.vertices) {
            for (const adjacent of vertex[1].adjacencies) {
                edges.push([vertex[1], adjacent]);
            }
        }

        return edges;
    }

    constructor(type: GraphType) {
        this.vertices = new Map<T, Vertex<T>>();
        this.type = type ?? GraphType.Bidirectional;
    }

    addVertex(data: T): Vertex<T> {
        let vertex = this.vertices.get(data);
        if (vertex) {
            return vertex;
        }

        vertex = new Vertex<T>(data);
        this.vertices.set(data, vertex);

        return vertex;
    }

    removeVertex(data: T): Vertex<T> | null {
        const remove = this.vertices.get(data);
        if (remove) {
            this.vertices.forEach((vertex) =>
                vertex.removeAdjacent(remove.data)
            );
            return remove;
        }

        return null;
    }

    addEdge(source: T, target: T, bidirectional: boolean | null): void {
        const sourceVertex = this.addVertex(source);
        const targetVertex = this.addVertex(target);

        sourceVertex.addAdjacent(targetVertex);
        if (this.type === GraphType.Bidirectional || bidirectional) {
            targetVertex.addAdjacent(sourceVertex);
        }
    }

    removeEdge(source: T, target: T, bidirectional: boolean | null): void {
        const sourceVertex = this.addVertex(source);
        const targetVertex = this.addVertex(target);

        if (sourceVertex && targetVertex) {
            sourceVertex.removeAdjacent(target);
            if (this.type === GraphType.Bidirectional || bidirectional) {
                targetVertex.removeAdjacent(source);
            }
        }
    }

    breadthFirstTraversal(
        start: Vertex<T>,
        action: (vertex: Vertex<T>) => void
    ): void {
        const visited: Set<Vertex<T>> = new Set<Vertex<T>>();
        const queue: Array<Vertex<T>> = [];

        visited.add(start);
        queue.push(start);

        while (queue.length > 0) {
            const currentVertex: Vertex<T> = queue.shift()!;
            action(currentVertex);

            for (const adjacent of currentVertex.adjacencies) {
                if (!visited.has(adjacent)) {
                    visited.add(adjacent);
                    queue.push(adjacent);
                }
            }
        }
    }

    depthFirstTraversal(
        start: Vertex<T>,
        action: (vertex: Vertex<T>) => void
    ): void {
        const visited: Set<Vertex<T>> = new Set<Vertex<T>>();
        const stack: Array<Vertex<T>> = [];

        stack.push(start);

        while (stack.length > 0) {
            const currentVertex = stack.pop()!;
            if (!visited.has(currentVertex)) {
                action(currentVertex);
                visited.add(currentVertex);

                for (const adjacent of currentVertex.adjacencies) {
                    stack.push(adjacent);
                }
            }
        }
    }

    shortestPath(from: Vertex<T>, to: Vertex<T>): Array<Vertex<T>> | null {
        const visited: Set<Vertex<T>> = new Set<Vertex<T>>();
        const queue: [Vertex<T>, Vertex<T>[]][] = [];

        queue.push([from, [from]]);

        while (queue.length > 0) {
            const [currentVertex, currentPath]: [Vertex<T>, Vertex<T>[]] =
                queue.shift()!;

            if (currentVertex === to) {
                return currentPath;
            }

            visited.add(currentVertex);

            for (const adjacent of currentVertex.adjacencies) {
                if (!visited.has(adjacent)) {
                    queue.push([adjacent, [...currentPath, adjacent]]);
                }
            }
        }

        return null;
    }
}
