import languageMap from "gherkin/gherkin-languages.json";
import {
	LiteTrie,
	type LiteTrieCompact,
	type LiteTrieDto,
} from "~/lite-tree.js";
import { RadixTree } from "./utils/radix-tree.js";
import { encodeVarbytePrintable } from "varbyte-printable";
import { terms } from "~/index.js";
import { TrieTokenizer } from "~/trie-tokenizer.js";
import assert from "node:assert";

interface Language {
	name: string;
	data: typeof languageMap.en;
}

function main() {
	const languages: Language[] = Object.entries(languageMap).map(
		([name, data]) => ({ name, data }),
	);
	const languageCompact = buildLiteTrieCompactFromLiteTrieDto(
		buildLiteTrieDtoFromRadixTree(
			buildLanguageRadixTree(languages.map((x) => x.name)),
		),
	);

	console.log(
		encodeVarbytePrintable([
			...new Set(languageMap.en.rule.map((x) => x.charCodeAt(0))),
		]),
	);
	// for (const language of languages) {
	// 	const tree = buildDialectRadixTree(language.data);
	// 	const liteTrieDto = buildLiteTrieDtoFromRadixTree(language.name, tree);
	// 	const compactTrie = buildLiteTrieCompactFromLiteTrie(liteTrieDto);
	// 	const tokenizer = new TrieTokenizer(
	// 		LiteTrie.fromLiteTrieCompact(compactTrie),
	// 	);
	// 	console.log(compactTrie);
	// }
}

function buildLanguageRadixTree(languageNames: string[]): RadixTree {
	const tree = new RadixTree();
	for (let i = 0; i < languageNames.length; i++) {
		tree.insert(languageNames[i], i + 1);
	}
	return tree;
}

function buildDialectRadixTree(language: Language["data"]): RadixTree {
	const tree = new RadixTree();

	const treeKeys: {
		tokens: string[];
		tokenType: number;
	}[] = [
		{ tokens: language.and, tokenType: terms.AndKw },
		{ tokens: language.background, tokenType: terms.BackgroundKw },
		{ tokens: language.but, tokenType: terms.ButKw },
		{ tokens: language.examples, tokenType: terms.ExamplesKw },
		{ tokens: language.feature, tokenType: terms.FeatureKw },
		{ tokens: language.given, tokenType: terms.GivenKw },
		{ tokens: language.rule, tokenType: terms.RuleKw },
		{ tokens: language.scenario, tokenType: terms.ScenarioKw },
		{ tokens: language.scenarioOutline, tokenType: terms.ScenarioOutlineKw },
		{ tokens: language.then, tokenType: terms.ThenKw },
		{ tokens: language.when, tokenType: terms.WhenKw },
	];

	for (const key of treeKeys) {
		for (const token of key.tokens) {
			if (token !== "* ") tree.insert(token, key.tokenType);
		}
	}

	return tree;
}

function buildLiteTrieDtoFromRadixTree(
	tree: RadixTree,
	message?: string,
): LiteTrieDto {
	let prefixRaw = "";
	const prefixIdxs = [0];
	const valueP1s: number[] = [];
	const edgeIdxP1s: number[] = [];
	const gotoIdxs = [0, tree.root.edges.size];

	const queue = [...tree.root.edges.entries()];
	while (queue.length > 0) {
		const [, node] = queue.shift()!;

		prefixRaw += node.prefix;
		prefixIdxs.push(prefixIdxs[prefixIdxs.length - 1] + node.prefix.length);

		valueP1s.push(node.leaf !== undefined ? node.leaf + 1 : 0);

		if (node.edges.size > 0) {
			edgeIdxP1s.push(gotoIdxs.length);
			gotoIdxs.push(gotoIdxs[gotoIdxs.length - 1] + node.edges.size);

			queue.push(...node.edges.entries());
		} else {
			edgeIdxP1s.push(0);
		}
	}

	assert(!prefixIdxs.some((x) => x > 0xffff), message);
	assert(!valueP1s.some((x) => x > 0xff), message);
	assert(!edgeIdxP1s.some((x) => x > 0xff), message);
	assert(!gotoIdxs.some((x) => x > 0xff), message);

	return {
		prefixRaw: new Uint16Array(prefixRaw.length).map((_, i) =>
			prefixRaw.charCodeAt(i),
		),
		prefixIdxs: new Uint16Array(prefixIdxs),
		valueP1s: new Uint8Array(valueP1s),
		edgeIdxP1s: new Uint8Array(edgeIdxP1s),
		gotoIdxs: new Uint8Array(gotoIdxs),
	};
}

function buildLiteTrieCompactFromLiteTrieDto(
	dto: LiteTrieDto,
): LiteTrieCompact {
	return [
		encodeVarbytePrintable(dto.prefixRaw),
		encodeVarbytePrintable(dto.prefixIdxs),
		encodeVarbytePrintable(dto.valueP1s),
		encodeVarbytePrintable(dto.edgeIdxP1s),
		encodeVarbytePrintable(dto.gotoIdxs),
	];
}

if (import.meta.main) {
	main();
}
