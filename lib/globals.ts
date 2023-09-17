import chalk from 'chalk'

// functions
export const print = (string: any, type = 'none') => {
	const fancyTime = new Date().toLocaleTimeString()
	const timeWithColors = chalk.yellowBright(`[${fancyTime}]`)
	let typeAddon = ''

	if (!type) return console.log(timeWithColors, string.split('\n').join('\n' + ' '.repeat(fancyTime.length + 3)))

	switch (type) {
		case 'error':
			typeAddon = chalk.redBright(`[error]`)
			string = chalk.redBright(string)
			break
		case 'success':
			typeAddon = chalk.greenBright(`[success]`)
			string = chalk.greenBright(string)
			break
		case 'info':
			typeAddon = chalk.blueBright(`[info]`)
			string = chalk.blueBright(string)
			break
		case 'warn':
			typeAddon = chalk.yellowBright(`[warn]`)
			string = chalk.yellowBright(string)
			break
		case 'debug':
			typeAddon = chalk.gray(`[debug]`)
			string = chalk.gray(string)
			break
	}

	return console.log(
		timeWithColors,
		// typeAddon,
		string.split('\n').join('\n' + ' '.repeat(fancyTime.length + 3))
	)
}
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
export const random = (min: number, max: number) => {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1) + min)
}
export const repeat = async (fn: Function, delay = 1000) => {
    while (true) {
        await fn();
        await sleep(delay);
    }
}

export type ItemDetails = {
	[id: string]: {
		id: string
		name: string
		price: number | null
		rap: number | null
		value: number | null
		demand: string
		demandScore: number
		trend: string
		trendScore: number
		thumbnail: string
	}
}