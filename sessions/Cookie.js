class Cookie {
    static parse(cookieHeader) {
        if (!cookieHeader) {
            return {};
        }

        return cookieHeader
            .split(';')
            .map(value => value.split('='))
            .reduce((acc, value) => {
                if (value.length == 1) {
                    value = decodeURIComponent(value[0].trim());
                    acc['others'] = (!acc['others']) ? [value] : acc['others'].concat(value);

                    return acc;
                }

                acc[decodeURIComponent(value[0].trim())] = decodeURIComponent(value[1].trim());

                return acc;
            }, {});
    }
}

module.exports = Cookie
