const { configure } = require('japa');

process.env.NODE_ENV = 'test';
console.error = () => {};

configure({
    files: ['tests/integration/*.test.js'],
});
