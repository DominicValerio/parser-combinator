"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const util_1 = __importDefault(require("util"));
const print = (format, ...param) => process_1.stdout.write(util_1.default.format(format, ...param));
const printj = (value) => print(JSON.stringify(value, null, 4));
const eprint = (value) => process_1.stderr.write(util_1.default.format(value));
const panic = (message) => {
    eprint(message);
    (0, process_1.exit)(1);
};
let ctx = { src: "", idx: 0 };
function ok(value) {
    return {
        value: value,
        error: null,
    };
}
function err(err) {
    return {
        value: null,
        error: err,
    };
}
function str(text) {
    return () => {
        let slice = ctx.src.slice(ctx.idx, ctx.idx + text.length);
        if (slice != text) {
            return err(`${slice} is not equal to ${text}`);
        }
        return ok(slice);
    };
}
function regex(re, errormsg) {
    return () => {
        const res = re.exec(ctx.src.slice(ctx.idx));
        if (!res || res[0].length <= 0)
            return err(errormsg || "");
        const text = res[0];
        ctx.idx += text.length;
        return ok(text);
    };
}
// match zero or more of the Parser's pattern
function many(p) {
    return () => {
        let values = [];
        while (true) {
            let temp = ctx;
            let res = p();
            if (res.error) {
                ctx = temp;
                break;
            }
            values.push(res.value);
        }
        return ok(values);
    };
}
// match one of the parsers in the list
function choice(parsers) {
    return () => {
        for (const p of parsers) {
            let res = p();
            if (res.error == null) {
                return res;
            }
        }
        return err("Couldn't match");
    };
}
// match a sequence of requirements
function sequence(parsers) {
    return () => {
        let values = [];
        for (const p of parsers) {
            let res = p();
            if (res.error != null) {
                return res;
            }
            values.push(res.value);
        }
        return { value: values, error: null };
    };
}
// used to transform a Parser's value
function map(p, callback) {
    return () => {
        let res = p();
        res.value = callback(res.value);
        return res;
    };
}
// makes a parser not return an error, therefore making it optional
function optional(p) {
    return () => {
        return { value: p().value, error: null };
    };
}
const num = map(regex(/[0-9]*/, "No number found"), parseInt);
const op = regex(/(\+)|(\-)/, "No operator found");
const binop = sequence([
    num,
    op,
    num
]);
const expr = choice([
    binop,
    num
]);
const whitespace = regex(/( )*/);
const parser = choice([expr, whitespace]);
function parse(src) {
    ctx.src = src;
    ctx.idx = 0;
    return parser();
}
printj(parse("9+10 10"));
