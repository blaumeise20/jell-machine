// Formats the text to html spans with color codes.
// Codes start with "~" and are followed by one char indicating the color/style.
// Returns a list of spans.
// Color codes:
// ~b: bold
// ~i: italic
// ~u: underline
// ~0: black
// ~1: red
// ~2: green
// ~3: yellow
// ~4: blue
// ~5: magenta
// ~6: cyan
// ~7: white
// ~R: reset
// ~~: ~
export function colorFormat(text: string) {
    const spans: [/*style*/ string | null, /*text*/ string][] = [];
    let style = null;
    let textBuffer = "";

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === "~") {
            if (i + 1 < text.length) {
                const next = text[i + 1];
                i++;
                if (next === "~") {
                    textBuffer += "~";
                    continue;
                }

                if (textBuffer.length > 0) {
                    spans.push([style, textBuffer]);
                    textBuffer = "";
                }

                if (next === "b") style = "font-weight: bold;";
                else if (next === "i") style = "font-style: italic;";
                else if (next === "u") style = "text-decoration: underline;";
                else if (next === "0") style = "color: black;";
                else if (next === "1") style = "color: red;";
                else if (next === "2") style = "color: green;";
                else if (next === "3") style = "color: yellow;";
                else if (next === "4") style = "color: blue;";
                else if (next === "5") style = "color: magenta;";
                else if (next === "6") style = "color: cyan;";
                else if (next === "7") style = "color: white;";
                else if (next === "R") style = null;
                else style = "color: gray;";
            }
        } else {
            textBuffer += c;
        }
    }

    if (textBuffer.length > 0) {
        spans.push([style, textBuffer]);
    }

    return spans;
}
