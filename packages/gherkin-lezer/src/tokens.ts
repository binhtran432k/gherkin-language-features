import { ContextTracker, ExternalTokenizer, type InputStream } from "@lezer/lr";
import { terms } from ".";
import { dialectFor, languageTokenizer, type Dialect } from "./dialects.js";

enum CharCode {
	HorizontalTab = 9, // \t
	LineFeed = 10, // \n
	VerticalTab = 11, // \v
	FormFeed = 12, // \f
	CarriageReturn = 13, // \r
	Space = 35, // ' '
	Hash = 35, // #
	Colon = 58, // :
	At = 64, // @
	a = 97,
	e = 101,
	g = 103,
	l = 108,
	n = 110,
	u = 117,
}

const bsp = new Set([CharCode.CarriageReturn, CharCode.LineFeed]);

const nbsp = new Set([CharCode.Space, CharCode.HorizontalTab]);

const sp = new Set([...bsp, ...nbsp]);

const abstractKws = new Set([
	terms.FeatureKw,
	terms.RuleKw,
	terms.BackgroundKw,
	terms.ScenarioKw,
	terms.ScenarioOutlineKw,
	terms.ExamplesKw,
]);

export const trackLanguage: ContextTracker<Dialect> = new ContextTracker({
	start: dialectFor("en"),
	shift(context, term, _, input) {
		return term === terms.LanguageName ? context : context;
	},
	strict: false,
});

export const noEol: ExternalTokenizer = new ExternalTokenizer(
	(input) => {
		const { next } = input;
		if (next !== -1 && !bsp.has(next)) input.acceptToken(terms.noEol);
	},
	{ contextual: true },
);

export const languageStart: ExternalTokenizer = new ExternalTokenizer(
	(input) => {
		if (input.next !== CharCode.Hash) return;
		input.advance();

		const languageStartPos = input.pos;

		while (nbsp.has(input.next)) input.advance();

		if (
			!advanceCharCodes(input, [
				CharCode.l,
				CharCode.a,
				CharCode.n,
				CharCode.g,
				CharCode.u,
				CharCode.a,
				CharCode.g,
				CharCode.e,
			])
		)
			return;

		while (nbsp.has(input.next)) input.advance();

		if ((input.next as number) !== CharCode.Colon) return;
		input.advance();

		input.acceptTokenTo(terms.languageStart, languageStartPos);
	},
	{ contextual: true },
);

export const languageName: ExternalTokenizer = new ExternalTokenizer(
	(input) => {
		if (nbsp.has(input.next)) return;

		let token: number | undefined;

		languageTokenizer.reset();

		while (input.next >= 0) {
			languageTokenizer.advance(input.next);
			if (languageTokenizer.stopped) break;
			if (languageTokenizer.value !== undefined) {
				token = languageTokenizer.value;
			}
			input.advance();
		}

		if (token === undefined) return;

		if (input.next >= 0 && !sp.has(input.next)) return;

		input.acceptToken(terms.LanguageName);
	},
	{ contextual: true },
);

export const ruleTagStart: ExternalTokenizer = new ExternalTokenizer(
	(input, stack) => {
		if (input.next !== CharCode.At) return;

		const consumePos = input.pos;
		const dialect = stack.context as Dialect;

		while (true) {
			if (input.next === CharCode.At || input.next === CharCode.Hash) {
				input.advance();
				while (!bsp.has(input.next) && input.next >= 0) input.advance();
				while (sp.has(input.next)) input.advance();
			} else if (dialect.ruleStarts.has(input.next)) {
				break;
			} else {
				return;
			}
		}

		dialect.tokenizer.reset();

		while (input.next >= 0) {
			dialect.tokenizer.advance(input.next);
			if (dialect.tokenizer.stopped) break;
			if (dialect.tokenizer.value === terms.RuleKw) {
				input.acceptTokenTo(terms.ruleTagStart, consumePos);
				return;
			}
			input.advance();
		}
	},
	{ contextual: true },
);

export const keywords: ExternalTokenizer = new ExternalTokenizer(
	(input, stack) => {
		const dialect = stack.context as Dialect;
		let pos: number;
		let token: number | undefined;

		dialect.tokenizer.reset();

		while (input.next >= 0) {
			dialect.tokenizer.advance(input.next);
			if (dialect.tokenizer.stopped) break;
			if (dialect.tokenizer.value !== undefined) {
				token = dialect.tokenizer.value;
				input.advance();
				pos = input.pos;
			} else {
				input.advance();
			}
		}

		if (token === undefined) return;

		if (abstractKws.has(token) && input.next !== CharCode.Colon) return;

		if (stack.canShift(token)) input.acceptTokenTo(token, pos!);
	},
	{ contextual: true },
);

function advanceCharCodes(input: InputStream, keyword: number[]): boolean {
	for (const c of keyword) {
		if (input.next === c) input.advance();
		else return false;
	}
	return true;
}
