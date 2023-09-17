import { QuickDB } from 'quick.db';

const db = new QuickDB({
    filePath: 'origin.sqlite',
});

export default db;