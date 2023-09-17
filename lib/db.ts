import { QuickDB } from 'quick.db';

const db = new QuickDB({
    filePath: '/mount/values.sqlite',
});

export default db;
