import { decodeVarbytePrintable } from "varbyte-printable";
import { LiteTrie, type LiteTrieCompact } from "./lite-tree.js";
import { TrieTokenizer } from "./trie-tokenizer.js";

export interface Dialect {
	tokenizer: TrieTokenizer;
	ruleStarts: Set<number>;
}

const dialectMap: Map<string, Dialect> = new Map();

const languageCompact: LiteTrieCompact = [
	"$T#T#U#V#W#X#Y#Z#[#]#^#_#`#a#b#d#f#g#h#i#j#]#n#[}#Y#a#b#f#g#h#n#X#Z#a#g#T#g#m}!i!d#T#X#`#a#b#c#g#h#T#]#f#T#^#`#X#]#f#h#i#W#g#h#T#j#T#b#c#h#i#j#_}#b#`#f#X#`#c#T#`#h#c#i#_#`#f}#j#T#[#X#`#[#f#h#_#f#n!e!p!v!y#[}!e#m#f#`!n#T#h#b!e#m#f#`!n#T#h#b!u#V#c#i#g#X#T#i#`#c#`#c#`#W#d#]#f#T#h#X#h#l",
	"#[OPQRSTUVWXYZ[]^_`abcehijklnopqrstuyz{|}!O!P!Q!R!S!T!U!V!W!X!Y!Z![!]!^!_!`!a!b!c!d!e!f!g!h!i!k!l!m!n!o!p!q!r!s!t!u!v!w!x!z!{!|!}#O#Q#R#S#T#U#V#X#Z#[#]#a#e#i#m#s#u#x#{$R$T",
	"#ZOOOOOOOOOOOOOOOOOOO!nOQRSTUVWXYZ[]^_`abcjklmnopqrstuvwxyz{|}!O!P!Q!R!SO!V!p!r!W!X!Y!Z![!]!^!_!`!aO!d!e!f!g!h!i!j!k!l!m!o!q!sO!T!U!b!cdefghi",
	"#ZQRSTUVWXYZ[]^_`abcdOeOfOOOOOOOOOOOOOOOgOOOOOOOOOOOOOOOOOOOOOOOOOhOOOOOOOOOOOOOiOOOOOOOOOOOOOjOOOOOOOOOO",
	"kOekortz}!Q!V!Y![!_!b!f!i!l!n!r!x!{!}#O#P#R#T#Z",
];

const enDialectCompact: LiteTrieCompact = [
	"#Q!c!d!g#l#T#a#d#`#X!u#V#X#b#T#f#]#c!h#X#T#h#i#f#X!i#]#j#X#bp!t#i#`#X!v#[#X#bp!y#[#X#bp#b#Wp#U#]#`#]#h#m#T#V#_#Z#f#c#i#b#W#i#g#gp#hp#g#]#b#X#g#gp!p#X#X#W!q#i#h#`#]#b#X!v#X#a#d#`#T#h#X",
	"eOPQXahnrw|!P!V!`!a!b!c!d!f!q!x#Q",
	"dOOUURXSZY[RTOWWO]RVV",
	"dQRSTOOOOOOOOUOOVOOOO",
	"WOXZ]^`bd",
];

const enRuleStartsCompact = "P!t";

export const languageTokenizer = new TrieTokenizer(
	LiteTrie.fromLiteTrieCompact(languageCompact),
);

export function dialectFor(languageName: string): Dialect {
	let dialect = dialectMap.get(languageName);
	if (!dialect) {
		dialect = {
			tokenizer: new TrieTokenizer(
				LiteTrie.fromLiteTrieCompact(dialectCompactFor(languageName)),
			),
			ruleStarts: new Set(
				decodeVarbytePrintable(
					Array,
					ruleStartsCompactFor(languageName),
				) as number[],
			),
		};
		dialectMap.set(languageName, dialect);
	}
	return dialect;
}

function dialectCompactFor(languageName: string): LiteTrieCompact {
	switch (languageName) {
		default:
			return enDialectCompact;
	}
}

function ruleStartsCompactFor(languageName: string): string {
	switch (languageName) {
		default:
			return enRuleStartsCompact;
	}
}
