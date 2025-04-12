import { decodeVarbytePrintable } from "varbyte-printable";

export interface LiteTrieDto {
	prefixRaw: Uint16Array;
	prefixIdxs: Uint16Array;
	valueP1s: Uint8Array;
	edgeIdxP1s: Uint8Array;
	gotoIdxs: Uint8Array;
}

export type LiteTrieCompact = [
	prefixRaw: string,
	prefixIdxs: string,
	valueP1s: string,
	edgeIdxP1s: string,
	gotoIdxs: string,
];

export class LiteTrie {
	readonly prefixRaw: Uint16Array;
	readonly prefixIdxs: Uint16Array;
	readonly valueP1s: Uint8Array;
	readonly edgeIdxP1s: Uint8Array;
	readonly edgeMaps: Map<number, number>[];

	static fromLiteTrieCompact([
		prefixRaw,
		prefixIdxs,
		valueP1s,
		edgeIdxP1s,
		gotoIdxs,
	]: LiteTrieCompact): LiteTrie {
		return new LiteTrie({
			prefixRaw: decodeVarbytePrintable(Uint16Array, prefixRaw),
			prefixIdxs: decodeVarbytePrintable(Uint16Array, prefixIdxs),
			valueP1s: decodeVarbytePrintable(Uint8Array, valueP1s),
			edgeIdxP1s: decodeVarbytePrintable(Uint8Array, edgeIdxP1s),
			gotoIdxs: decodeVarbytePrintable(Uint8Array, gotoIdxs),
		});
	}

	constructor(dto: LiteTrieDto) {
		const edgeMapsZip = Array.from(dto.prefixIdxs).map(
			(prefixIdx, i) => [dto.prefixRaw[prefixIdx], i] as [number, number],
		);
		this.edgeMaps = Array.from(dto.gotoIdxs.slice(0, dto.gotoIdxs.length - 1))
			.map((gotoIdx, i) => [gotoIdx, dto.gotoIdxs[i + 1]] as [number, number])
			.map(([start, end]) => new Map(edgeMapsZip.slice(start, end)));
		this.prefixRaw = dto.prefixRaw;
		this.prefixIdxs = dto.prefixIdxs;
		this.valueP1s = dto.valueP1s;
		this.edgeIdxP1s = dto.edgeIdxP1s;
	}

	get(s: string): number | undefined {
		let search = s;
		let idxP1 = 0;
		while (true) {
			if (search.length === 0) {
				if (this.isLeaf(idxP1)) return this.valueP1s[idxP1 - 1] - 1;
				break;
			}

			const nextIdxP1 = this.getEdgeIdxP1(idxP1, search.charCodeAt(0));
			if (nextIdxP1 === 0) break;
			idxP1 = nextIdxP1;

			const nextSearch = this.getNextSearch(idxP1, search);
			if (nextSearch === undefined) break;
			search = nextSearch;
		}
		return undefined;
	}

	getEdgeIdxP1(idxP1: number, label: number): number {
		let edgeIdx = 0;
		if (idxP1 > 0) {
			const edgeIdxP1 = this.edgeIdxP1s[idxP1 - 1];
			if (edgeIdxP1 === 0) return 0;
			edgeIdx = edgeIdxP1 - 1;
		}
		const i = this.edgeMaps[edgeIdx].get(label);
		if (i === undefined) return 0;
		return i + 1;
	}

	private isLeaf(idxP1: number): boolean {
		if (idxP1 === 0) return false;
		return this.valueP1s[idxP1 - 1] > 0;
	}

	private getNextSearch(idxP1: number, search: string): string | undefined {
		const start = this.prefixIdxs[idxP1 - 1];
		const size = this.prefixIdxs[idxP1] - start;
		if (start + search.length < size) return undefined;
		for (let i = 0; i < size; i++) {
			if (search.charCodeAt(i) !== this.prefixRaw[start + i]) return undefined;
		}
		return search.slice(size);
	}
}
