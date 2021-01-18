const { expect } = require('chai');
const request = require('supertest');
const app = require('../../server');
const test = require('japa');

const databaseReset = require('../helpers/database_reset');
const UserHelper = require('../helpers/UserHelper');
const GroupHelper = require('../helpers/GroupHelper');

const User = require('../../mysql/user.commands');
const AccountType = require('../../helpers/AccountType');

test.group('Register a teacher', (group) => {
    group.beforeEach(() => databaseReset());

    group.test('register a teacher', async () => {
        const admin = await new UserHelper({ email: 'admin@example.com' }).initAdmin();
        const createdGroup = await new GroupHelper().init();
        const agent = await request(app);
        const payload = {
            first_name: 'John',
            last_name: 'Smith',
            father_name: 'Bob',
            phone: '+12124798964',
            email: 'john.smith@example.com',
            password: 'password',
            group_id: createdGroup.id
        };

        const res = await agent
            .post('/api/teachers')
            .set('Cookie', `session=${await admin.auth(agent)}`)
            .send(payload);
        const teacher = await User.getUserByEmail(payload.email);

        expect(res.statusCode).equals(200);
        expect(teacher).not.equals(undefined);
        expect(teacher).to.have.property('account_type', AccountType.TEACHER);
        expect(teacher).to.have.property('is_activated', 1);
    });

    group.test('register a teacher with already existing email', async () => {
        const admin = await new UserHelper({ email: 'admin@example.com' }).initAdmin();
        const createdGroup = await new GroupHelper().init();
        const agent = await request(app);
        await new UserHelper().initEnrollee();

        const res = await agent
            .post('/api/teachers')
            .set('Cookie', `session=${await admin.auth(agent)}`)
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

    group.test('register a teacher with a wrong group id', async () => {
        const admin = await new UserHelper({ email: 'admin@example.com' }).initAdmin();
        const agent = await request(app);
        const payload = {
            first_name: 'John',
            last_name: 'Smith',
            father_name: 'Bob',
            phone: '+12124798964',
            email: 'john.smith@example.com',
            password: 'password',
            group_id: 123
        };

        const res = await agent
            .post('/api/teachers')
            .set('Cookie', `session=${await admin.auth(agent)}`)
            .send(payload);
        const teacher = await User.getUserByEmail(payload.email);

        expect(res.statusCode).equals(400);
        expect(teacher).equals(undefined);
    });
});
