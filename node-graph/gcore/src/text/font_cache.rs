use dyn_any::DynAny;
use std::collections::HashMap;

/// A font type (storing font family and font style and an optional preview URL)
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, Hash, PartialEq, Eq, DynAny, specta::Type)]
pub struct Font {
	#[serde(rename = "fontFamily")]
	pub font_family: String,
	#[serde(rename = "fontStyle", deserialize_with = "migrate_font_style")]
	pub font_style: String,
}
impl Font {
	pub fn new(font_family: String, font_style: String) -> Self {
		Self { font_family, font_style }
	}
}
impl Default for Font {
	fn default() -> Self {
		Self::new(crate::consts::DEFAULT_FONT_FAMILY.into(), crate::consts::DEFAULT_FONT_STYLE.into())
	}
}
/// A cache of all loaded font data and preview urls along with the default font (send from `init_app` in `editor_api.rs`)
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, Default, PartialEq, DynAny)]
pub struct FontCache {
	/// Actual font file data used for rendering a font with ttf_parser and rustybuzz
	font_file_data: HashMap<Font, Vec<u8>>,
	/// Web font preview URLs used for showing fonts when live editing
	preview_urls: HashMap<Font, String>,
}
impl FontCache {
	/// Returns the font family name if the font is cached, otherwise returns the fallback font family name if that is cached
	pub fn resolve_font<'a>(&'a self, font: &'a Font) -> Option<&'a Font> {
		// First try the requested font
		if self.font_file_data.contains_key(font) && !self.font_file_data[font].is_empty() {
			return Some(font);
		}

		// If not found or invalid, try the default font
		let default_font = Font::new(crate::consts::DEFAULT_FONT_FAMILY.into(), crate::consts::DEFAULT_FONT_STYLE.into());
		if self.font_file_data.contains_key(&default_font) && !self.font_file_data[&default_font].is_empty() {
			return self
				.font_file_data
				.keys()
				.find(|f| f.font_family == crate::consts::DEFAULT_FONT_FAMILY && f.font_style == crate::consts::DEFAULT_FONT_STYLE);
		}

		// If neither found or both invalid, try any loaded font as a last resort
		self.font_file_data.iter().find(|(_, data)| !data.is_empty()).map(|(font, _)| font)
	}

	/// Try to get the bytes for a font
	pub fn get<'a>(&'a self, font: &Font) -> Option<&'a Vec<u8>> {
		self.resolve_font(font).and_then(|font| {
			let data = self.font_file_data.get(font)?;
			if data.is_empty() { None } else { Some(data) }
		})
	}

	/// Check if the font is already loaded
	pub fn loaded_font(&self, font: &Font) -> bool {
		self.font_file_data.get(font).map_or(false, |data| !data.is_empty())
	}

	/// Insert a new font into the cache
	pub fn insert(&mut self, font: Font, preview_url: String, data: Vec<u8>) {
		if !data.is_empty() {
			self.font_file_data.insert(font.clone(), data);
			self.preview_urls.insert(font, preview_url);
		}
	}

	/// Gets the preview URL for showing in text field when live editing
	pub fn get_preview_url(&self, font: &Font) -> Option<&String> {
		self.preview_urls.get(font)
	}
}

impl core::hash::Hash for FontCache {
	fn hash<H: core::hash::Hasher>(&self, state: &mut H) {
		self.preview_urls.len().hash(state);
		self.preview_urls.iter().for_each(|(font, url)| {
			font.hash(state);
			url.hash(state)
		});
		self.font_file_data.len().hash(state);
		self.font_file_data.keys().for_each(|font| font.hash(state));
	}
}

// TODO: Eventually remove this migration document upgrade code
fn migrate_font_style<'de, D: serde::Deserializer<'de>>(deserializer: D) -> Result<String, D::Error> {
	use serde::Deserialize;
	String::deserialize(deserializer).map(|name| if name == "Normal (400)" { "Regular (400)".to_string() } else { name })
}
