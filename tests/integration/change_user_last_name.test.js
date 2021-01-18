const { expect } = require('chai');
const request = require('supertest');
const app = require('../../server');
const test = require('japa');

const databaseReset = require('../helpers/database_reset');
const UserHelper = require('../helpers/UserHelper');

const User = require('../../mysql/user.commands');

test.group('Change user\'s last name', (group) => {
    group.beforeEach(() => databaseReset());

    group.test('a user changes it\'s last name', async () => {
        let enrollee = await new UserHelper().initEnrollee();
        const lastName = 'New Last Name';
        const agent = await request(app);

        const res = await agent
            .put(`/api/users/${enrollee.id}/last-name`)
            .set('Cookie', `session=${await enrollee.auth(agent)}`)
            .send({ last_name: lastName });
        enrollee = await User.getUserByEmail(enrollee.email);

        expect(res.statusCode).equals(201);
        expect(enrollee.last_name).equals(lastName);
    });

    group.test('a user tries to change last name of another user', async () => {
        let student = await new UserHelper({ email: 'student@example.com' }).initStudent();
        const enrollee = await new UserHelper().initEnrollee();
        const lastName = 'New Last Name';
        const agent = await request(app);

        const res = await agent
            .put(`/api/users/${student.id}/last-name`)
            .set('Cookie', `session=${await enrollee.auth(agent)}`)
            .send({ last_name: lastName });
        student = await User.getUserByEmail(student.email);

        expect(res.statusCode).equals(403);
        expect(student.last_name).not.equals(lastName);
    });

    group.test('an administrator changes last name of another user', async () => {
        let enrollee = await new UserHelper().initEnrollee();
        const admin = await new UserHelper({ email: 'admin@example.com' }).initAdmin();
        const lastName = 'New Last Name';
        const agent = await request(app);

        const res = await agent
            .put(`/api/users/${enrollee.id}/last-name`)
            .set('Cookie', `session=${await admin.auth(agent)}`)
            .send({ last_name: lastName });
        enrollee = await User.getUserByEmail(enrollee.email);

        expect(res.statusCode).equals(201);
        expect(enrollee.last_name).equals(lastName);
    });

    group.test('an administrator tries to change last name of a non existent user', async () => {
        const admin = await new UserHelper({ email: 'admin@example.com' }).initAdmin();
        const lastName = 'New Last Name';
        const agent = await request(app);

        const res = await agent
            .put('/api/users/123/last-name')
            .set('Cookie', `session=${await admin.auth(agent)}`)
            .send({ last_name: lastName });;

        expect(res.statusCode).equals(404);
    });

    group.test('a user tries to change last name of a non existent user', async () => {
        const enrollee = await new UserHelper().initEnrollee();
        const lastName = 'New Last Name';
        const agent = await request(app);

        const res = await agent
            .put('/api/users/123/last-name')
            .set('Cookie', `session=${await enrollee.auth(agent)}`)
            .send({ last_name: lastName });;

        expect(res.statusCode).equals(403);
    });
});
