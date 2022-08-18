import process, {stdin, stdout, stderr, exit} from "process"
import util from "util"

const print = (format?: any, ...param: any[]) => stdout.write(util.format(format, ...param))
const printj = (value: any) => print(JSON.stringify(value, null, 2))
const eprint = (value: any) => stderr.write(util.format(value))
const panic = (message: any) => {
	eprint(message)
	exit(1)
}

type Context = {
	src: string
	idx: number
}
let ctx: Context = {src: "", idx: 0}

type Value = string | number | Value[]

type Result = {
	value: Value,
	error: string | null,
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
		value: "",
		error: err,
	}
}

function str(text: string): Parser {
	return () => {
		let slice = ctx.src.slice(ctx.idx, ctx.idx + text.length)
		if (slice != text) {
			return err(`${slice} is not equal to ${text}`)
		}
		ctx.idx += slice.length
		return ok(slice)
	}
}

function regex(re: RegExp, errormsg?: string): Parser {
	return () => {
		const res = re.exec(ctx.src.slice(ctx.idx))
		if (!res || res[0].length <= 0) 
			return err(errormsg || "")
		const text = res[0]
		ctx.idx += text.length
		return ok(text)
	}
}
// match zero or more of the Parser's pattern (called many)
function zeroOrMore(p: Parser): Parser {
	return () => {
		let values = []
		while (true) {
			let oldIdx = ctx.idx
			let res = p()
			if (res.error) {
				ctx.idx = oldIdx
				return ok(values)
			}
			values.push(res.value)
		}
		return ok(values)
	}
}
// match one of the parsers in the list
function oneOf(parsers: Parser[]): Parser {
	return () => {
		for (const p of parsers) {
			let oldIdx = ctx.idx
			let res = p()
			if (res.error == null) {
				return res
			}
			ctx.idx = oldIdx
		}
		print("notok\n")
		return err("No match found in choice()")
	}
}
// match a sequence of requirements
function sequence(parsers: Parser[]): Parser {
	return () => {
		let values = []
		for (const p of parsers) {
			let res = p()
			if (res.error) { //return early
				return res
			}
			values.push(res.value)
		}
		return {value: values, error: null}
	}
}
// used to transform a Parser's value
function map(p: Parser, callback: (oldvalue: any) => any): Parser {
	return () => {
		let res = p()
		res.value = callback(res.value)
		return res
	}
}
// makes a parser not return an error, therefore making it optional
function optional(p: Parser): Parser {
	return () => {
		let oldIdx = ctx.idx
		let res = p()
		if (res.error != null) {
			ctx.idx = oldIdx
			// eprint(res.error)
			// print("\n")
		}
		return {value: res.value, error: null}
	}
}

function box(p: Parser): Parser {
	return () => {
		let oldIdx = ctx.idx
		let res = p()
		ctx.idx = oldIdx
		return res
	}
}

// local parsers
const whitespace = regex(/( )*|(\t)*/)

const num = map(
	regex(/[0-9]*/, "No number found"), 
	parseInt
)
const mul = regex(/(\*)|(\/)/, "No multiplicitave found")
const additive = regex(/(\+)|(\-)/, "No additive found")

const sequenceMap = (parsers: Parser[], callback: (oldvalue: any) => any) => map(sequence(parsers), callback)

function leftAssociate(oldValue: Value): any {
	if (oldValue && oldValue.hasOwnProperty("length")) {
		let v = oldValue as any[][]
		let guaranteed = v[0]
		let optionPart = v[1]
		printj(guaranteed); print("\n") 
		printj(optionPart); print("\n")
		if (optionPart.length == 0) return guaranteed
		if (optionPart.length == 1) return {l: guaranteed, op: optionPart[0][0], r: optionPart[0][1]}
		let res: any = {l: guaranteed, op: null, r: null}
		for (let i = 0; i < optionPart.length; i++) {
			let [op, r] = optionPart[i]
			res.op = op
			res.r = r
			if (i < optionPart.length - 1) res = {l: res, op: null, r: null}
		}
		return res
	}
	panic("unreachable\n")
}

const product = sequenceMap([
	num,
	zeroOrMore(sequence([mul, num]))
], 
leftAssociate)

const sum = sequenceMap([
	product,
	zeroOrMore(sequence([additive, product]))
], 
leftAssociate)

const expr = sum


const parser = () => {
	let error = null
	let value = []
	while (ctx.idx != ctx.src.length) {
		whitespace()
		let v = expr()
		if (v.error) {
			error = v.error
			printj(ctx)
			print("\n")
			printj(value)
			print("\n")
			panic(error)
			break;
		}
		value.push(v.value)
	}   
	return {value: value, error: error}
}

function parse(src: string) {
	ctx.src = src
	ctx.idx = 0
	return parser()
}

//printj(parse("1*2+3"))
//printj(parse("2+3"))
printj(parse("2+3+3"))