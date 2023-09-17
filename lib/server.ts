import express from 'express';
import db from './db.js';
import { get } from './items.js'
import { print } from "./globals.js";

let cachedResponse = {
    iat: 0,
    items: {}
};

const filterUnneeded = (array: Array<any>) => {
    const sorted = array.sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length / 4)];
    const q3 = sorted[Math.floor(sorted.length * (3 / 4))];
    const iqr = q3 - q1;
    const maxValue = q3 + iqr * 1.1;

    return sorted.filter(i => i < maxValue && i > 0);
}

const mean = (array: Array<any>) => array.reduce((a, b) => a + b) / array.length;

const app = express();
app.use(express.json());

app.get('/', async (req, resp) => {
    if (cachedResponse.iat && Date.now() - cachedResponse.iat < 1000 * 60 * 5)
        return resp.send(cachedResponse);

    const items = await db.get('items');

    let response: {
        iat: number
        items: { [id: string]: any }
    } = {
        iat: Date.now(),
        items: {}
    };

    for (const itemId in items) {
        const item = items[itemId];
        const points = item.points.reverse().slice(0, 150);

        const filteredPriceOutliars = filterUnneeded(
            points.map((i: { price: any; }) => i.price)
        );
        const filteredRapOutliars = filterUnneeded(
            points.map((i: { rap: any; }) => i.rap)
        );

        if (filteredPriceOutliars.length < 3 || filteredRapOutliars.length < 3) {
            response.items[itemId] = null;
            continue;
        }

        response.items[itemId] = { 
            ...get(Number(itemId)),
            adjustedRap: Math.floor(mean([
                mean(filteredRapOutliars), mean(filteredPriceOutliars)
            ])) || null
        }
    }

    cachedResponse = response
    return resp.send(response)
});

export default () => app.listen(80, () => {
    print('Server started on port 80');
})
