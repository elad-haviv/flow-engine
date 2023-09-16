export default class Vertex<T> {
    public adjacencies : Array<Vertex<T>>;

    constructor(
        public data : any,
    ) {}

    addAdjacent(vertex : Vertex<T>) : void {
        this.adjacencies.push(vertex);
    }

    removeAdjacent(data : T) : Vertex<T> | null {
        const index = this.adjacencies.findIndex(vertex => vertex.data === data);
        if (index !== -1) {
            return this.adjacencies.splice(index, 1)[0];
        }
        return null;
    }
}