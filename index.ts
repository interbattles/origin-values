import * as items from './lib/items.js';
import db from './lib/db.js'
import { sleep, repeat, print } from "./lib/globals.js"
import { Worker } from 'worker_threads';
import server from './lib/server.js';

const getAllItems = async () => (await db.get('items')) || {};

const updateMissingItems = async () => {
    const itemsStored = Object.keys(await getAllItems());
    const itemDetails = Object.values(await items.refreshItemDetails());

    const missingItems = itemDetails
        .filter(roliItem => !itemsStored.find(item => item === roliItem.id));

    for (const missingItem of missingItems) {
        print(`Scraping missing data for "${missingItem.name}" [${missingItems.findIndex((item) => item.id === missingItem.id)}/${missingItems.length}]`);

        // fetch all points for the item from rolimons
        const allPoints = await items.fetchItemSales(missingItem.id);
        if (!allPoints) {
            print(`Failed to scrape data for "${missingItem.name}" (${missingItem.id})`);
            await sleep(30 * 1000)
            continue;
        }

        // condense each array into a single array of objects
        const mappedPoints = allPoints.timestamp_list.map((point: number, index: number) => ({
            saleId: allPoints.sale_id_list[index],
            timestamp: point,
            rap: allPoints.sale_rap_list[index],
            // value: allPoints.sale_value_list[index],
            price: allPoints.sale_price_list[index],
        }));

        // store the data for later use
        await db.set(`items.${missingItem.id}.points`, mappedPoints);

        print(`Saved ${mappedPoints.length} points for "${missingItem.name}" (${missingItem.id})...`);

        // courtesy sleep yw rolimon
        await sleep(4 * 1000);
    }
};
const handleNewSales = async () => {
    const newSales = await items.fetchAllRecentSales();
    if (!newSales) return;

    for (const saleData of newSales) {
        const [
            timestamp,
            _unknown,
            itemId,
            oldRap,
            newRap,
            saleId,
        ] = saleData;
        const itemSales = await db.get(`items.${itemId}.points`);
        if (!itemSales) {
            print(`Found sale for ${itemId}, but previous data hasn't been scraped yet`);
            continue;
        }

        // check if sale is a duplicate
        if (itemSales.find((sale: { saleId: any; }) => sale.saleId === saleId)) continue;

        const estimatedPrice = oldRap + (newRap - oldRap) * 10;
        await db.push(`items.${itemId}.points`, {
            saleId,
            timestamp,
            rap: newRap,
            price: estimatedPrice,
        });

        print(`Found new sale for ${itemId} (${oldRap.toLocaleString()} -> ${newRap.toLocaleString()} | approx. ${estimatedPrice.toLocaleString()})`);
    }
};

const main = async () => {
    print(`Fetching itemdata`);
    await items.refreshItemDetails();

    repeat(items.refreshItemDetails, 60 * 1000);
    repeat(updateMissingItems, 5 * 60 * 1000);
    repeat(handleNewSales, 5 * 1000);
}

main()
server()