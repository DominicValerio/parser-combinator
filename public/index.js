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
function regex(re) {
    return () => {
        const res = re.exec(ctx.src.slice(ctx.idx));
        if (res && res.index == ctx.idx && res[0].length > 0) {
            ctx.idx = res.index;
            return ok(res[0]);
        }
        return err("Regex unsuccessful");
    };
}
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
const num = regex(/[0-9]*/);
const op = regex(/(\+)|(\-)/);
function parse(src) {
    ctx.src = src;
    ctx.idx = 0;
    return op();
}
printj(parse("+"));
