import type { LiteTrie } from "./lite-tree";

export class TrieTokenizer {
	step = 0;
	stopped = false;
	iP1 = 0;
	value?: number;

	constructor(readonly data: LiteTrie) {}

	reset(): void {
		this.step = 0;
		this.stopped = false;
		this.iP1 = 0;
		this.value = undefined;
	}

	advance(token: number): void {
		if (this.step === 0) {
			const nextIdxP1 = this.data.getEdgeIdxP1(this.iP1, token);
			if (nextIdxP1 === 0) {
				this.value = undefined;
				this.stopped = true;
				return;
			}
			this.iP1 = nextIdxP1;
			this.step =
				this.data.prefixIdxs[this.iP1] - this.data.prefixIdxs[this.iP1 - 1];
		}

		const prefixIdx = this.data.prefixIdxs[this.iP1] - this.step;

		if (this.data.prefixRaw[prefixIdx] === token) {
			this.step -= 1;
		} else {
			this.value = undefined;
			this.stopped = true;
			return;
		}

		const value = this.data.valueP1s[this.iP1 - 1];
		this.value = this.step === 0 && value > 0 ? value - 1 : undefined;
	}
}
