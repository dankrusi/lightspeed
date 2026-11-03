# Bundled house font

`versavolta-serif-regular.ttf` is Versavolta Serif Regular (weight 400), bundled by `src/tokens.css` for the default heading font. Consumers need no system font installation or external font service. Keep the relative CSS asset reference so consumer bundlers include the font in production output.

The asset is the unmodified Versavolta `VersavoltaSerif-Regular-superautokern.ttf` font. Only the regular upright face is supplied; do not declare it as a variable or multi-weight font.
