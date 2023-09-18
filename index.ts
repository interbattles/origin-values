import * as items from './lib/items.ts';
import db from './lib/db.ts'
import { sleep, repeat, print } from "./lib/globals.ts"
import server from './lib/server.ts'

const getAllItems = async () => await db.item.findMany()

const updateMissingItems = async () => {
    const itemsStored = await getAllItems()
    const itemDetails = Object.values(await items.refreshItemDetails());

    const missingItems = itemDetails
        .filter(roliItem => !itemsStored.find(item => String(item.id) === roliItem.id));

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

        for(let point of mappedPoints) {
            await db.sale.create({
                data: {
                    id: point.saleId,
                    timestamp: point.timestamp,
                    rap: point.rap,
                    price: point.price
                }
            })
        }

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
        if(!await db.item.findFirst({
            select: { id: true },
            where: { id: itemId }
        })) continue; 
        const itemSales = await db.sale.findMany({
            where: {
                itemId
            }
        })

        // check if sale is a duplicate
        if (itemSales.find((sale => String(sale.id) === saleId))) continue;

        const estimatedPrice = oldRap + (newRap - oldRap) * 10;
        await db.sale.create({
            data: {
                id: saleId,
                timestamp,
                rap: newRap,
                price: estimatedPrice,
                itemId
            }
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