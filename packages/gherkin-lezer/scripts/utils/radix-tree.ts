export class RadixNode {
	edges: Map<number, RadixNode> = new Map();

	constructor(
		public leaf: number | undefined,
		public prefix: string,
	) {}

	addEdge(label: number, node: RadixNode): void {
		this.edges.set(label, node);
	}

	updateEdge(label: number, node: RadixNode) {
		if (!this.edges.has(label)) throw new Error("Replacing missing edge");
		this.edges.set(label, node);
	}

	getEdge(label: number): RadixNode | undefined {
		return this.edges.get(label);
	}
}

export class RadixTree {
	root = new RadixNode(undefined, "");
	size = 0;

	insert(s: string, v: number): number | undefined {
		let parent: RadixNode;
		let n: RadixNode = this.root;
		let search = s;
		while (true) {
			if (s.length === 0) {
				if (n.leaf) {
					const old = n.leaf;
					n.leaf = v;
					return old;
				}
				n.leaf = v;
				this.size++;
				return undefined;
			}

			parent = n;
			const nextN = n.getEdge(search.charCodeAt(0)!);
			if (!nextN) {
				parent?.addEdge(search.charCodeAt(0)!, new RadixNode(v, search));
				this.size++;
				return undefined;
			}
			n = nextN;

			// Determine longest prefix of search key on match
			const commonPrefix = longestPrefix(search, n.prefix);
			if (commonPrefix === n.prefix.length) {
				search = search.slice(commonPrefix);
				continue;
			}

			// Split the code
			this.size++;
			const child = new RadixNode(undefined, search.slice(0, commonPrefix));
			parent.updateEdge(search.charCodeAt(0)!, child);

			// Restore the existing node
			child.addEdge(n.prefix.charCodeAt(commonPrefix)!, n);
			n.prefix = n.prefix.slice(commonPrefix);

			// Create a new leaf node
			const leaf = v;

			// If the new key is a subset, add to this node
			search = search.slice(commonPrefix);
			if (search.length === 0) {
				child.leaf = leaf;
				return undefined;
			}

			// Create a new edge for the node
			child.addEdge(search.charCodeAt(0)!, new RadixNode(leaf, search));
			return undefined;
		}
	}

	get(s: string): number | undefined {
		let n: RadixNode = this.root;
		let search = s;
		while (true) {
			if (search.length === 0) {
				if (n.leaf) {
					return n.leaf;
				}
				break;
			}

			const nextN = n.getEdge(search.charCodeAt(0)!);
			if (!nextN) break;
			n = nextN;

			if (search.startsWith(n.prefix)) search = search.slice(n.prefix.length);
			else break;
		}
		return undefined;
	}
}

function longestPrefix(k1: string, k2: string): number {
	const max = Math.max(k1.length, k2.length);
	for (let i = 0; i < max; i++) if (k1[i] !== k2[i]) return i;
	return 0;
}
