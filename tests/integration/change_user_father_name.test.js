const { expect } = require('chai');
const request = require('supertest');
const app = require('../../server');
const test = require('japa');

const databaseReset = require('../helpers/database_reset');
const UserHelper = require('../helpers/UserHelper');

const User = require('../../mysql/user.commands');

test.group('Change user\'s father name', (group) => {
    group.beforeEach(() => databaseReset());

    group.test('a user changes it\'s father name', async () => {
        let enrollee = await new UserHelper().initEnrollee();
        const fatherName = 'New Father Name';
        const agent = await request(app);

        const res = await agent
            .put(`/api/users/${enrollee.id}/father-name`)
            .set('Cookie', `session=${await enrollee.auth(agent)}`)
            .send({ father_name: fatherName });
        enrollee = await User.getUserByEmail(enrollee.email);

        expect(res.statusCode).equals(201);
        expect(enrollee.father_name).equals(fatherName);
    });

    group.test('a user tries to change father name of another user', async () => {
        let student = await new UserHelper({ email: 'student@example.com' }).initStudent();
        const enrollee = await new UserHelper().initEnrollee();
        const fatherName = 'New Father Name';
        const agent = await request(app);

        const res = await agent
            .put(`/api/users/${student.id}/father-name`)
            .set('Cookie', `session=${await enrollee.auth(agent)}`)
            .send({ father_name: fatherName });
        student = await User.getUserByEmail(student.email);

        expect(res.statusCode).equals(403);
        expect(student.father_name).not.equals(fatherName);
    });

    group.test('an administrator changes father name of another user', async () => {
        let enrollee = await new UserHelper().initEnrollee();
        const admin = await new UserHelper({ email: 'admin@example.com' }).initAdmin();
        const fatherName = 'New Father Name';
        const agent = await request(app);

        const res = await agent
            .put(`/api/users/${enrollee.id}/father-name`)
            .set('Cookie', `session=${await admin.auth(agent)}`)
            .send({ father_name: fatherName });
        enrollee = await User.getUserByEmail(enrollee.email);

        expect(res.statusCode).equals(201);
        expect(enrollee.father_name).equals(fatherName);
    });

    group.test('an administrator tries to change father name of a non existent user', async () => {
        const admin = await new UserHelper({ email: 'admin@example.com' }).initAdmin();
        const fatherName = 'New Father Name';
        const agent = await request(app);

        const res = await agent
            .put('/api/users/123/father-name')
            .set('Cookie', `session=${await admin.auth(agent)}`)
            .send({ father_name: fatherName });;

        expect(res.statusCode).equals(404);
    });

    group.test('a user tries to change father name of a non existent user', async () => {
        const enrollee = await new UserHelper().initEnrollee();
        const fatherName = 'New Father Name';
        const agent = await request(app);

        const res = await agent
            .put('/api/users/123/father-name')
            .set('Cookie', `session=${await enrollee.auth(agent)}`)
            .send({ father_name: fatherName });;

        expect(res.statusCode).equals(403);
    });
});
