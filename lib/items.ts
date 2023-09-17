import superagent from 'superagent'
import { print } from './globals.js'
import type { ItemDetails } from './globals.js'

const agent = superagent.agent().set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36')

const demandAssignments: { [key: string]: string } = {
	'-1': 'unrated',
	'0': 'terrible',
	'1': 'low',
	'2': 'normal',
	'3': 'high',
	'4': 'amazing',
}
const trendAssignments: { [key: string]: string } = {
	'-1': 'unrated',
	'0': 'lowering',
	'1': 'unstable',
	'2': 'stable',
	'3': 'fluctuating',
	'4': 'raising',
}

let itemDetails: ItemDetails = {}

export const refreshItemDetails = async () => {
	await agent.get('https://www.rolimons.com/deals').then((resp) => {
		const items = JSON.parse(resp.text.split('var item_details = ')[1].split(';')[0])
		for (let item of Object.entries(items)) {
			const itemId = item[0]
			const name: string = (item as any)[1][0]
			const price: number = (item as any)[1][1]
			const rap: number | null = (item as any)[1][2]
			const value: number | null = (item as any)[1][6]
			const demandScore: number = (item as any)[1][7] || -1
			const demand: string = demandAssignments[demandScore.toString()]
			const trendScore: number = (item as any)[1][8] || -1
			const trend: string = trendAssignments[trendScore.toString()]
			const thumbnail: string = (item as any)[1][9]

			itemDetails[itemId] = {
				id: itemId,
				name,
				price,
				rap,
				value,
				demand,
				demandScore,
				trend,
				trendScore,
				thumbnail,
			}
		}
	})
	print('refreshed values!!', 'info')
	return itemDetails
}

export const fetchItemSales = async (itemId: string) => {
    return agent.get(`https://www.rolimons.com/itemsales/${itemId}`)
        .then(resp => {
            if (!resp || !resp.text) return;

            return JSON.parse(resp.text.split('var item_sales            = ')[1].split(';')[0])
        })
        .catch(error => {
            if (!error.response) {
                print(`Internal error fetching item sales for ${itemId}:`, error);
                return;
            }

            if (error.response.status === 403) {
                print(`Request blocked when fetching item sales for ${itemId}:`, error);
                return;
            }

            print(`Error fetching item sales for ${itemId}:`, error);
            return;
        })
}

export const fetchAllRecentSales = async () => {
    return agent.get(`https://www.rolimons.com/api/activity`)
        .then(resp => {
            if (!resp.body || !resp.body.activities) return

            return resp.body.activities
        })
        .catch(error => {
            if (!error.response) {
                print(`Internal error fetching recent sales:`, error);
                return
            }

            if (error.response.status === 403) {
                print(`Request blocked when fetching recent sales:`, error);
                return
            }

            print(`Error fetching recent sales:`, error);
            return
        })
}

export const get = (id: number) => {
	if (!itemDetails[id]) return
	return structuredClone(itemDetails[id])
}