export default class Vertex<T> {
    public adjacencies: Array<Vertex<T>>;

    constructor(public data: T) {
        this.adjacencies = [];
    }

    addAdjacent(vertex: Vertex<T> | T): void {
        if (vertex instanceof Vertex) {
            this.adjacencies.push(vertex);
        } else {
            this.adjacencies.push(new Vertex<T>(vertex));
        }
    }

    removeAdjacent(vertex: Vertex<T> | T): Vertex<T> | null {
        const index = this.adjacencies.findIndex((v) =>
            vertex instanceof Vertex ? v === vertex : v.data === vertex
        );

        if (index !== -1) {
            return this.adjacencies.splice(index, 1)[0];
        }
        return null;
    }

    updateAdjacent(updateChain : Vertex<T>[], manipulation : (vertex : Vertex<T>) => void) : void {
        if (updateChain.includes(this)) {
            return;
        }

        manipulation(this);
        this.onUpdate(updateChain);
        updateChain = [...updateChain, this];

        this.adjacencies.forEach(adjacent => {
            adjacent.updateAdjacent(updateChain, manipulation);
        });
    }

    onUpdate(_updateChain : Vertex<T>[]) : void {
        return;
    }
}
