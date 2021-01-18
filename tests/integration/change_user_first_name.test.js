const { expect } = require('chai');
const request = require('supertest');
const app = require('../../server');
const test = require('japa');

const databaseReset = require('../helpers/database_reset');
const UserHelper = require('../helpers/UserHelper');

const User = require('../../mysql/user.commands');

test.group('Change user\'s first name', (group) => {
    group.beforeEach(() => databaseReset());

    group.test('a user changes it\'s first name', async () => {
        let enrollee = await new UserHelper().initEnrollee();
        const firstName = 'New First Name';
        const agent = await request(app);

        const res = await agent
            .put(`/api/users/${enrollee.id}/first-name`)
            .set('Cookie', `session=${await enrollee.auth(agent)}`)
            .send({ first_name: firstName });
        enrollee = await User.getUserByEmail(enrollee.email);

        expect(res.statusCode).equals(201);
        expect(enrollee.first_name).equals(firstName);
    });

    group.test('a user tries to change first name of another user', async () => {
        let student = await new UserHelper({ email: 'student@example.com' }).initStudent();
        const enrollee = await new UserHelper().initEnrollee();
        const firstName = 'New First Name';
        const agent = await request(app);

        const res = await agent
            .put(`/api/users/${student.id}/first-name`)
            .set('Cookie', `session=${await enrollee.auth(agent)}`)
            .send({ first_name: firstName });
        student = await User.getUserByEmail(student.email);

        expect(res.statusCode).equals(403);
        expect(student.first_name).not.equals(firstName);
    });

    group.test('an administrator changes first name of another user', async () => {
        let enrollee = await new UserHelper().initEnrollee();
        const admin = await new UserHelper({ email: 'admin@example.com' }).initAdmin();
        const firstName = 'New First Name';
        const agent = await request(app);

        const res = await agent
            .put(`/api/users/${enrollee.id}/first-name`)
            .set('Cookie', `session=${await admin.auth(agent)}`)
            .send({ first_name: firstName });
        enrollee = await User.getUserByEmail(enrollee.email);

        expect(res.statusCode).equals(201);
        expect(enrollee.first_name).equals(firstName);
    });

    group.test('an administrator tries to change first name of a non existent user', async () => {
        const admin = await new UserHelper({ email: 'admin@example.com' }).initAdmin();
        const firstName = 'New First Name';
        const agent = await request(app);

        const res = await agent
            .put('/api/users/123/first-name')
            .set('Cookie', `session=${await admin.auth(agent)}`)
            .send({ first_name: firstName });;

        expect(res.statusCode).equals(404);
    });

    group.test('a user tries to change first name of a non existent user', async () => {
        const enrollee = await new UserHelper().initEnrollee();
        const firstName = 'New First Name';
        const agent = await request(app);

        const res = await agent
            .put('/api/users/123/first-name')
            .set('Cookie', `session=${await enrollee.auth(agent)}`)
            .send({ first_name: firstName });;

        expect(res.statusCode).equals(403);
    });
});
