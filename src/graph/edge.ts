import Vertex from "./Vertex.ts";

type Edge<T1, T2> = [Vertex<T1>, Vertex<T2>];

export default Edge;