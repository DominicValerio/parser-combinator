import process, {stdin, stdout, stderr, exit} from "process"
import util from "util"

const print = (format?: any, ...param: any[]) => stdout.write(util.format(format, ...param))
const printj = (value: any) => print(JSON.stringify(value, null, 4))
const eprint = (value: any) => stderr.write(util.format(value))
const panic = (message: any) => {
	eprint(message)
	exit(1)
}

let ctx: Context = {src: "", idx: 0}

type Result = {
	value: any,
	error: string | null,
}

type Context = {
	src: string
	idx: number
}

type Parser = () => Result

function ok(value: any): Result {
	return {
		value: value,
		error: null,
	}
}

function err(err: string): Result {
	return {
		value: null,
		error: err,
	}
}

let src = "3 + 3 * 3"

function regex(re: RegExp): Parser {
	return () => {
		const res = re.exec(ctx.src.slice(ctx.idx))
		if (res && res.index == ctx.idx) {
			return ok(res[0])
		}
		return err("Regex unsuccessful")
	}
}

const num = regex(/[0-9]*/)

function parse(src : string) {
	ctx.src = src
	ctx.idx = 0
	return num()
}

printj(parse("12345"))