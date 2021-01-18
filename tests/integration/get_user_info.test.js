const { expect } = require('chai');
const request = require('supertest');
const app = require('../../server');
const test = require('japa');

const databaseReset = require('../helpers/database_reset');
const UserHelper = require('../helpers/UserHelper');

const GroupHelper = require('../helpers/GroupHelper');

test.group('Get user info', (group) => {
    group.beforeEach(() => databaseReset());

    group.test('get user info of an enrollee', async () => {
        const enrollee = await new UserHelper().initEnrollee();
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${enrollee.id}`)
            .set('Cookie', `session=${await enrollee.auth(agent)}`);

        expect(res.statusCode).equals(200);
        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', enrollee.accountType);
        expect(res.body.account_type).to.have.property('name', 'Абітурієнт');
        expect(res.body).to.have.property('first_name', enrollee.firstName);
        expect(res.body).to.have.property('last_name', enrollee.lastName);
        expect(res.body).to.have.property('father_name', enrollee.fatherName);
        expect(res.body).to.have.property('phone', enrollee.phone);
        expect(res.body).to.have.property('id', enrollee.id);
        expect(res.body).to.have.property('email', enrollee.email);
        expect(res.body).to.have.property('is_activated', enrollee.isActivated);
    });

    group.test('get user info of a student', async () => {
        const group = await new GroupHelper().init();
        const student = await new UserHelper().initStudent({
            isActivated: true,
            groupId: group.id
        });
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${student.id}`)
            .set('Cookie', `session=${await student.auth(agent)}`);

        expect(res.statusCode).equals(200);

        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', student.accountType);
        expect(res.body.account_type).to.have.property('name', 'Студент');

        expect(res.body).to.have.property('group');
        expect(res.body.group).to.have.property('course', group.course);
        expect(res.body.group).to.have.property('group_id', group.id);
        expect(res.body.group).to.have.property('group_name', `${group.specialtyId}${group.course}${group.subgroup}`);

        expect(res.body.group).to.have.property('specialty_id', group.specialtyId);
        expect(res.body.group).to.have.property('specialty_name', 'Інженерія програмного забезпечення');
        expect(res.body.group).to.have.property('subgroup', group.subgroup);

        expect(res.body).to.have.property('first_name', student.firstName);
        expect(res.body).to.have.property('last_name', student.lastName);
        expect(res.body).to.have.property('father_name', student.fatherName);
        expect(res.body).to.have.property('phone', student.phone);
        expect(res.body).to.have.property('id', student.id);
        expect(res.body).to.have.property('email', student.email);
        expect(res.body).to.have.property('is_activated', student.isActivated);
    });

    group.test('get user info of a teacher', async () => {
        const group = await new GroupHelper().init();
        const teacher = await new UserHelper().initTeacher({
            groupId: group.id
        });
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${teacher.id}`)
            .set('Cookie', `session=${await teacher.auth(agent)}`);

        expect(res.statusCode).equals(200);

        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', teacher.accountType);
        expect(res.body.account_type).to.have.property('name', 'Викладач');

        expect(res.body).to.have.property('first_name', teacher.firstName);
        expect(res.body).to.have.property('last_name', teacher.lastName);
        expect(res.body).to.have.property('father_name', teacher.fatherName);
        expect(res.body).to.have.property('phone', teacher.phone);
        expect(res.body).to.have.property('id', teacher.id);
        expect(res.body).to.have.property('email', teacher.email);
        expect(res.body).to.have.property('is_activated', teacher.isActivated);
        
        expect(res.body).to.have.property('is_curator', teacher.isCurator);
        expect(res.body).not.to.have.property('group');
    });

    group.test('get user info of an administrator', async () => {
        const admin = await new UserHelper().initAdmin();
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${admin.id}`)
            .set('Cookie', `session=${await admin.auth(agent)}`);

        expect(res.statusCode).equals(200);

        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', admin.accountType);
        expect(res.body.account_type).to.have.property('name', 'Адміністратор');

        expect(res.body).to.have.property('first_name', admin.firstName);
        expect(res.body).to.have.property('last_name', admin.lastName);
        expect(res.body).to.have.property('father_name', admin.fatherName);
        expect(res.body).to.have.property('phone', admin.phone);
        expect(res.body).to.have.property('id', admin.id);
        expect(res.body).to.have.property('email', admin.email);
        expect(res.body).to.have.property('is_activated', admin.isActivated);
    });

    group.test('a student gets user info of another student', async () => {
        const group = await new GroupHelper().init();
        const student = await new UserHelper().initStudent({
            groupId: group.id,
            isActivated: true
        });
        const anotherStudent = await new UserHelper({ email: 'student@example.com' }).initStudent({
            groupId: group.id,
            isActivated: true
        });
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${anotherStudent.id}`)
            .set('Cookie', `session=${await student.auth(agent)}`);

        expect(res.statusCode).equals(200);

        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', anotherStudent.accountType);
        expect(res.body.account_type).to.have.property('name', 'Студент');

        expect(res.body).to.have.property('group');
        expect(res.body.group).to.have.property('course', group.course);
        expect(res.body.group).to.have.property('group_id', group.id);
        expect(res.body.group).to.have.property('group_name', `${group.specialtyId}${group.course}${group.subgroup}`);

        expect(res.body.group).to.have.property('specialty_id', group.specialtyId);
        expect(res.body.group).to.have.property('specialty_name', 'Інженерія програмного забезпечення');
        expect(res.body.group).to.have.property('subgroup', group.subgroup);

        expect(res.body).to.have.property('first_name', anotherStudent.firstName);
        expect(res.body).to.have.property('last_name', anotherStudent.lastName);
        expect(res.body).to.have.property('father_name', anotherStudent.fatherName);
        expect(res.body).to.have.property('id', anotherStudent.id);
        expect(res.body).to.have.property('is_activated', anotherStudent.isActivated);

        expect(res.body).not.to.have.property('phone', anotherStudent.phone);
        expect(res.body).not.to.have.property('email', anotherStudent.email);
    });

    group.test('a student gets user info of a teacher', async () => {
        const teacher = await new UserHelper().initTeacher();
        const student = await new UserHelper({ email: 'student@example.com' }).initStudent({ isActivated: true });
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${teacher.id}`)
            .set('Cookie', `session=${await student.auth(agent)}`);

        expect(res.statusCode).equals(200);

        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', teacher.accountType);
        expect(res.body.account_type).to.have.property('name', 'Викладач');

        expect(res.body).to.have.property('first_name', teacher.firstName);
        expect(res.body).to.have.property('last_name', teacher.lastName);
        expect(res.body).to.have.property('father_name', teacher.fatherName);
        expect(res.body).to.have.property('phone', teacher.phone);
        expect(res.body).to.have.property('email', teacher.email);
        expect(res.body).to.have.property('id', teacher.id);
        expect(res.body).to.have.property('is_activated', teacher.isActivated);

        expect(res.body).to.have.property('is_curator', teacher.isCurator);
        expect(res.body).not.to.have.property('group');
    });

    group.test('a student gets user info of an enrollee', async () => {
        const enrollee = await new UserHelper().initEnrollee();
        const student = await new UserHelper({ email: 'student@example.com' }).initStudent({ isActivated: true });
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${enrollee.id}`)
            .set('Cookie', `session=${await student.auth(agent)}`);

        expect(res.statusCode).equals(200);

        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', enrollee.accountType);
        expect(res.body.account_type).to.have.property('name', 'Абітурієнт');

        expect(res.body).to.have.property('first_name', enrollee.firstName);
        expect(res.body).to.have.property('last_name', enrollee.lastName);
        expect(res.body).to.have.property('father_name', enrollee.fatherName);
        expect(res.body).to.have.property('id', enrollee.id);
        expect(res.body).to.have.property('is_activated', enrollee.isActivated);

        expect(res.body).not.to.have.property('phone', enrollee.phone);
        expect(res.body).not.to.have.property('email', enrollee.email);
    });

    group.test('a student gets user info of an administrator', async () => {
        const admin = await new UserHelper().initAdmin();
        const student = await new UserHelper({ email: 'student@example.com' }).initStudent({ isActivated: true });
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${admin.id}`)
            .set('Cookie', `session=${await student.auth(agent)}`);

        expect(res.statusCode).equals(200);

        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', admin.accountType);
        expect(res.body.account_type).to.have.property('name', 'Адміністратор');

        expect(res.body).to.have.property('first_name', admin.firstName);
        expect(res.body).to.have.property('last_name', admin.lastName);
        expect(res.body).to.have.property('father_name', admin.fatherName);
        expect(res.body).to.have.property('phone', admin.phone);
        expect(res.body).to.have.property('email', admin.email);
        expect(res.body).to.have.property('id', admin.id);
        expect(res.body).to.have.property('is_activated', admin.isActivated);
    });

    group.test('a teacher gets user info of another teacher ', async () => {
        const teacher = await new UserHelper().initTeacher();
        const anotherTeacher = await new UserHelper({ email: 'teacher@example.com' }).initTeacher();
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${anotherTeacher.id}`)
            .set('Cookie', `session=${await teacher.auth(agent)}`);

        expect(res.statusCode).equals(200);

        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', anotherTeacher.accountType);
        expect(res.body.account_type).to.have.property('name', 'Викладач');

        expect(res.body).to.have.property('first_name', anotherTeacher.firstName);
        expect(res.body).to.have.property('last_name', anotherTeacher.lastName);
        expect(res.body).to.have.property('father_name', anotherTeacher.fatherName);
        expect(res.body).to.have.property('phone', anotherTeacher.phone);
        expect(res.body).to.have.property('email', anotherTeacher.email);
        expect(res.body).to.have.property('id', anotherTeacher.id);
        expect(res.body).to.have.property('is_activated', anotherTeacher.isActivated);

        expect(res.body).to.have.property('is_curator', anotherTeacher.isCurator);
        expect(res.body).not.to.have.property('group');
    });

    group.test('a teacher gets user info of an enrollee ', async () => {
        const teacher = await new UserHelper().initTeacher();
        const enrollee = await new UserHelper({ email: 'enrollee@example.com' }).initEnrollee();
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${enrollee.id}`)
            .set('Cookie', `session=${await teacher.auth(agent)}`);

        expect(res.statusCode).equals(200);

        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', enrollee.accountType);
        expect(res.body.account_type).to.have.property('name', 'Абітурієнт');

        expect(res.body).to.have.property('first_name', enrollee.firstName);
        expect(res.body).to.have.property('last_name', enrollee.lastName);
        expect(res.body).to.have.property('father_name', enrollee.fatherName);
        expect(res.body).to.have.property('phone', enrollee.phone);
        expect(res.body).to.have.property('email', enrollee.email);
        expect(res.body).to.have.property('id', enrollee.id);
        expect(res.body).to.have.property('is_activated', enrollee.isActivated);
    });

    group.test('a teacher gets user info of an administrator ', async () => {
        const teacher = await new UserHelper().initTeacher();
        const admin = await new UserHelper({ email: 'admin@example.com' }).initAdmin();
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${admin.id}`)
            .set('Cookie', `session=${await teacher.auth(agent)}`);

        expect(res.statusCode).equals(200);

        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', admin.accountType);
        expect(res.body.account_type).to.have.property('name', 'Адміністратор');

        expect(res.body).to.have.property('first_name', admin.firstName);
        expect(res.body).to.have.property('last_name', admin.lastName);
        expect(res.body).to.have.property('father_name', admin.fatherName);
        expect(res.body).to.have.property('phone', admin.phone);
        expect(res.body).to.have.property('email', admin.email);
        expect(res.body).to.have.property('id', admin.id);
        expect(res.body).to.have.property('is_activated', admin.isActivated);
    });

    group.test('a teacher gets user info of a student', async () => {
        const group = await new GroupHelper().init();
        const teacher = await new UserHelper().initTeacher();
        const student = await new UserHelper({ email: 'student@example.com' }).initStudent({
            groupId: group.id,
            isActivated: true
        });
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${student.id}`)
            .set('Cookie', `session=${await teacher.auth(agent)}`);

        expect(res.statusCode).equals(200);

        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', student.accountType);
        expect(res.body.account_type).to.have.property('name', 'Студент');

        expect(res.body).to.have.property('group');
        expect(res.body.group).to.have.property('course', group.course);
        expect(res.body.group).to.have.property('group_id', group.id);
        expect(res.body.group).to.have.property('group_name', `${group.specialtyId}${group.course}${group.subgroup}`);

        expect(res.body.group).to.have.property('specialty_id', group.specialtyId);
        expect(res.body.group).to.have.property('specialty_name', 'Інженерія програмного забезпечення');
        expect(res.body.group).to.have.property('subgroup', group.subgroup);

        expect(res.body).to.have.property('first_name', student.firstName);
        expect(res.body).to.have.property('last_name', student.lastName);
        expect(res.body).to.have.property('father_name', student.fatherName);
        expect(res.body).to.have.property('phone', student.phone);
        expect(res.body).to.have.property('email', student.email);
        expect(res.body).to.have.property('id', student.id);
        expect(res.body).to.have.property('is_activated', student.isActivated);
    });

    group.test('an enrollee gets user info of a student', async () => {
        const group = await new GroupHelper().init();
        const enrollee = await new UserHelper().initEnrollee();
        const student = await new UserHelper({ email: 'student@example.com' }).initStudent({
            groupId: group.id,
            isActivated: true
        });
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${student.id}`)
            .set('Cookie', `session=${await enrollee.auth(agent)}`);

        expect(res.statusCode).equals(200);

        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', student.accountType);
        expect(res.body.account_type).to.have.property('name', 'Студент');

        expect(res.body).to.have.property('group');
        expect(res.body.group).to.have.property('course', group.course);
        expect(res.body.group).to.have.property('group_id', group.id);
        expect(res.body.group).to.have.property('group_name', `${group.specialtyId}${group.course}${group.subgroup}`);

        expect(res.body.group).to.have.property('specialty_id', group.specialtyId);
        expect(res.body.group).to.have.property('specialty_name', 'Інженерія програмного забезпечення');
        expect(res.body.group).to.have.property('subgroup', group.subgroup);

        expect(res.body).to.have.property('first_name', student.firstName);
        expect(res.body).to.have.property('last_name', student.lastName);
        expect(res.body).to.have.property('father_name', student.fatherName);
        expect(res.body).to.have.property('id', student.id);
        expect(res.body).to.have.property('is_activated', student.isActivated);

        expect(res.body).not.to.have.property('phone', student.phone);
        expect(res.body).not.to.have.property('email', student.email);
    });

    group.test('an enrollee gets user info of a teacher', async () => {
        const teacher = await new UserHelper().initTeacher();
        const enrollee = await new UserHelper({ email: 'enrollee@example.com' }).initEnrollee();
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${teacher.id}`)
            .set('Cookie', `session=${await enrollee.auth(agent)}`);

        expect(res.statusCode).equals(200);

        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', teacher.accountType);
        expect(res.body.account_type).to.have.property('name', 'Викладач');

        expect(res.body).to.have.property('first_name', teacher.firstName);
        expect(res.body).to.have.property('last_name', teacher.lastName);
        expect(res.body).to.have.property('father_name', teacher.fatherName);
        expect(res.body).to.have.property('phone', teacher.phone);
        expect(res.body).to.have.property('email', teacher.email);
        expect(res.body).to.have.property('id', teacher.id);
        expect(res.body).to.have.property('is_activated', teacher.isActivated);

        expect(res.body).to.have.property('is_curator', teacher.isCurator);
        expect(res.body).not.to.have.property('group');
    });

    group.test('an enrollee gets user info of another enrollee', async () => {
        const anotherEnrollee = await new UserHelper().initEnrollee();
        const enrollee = await new UserHelper({ email: 'enrollee@example.com' }).initEnrollee();
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${anotherEnrollee.id}`)
            .set('Cookie', `session=${await enrollee.auth(agent)}`);

        expect(res.statusCode).equals(200);

        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', anotherEnrollee.accountType);
        expect(res.body.account_type).to.have.property('name', 'Абітурієнт');

        expect(res.body).to.have.property('first_name', anotherEnrollee.firstName);
        expect(res.body).to.have.property('last_name', anotherEnrollee.lastName);
        expect(res.body).to.have.property('father_name', anotherEnrollee.fatherName);
        expect(res.body).to.have.property('id', anotherEnrollee.id);
        expect(res.body).to.have.property('is_activated', anotherEnrollee.isActivated);

        expect(res.body).not.to.have.property('phone', anotherEnrollee.phone);
        expect(res.body).not.to.have.property('email', anotherEnrollee.email);
    });

    group.test('an enrollee gets user info of an administrator', async () => {
        const admin = await new UserHelper().initAdmin();
        const enrollee = await new UserHelper({ email: 'enrollee@example.com' }).initEnrollee();
        const agent = await request(app);

        const res = await agent
            .get(`/api/users/${admin.id}`)
            .set('Cookie', `session=${await enrollee.auth(agent)}`);

        expect(res.statusCode).equals(200);

        expect(res.body).to.have.property('account_type');
        expect(res.body.account_type).to.have.property('id', admin.accountType);
        expect(res.body.account_type).to.have.property('name', 'Адміністратор');

        expect(res.body).to.have.property('first_name', admin.firstName);
        expect(res.body).to.have.property('last_name', admin.lastName);
        expect(res.body).to.have.property('father_name', admin.fatherName);
        expect(res.body).to.have.property('phone', admin.phone);
        expect(res.body).to.have.property('email', admin.email);
        expect(res.body).to.have.property('id', admin.id);
        expect(res.body).to.have.property('is_activated', admin.isActivated);
    });
});
