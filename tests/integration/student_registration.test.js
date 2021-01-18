const { expect } = require('chai');
const request = require('supertest');
const app = require('../../server');
const test = require('japa');

const databaseReset = require('../helpers/database_reset');
const UserHelper = require('../helpers/UserHelper');
const GroupHelper = require('../helpers/GroupHelper');

const User = require('../../mysql/user.commands');
const AccountType = require('../../helpers/AccountType');

test.group('Register a student', (group) => {
    group.beforeEach(() => databaseReset());

    group.test('register a student', async () => {
        const createdGroup = await new GroupHelper().init();
        const payload = {
            first_name: 'John',
            last_name: 'Smith',
            father_name: 'Bob',
            phone: '+12124798964',
            email: 'john.smith@example.com',
            password: 'password',
            group_id: createdGroup.id
        };

        const res = await request(app)
            .post('/api/students')
            .send(payload);
        const student = await User.getUserByEmail(payload.email);

        expect(res.statusCode).equals(202);
        expect(student).not.equals(undefined);
        expect(student).to.have.property('account_type', AccountType.STUDENT);
        expect(student).to.have.property('is_activated', 0);
    });

    group.test('register a student with already existing email', async () => {
        await new UserHelper().initEnrollee();
        const createdGroup = await new GroupHelper().init();

        const res = await request(app)
            .post('/api/students')
            .send({
                first_name: 'John',
                last_name: 'Smith',
                father_name: 'Bob',
                phone: '+12124798964',
                email: 'john.smith@example.com',
                password: 'password',
                group_id: createdGroup.id
            });

        expect(res.statusCode).equals(409);
    });

    group.test('register a student with a wrong group id', async () => {
        const payload = {
            first_name: 'John',
            last_name: 'Smith',
            father_name: 'Bob',
            phone: '+12124798964',
            email: 'john.smith@example.com',
            password: 'password',
            group_id: 123
        };

        const res = await request(app)
            .post('/api/students')
            .send(payload);
        const student = await User.getUserByEmail(payload.email);

        expect(res.statusCode).equals(400);
        expect(student).equals(undefined);
    });
});
