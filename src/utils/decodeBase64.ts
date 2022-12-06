const key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

export default function (input: string) {
	const bytes = input.length / 4 * 3;
	const ab = new Uint8Array(bytes);
	input = removePaddingChars(removePaddingChars(input)).replace(/[^A-Za-z0-9\+\/\=]/g, "");

	function removePaddingChars(input: string) {
		if (key.indexOf(input.charAt(input.length - 1)) == 64) return input.slice(0, -1);
		return input;
	}

	for (let i = 0, j = 0; i < bytes; i += 3) {
		const enc1 = key.indexOf(input.charAt(j++));
		const enc2 = key.indexOf(input.charAt(j++));
		const enc3 = key.indexOf(input.charAt(j++));
		const enc4 = key.indexOf(input.charAt(j++));

		const chr1 = (enc1 << 2) | (enc2 >> 4);
		const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		const chr3 = ((enc3 & 3) << 6) | enc4;

		ab[i] = chr1;
		if (enc3 != 64) ab[i + 1] = chr2;
		if (enc4 != 64) ab[i + 2] = chr3;
	}

	return ab;
}

export function encode(input: Uint8Array) {
    let output = "";
    let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    let i = 0;

    while (i < input.length) {
        chr1 = input[i++];
        chr2 = input[i++];
        chr3 = input[i++];

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }

        output = output + key.charAt(enc1) + key.charAt(enc2) + key.charAt(enc3) + key.charAt(enc4);
    }

    return output;
}
