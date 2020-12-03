class Cookie {
    static parse(cookieHeader) {
        if (!cookieHeader) {
            return {};
        }

        return cookieHeader
            .split(';')
            .map(value => value.split('='))
            .reduce((acc, value) => {
                acc[decodeURIComponent(value[0].trim())] = decodeURIComponent(value[1].trim());

                return acc;
            }, {});
    }
}

module.exports = Cookie
