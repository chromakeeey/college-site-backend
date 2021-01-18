const { expect } = require('chai');
const request = require('supertest');
const app = require('../../server');
const test = require('japa');

const databaseReset = require('../helpers/database_reset');
const UserHelper = require('../helpers/UserHelper');

const User = require('../../mysql/user.commands');

test.group('Change user\'s phone number', (group) => {
    group.beforeEach(() => databaseReset());

    group.test('a user changes it\'s phone number', async () => {
        let enrollee = await new UserHelper().initEnrollee();
        const phoneNumber = '0155573752';
        const agent = await request(app);

        const res = await agent
            .put(`/api/users/${enrollee.id}/phone`)
            .set('Cookie', `session=${await enrollee.auth(agent)}`)
            .send({ phone: phoneNumber });
        enrollee = await User.getUserByEmail(enrollee.email);

        expect(res.statusCode).equals(201);
        expect(enrollee.phone).equals(phoneNumber);
    });

    group.test('a user tries to change phone number of another user', async () => {
        let student = await new UserHelper({ email: 'student@example.com' }).initStudent();
        const enrollee = await new UserHelper().initEnrollee();
        const phoneNumber = '0155573752';
        const agent = await request(app);

        const res = await agent
            .put(`/api/users/${student.id}/phone`)
            .set('Cookie', `session=${await enrollee.auth(agent)}`)
            .send({ phone: phoneNumber });
        student = await User.getUserByEmail(student.email);

        expect(res.statusCode).equals(403);
        expect(student.phone).not.equals(phoneNumber);
    });

    group.test('an administrator changes phone number of another user', async () => {
        let enrollee = await new UserHelper().initEnrollee();
        const admin = await new UserHelper({ email: 'admin@example.com' }).initAdmin();
        const phoneNumber = '0155573752';
        const agent = await request(app);

        const res = await agent
            .put(`/api/users/${enrollee.id}/phone`)
            .set('Cookie', `session=${await admin.auth(agent)}`)
            .send({ phone: phoneNumber });
        enrollee = await User.getUserByEmail(enrollee.email);

        expect(res.statusCode).equals(201);
        expect(enrollee.phone).equals(phoneNumber);
    });

    group.test('an administrator tries to change phone number of a non existent user', async () => {
        const admin = await new UserHelper({ email: 'admin@example.com' }).initAdmin();
        const phoneNumber = '0155573752';
        const agent = await request(app);

        const res = await agent
            .put('/api/users/123/phone')
            .set('Cookie', `session=${await admin.auth(agent)}`)
            .send({ phone: phoneNumber });;

        expect(res.statusCode).equals(404);
    });

    group.test('a user tries to change phone number of a non existent user', async () => {
        const enrollee = await new UserHelper().initEnrollee();
        const phoneNumber = '0155573752';
        const agent = await request(app);

        const res = await agent
            .put('/api/users/123/phone')
            .set('Cookie', `session=${await enrollee.auth(agent)}`)
            .send({ phone: phoneNumber });;

        expect(res.statusCode).equals(403);
    });
});
