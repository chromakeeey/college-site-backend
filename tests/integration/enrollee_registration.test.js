const { expect } = require('chai');
const request = require('supertest');
const app = require('../../server');
const test = require('japa');

const databaseReset = require('../helpers/database_reset');
const UserHelper = require('../helpers/UserHelper');

const User = require('../../mysql/user.commands');
const AccountType = require('../../helpers/AccountType');

test.group('Register an enrollee', (group) => {
    group.beforeEach(() => databaseReset());

    group.test('register an enrollee', async () => {
        const res = await request(app)
            .post('/api/enrollees')
            .send({
                first_name: 'John',
                last_name: 'Smith',
                father_name: 'Bob',
                phone: '+12124798964',
                email: 'john.smith@example.com',
                password: 'password'
            });
        const enrollee = await User.getUserByEmail('john.smith@example.com');

        expect(res.statusCode).equals(200);
        expect(enrollee).not.equals(undefined);
        expect(enrollee).to.have.property('account_type', AccountType.ENROLLEE);
    });

    group.test('register an enrollee with an already existing email', async () => {
        await new UserHelper().initEnrollee();

        const res = await request(app)
            .post('/api/enrollees')
            .send({
                first_name: 'John',
                last_name: 'Smith',
                father_name: 'Bob',
                phone: '+12124798964',
                email: 'john.smith@example.com',
                password: 'password'
            });

        expect(res.statusCode).equals(409);
    });
});
