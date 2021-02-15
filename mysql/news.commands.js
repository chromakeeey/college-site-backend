const connectionPool = require('./connection');

const addNews = async ({ title, imageName, content }) => {
    const sql = 'INSERT INTO news (title, image_name, content, date) VALUES (?, ?, ?, ?)';
    const [rows] = await connectionPool.query(sql, [
        title, imageName, content,
        new Date().toISOString().slice(0, 19).replace('T', ' '),
    ]);

    return rows.insertId;
};

const addGroupNews = async ({ title, imageName, content, groupId }) => {
    const newsId  = await addNews({
        title: title,
        imageName: imageName,
        content: content,
    });
    const sql = 'INSERT INTO group_news (news_id, group_id) VALUES (?, ?)';
    await connectionPool.query(sql, [ newsId, groupId ]);

    return newsId;
};

const getNewsCount = async (groupId=undefined) => {
    let rows;

    if (!groupId) {
        [rows] = await connectionPool.query('SELECT COUNT(news.id) FROM news');
    } else {
        const sql = `
            SELECT
                COUNT(news.id)
            FROM
                news, group_news
            WHERE
                news.id = group_news.news_id
            AND
                group_news.group_id = ?
        `;

        [rows] = await connectionPool.query(sql, groupId);
    }

    return Object.values(rows[0])[0];
};

const getNews = async ({
    groupId = null,
    limit,
    offset,
} = {}) => {
    const limitStatement = (limit != undefined) ? `LIMIT ${limit}` : '';
    const offsetStatement = (offset != undefined) ? `OFFSET ${offset}` : '';
    let rows;

    if (!groupId) {
        [rows] = await connectionPool.query(`
        SELECT DISTINCT
            news.id, news.title,
            news.image_name,
            news.date, news.content
        FROM
            news, group_news
        WHERE
            NOT EXISTS (SELECT * FROM group_news WHERE group_news.news_id = news.id)
        ORDER BY date
            ${limitStatement}
            ${offsetStatement}
        `);
    } else {
        const sql = `
            SELECT
                news.id, news.title,
                news.image_name,
                news.date, news.content,
                group_news.group_id AS group_id
            FROM
                news, group_news
            WHERE
                news.id = group_news.news_id
            AND
                group_news.group_id = ?
            ORDER BY
                news.date
            ${limitStatement}
            ${offsetStatement}
        `;

        [rows] = await connectionPool.query(sql, groupId);
    }

    return rows;
};

const deleteNews = async (id) => {
    const [rows] = await connectionPool.query('DELETE FROM news WHERE id = ?', id);

    return rows.affectedRows > 0;
};

module.exports = {
    addNews,
    addGroupNews,
    deleteNews,
    getNews,
    getNewsCount,
};
