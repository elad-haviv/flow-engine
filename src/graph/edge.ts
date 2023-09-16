import Vertex from "./vertex.ts";

type Edge<T1, T2> = [Vertex<T1>, Vertex<T2>];

export default Edge;