export function makeNumberEncoder(code: string) {
    const base = code.length;

    const decode = {} as Record<string, number>;
    for (let i = 0; i < code.length; i++) decode[code[i]] = i;

    return {
        encode: (num: number) => {
            if (num == 0) return code[0];

            let str = "";
            while (num > 0) {
                str = code[num % base] + str;
                num = Math.floor(num / base);
            }
            return str;
        },
        decode: (str: string) => {
            let num = 0;
            for (const key of str) {
                num = num * base + (decode[key])
                if (isNaN(num)) throw new Error("Invalid input string");
            };
            return num;
        }
    };
}
