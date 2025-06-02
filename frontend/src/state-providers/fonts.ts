import { writable } from "svelte/store";

import { type Editor } from "@graphite/editor";
import { TriggerFontLoad } from "@graphite/messages";

type CommonFontStyle = "Regular (400)" | "Bold (700)";
type KablammoFontStyle = "Regular (400)";
type SourceCodeProFontStyle = CommonFontStyle | "Medium (500)";
type CookieFontStyle = "Regular (400)";
type NewsreaderFontStyle = CommonFontStyle | "Medium (500)";

type FontDefinition<T extends string> = {
	family: string;
	variants: T[];
	files: Record<T, string>;
};

// Local font definitions
const LOCAL_FONTS = [
	{
		family: "Kablammo",
		variants: ["Regular (400)"] as const,
		files: {
			"Regular (400)": "/fonts/Kablammo-Regular.ttf",
		},
	},
	{
		family: "Source Code Pro",
		variants: ["Regular (400)", "Medium (500)", "Bold (700)"] as const,
		files: {
			"Regular (400)": "/fonts/SourceCodePro-Regular.ttf",
			"Medium (500)": "/fonts/SourceCodePro-Medium.ttf",
			"Bold (700)": "/fonts/SourceCodePro-Bold.ttf",
		},
	},
	{
		family: "Cookie",
		variants: ["Regular (400)"] as const,
		files: {
			"Regular (400)": "/fonts/Cookie-Regular.ttf",
		},
	},
	{
		family: "Newsreader",
		variants: ["Regular (400)", "Medium (500)", "Bold (700)"] as const,
		files: {
			"Regular (400)": "/fonts/Newsreader-Regular.ttf",
			"Medium (500)": "/fonts/Newsreader-Medium.ttf",
			"Bold (700)": "/fonts/Newsreader-Bold.ttf",
		},
	},
] as const satisfies readonly FontDefinition<string>[];

export type FontStyle = KablammoFontStyle | SourceCodeProFontStyle | CookieFontStyle | NewsreaderFontStyle;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createFontsState(editor: Editor) {
	const { subscribe } = writable({});

	async function fontNames(): Promise<{ name: string; url: URL | undefined }[]> {
		return LOCAL_FONTS.map((font) => ({
			name: font.family,
			url: undefined, // We don't need preview URLs for local fonts
		}));
	}

	async function getFontStyles(fontFamily: string): Promise<{ name: string; url: URL | undefined }[]> {
		const font = LOCAL_FONTS.find((value) => value.family === fontFamily);
		return font?.variants.map((variant) => ({ name: variant, url: undefined })) || [];
	}

	async function getFontFileUrl(fontFamily: string, fontStyle: FontStyle): Promise<string | undefined> {
		const font = LOCAL_FONTS.find((value) => value.family === fontFamily);
		return font?.files[fontStyle as keyof typeof font.files];
	}

	// Subscribe to process backend events
	editor.subscriptions.subscribeJsMessage(TriggerFontLoad, async (triggerFontLoad) => {
		const url = await getFontFileUrl(triggerFontLoad.font.fontFamily, triggerFontLoad.font.fontStyle as FontStyle);
		if (url) {
			try {
				const response = await fetch(url);
				if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
				const arrayBuffer = await response.arrayBuffer();
				editor.handle.onFontLoad(triggerFontLoad.font.fontFamily, triggerFontLoad.font.fontStyle, url, new Uint8Array(arrayBuffer));
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
				editor.handle.errorDialog("Failed to load font", `Error loading ${triggerFontLoad.font.fontFamily} with style ${triggerFontLoad.font.fontStyle}: ${errorMessage}`);
			}
		} else {
			editor.handle.errorDialog("Failed to load font", `The font ${triggerFontLoad.font.fontFamily} with style ${triggerFontLoad.font.fontStyle} does not exist`);
		}
	});

	return {
		subscribe,
		fontNames,
		getFontStyles,
		getFontFileUrl,
	};
}
export type FontsState = ReturnType<typeof createFontsState>;
