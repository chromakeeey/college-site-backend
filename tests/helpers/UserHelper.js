const AccountType = require('../../helpers/AccountType');
const HashHelper = require('../../helpers/HashHelper');

const User = require('../../mysql/user.commands');
const Student = require('../../mysql/student.commands');
const Group = require('../../mysql/group.commands');
const Cookie = require('../../sessions/Cookie');
const GroupHelper = require('./GroupHelper');

class UserHelper {
    constructor({
        id = null,
        accountType = null,
        firstName = 'John',
        lastName = 'Smith',
        fatherName = 'Johnny',
        email = 'john.smith@example.com',
        phone = '13054139724',
        password = 'password',
        isActivated = true
    } = {}) {
        this.id = id;
        this.accountType = accountType;
        this.firstName = firstName;
        this.lastName = lastName;
        this.fatherName = fatherName;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.isActivated = isActivated;
    }

    async auth(agent) {
        const res = await agent
            .post('/api/users/auth')
            .send({
                email: this.email,
                password: this.password
            });

        return Cookie.parse(res.res.headers['set-cookie'][0]).session;
    }

    async initTeacher({
        isCurator = false,
        groupId = null
    } = {}) {
        this.accountType = AccountType.TEACHER;
        await this.#generateUser();

        if (isCurator) {
            if (!this.groupId) {
                const group = await new GroupHelper().init();
                this.groupId = group.id;
            }

            await Group.setCurator(this.groupId, this.id);
        }

        return this;
    }

    async initAdmin() {
        this.accountType = AccountType.ADMINISTRATOR;
        await this.#generateUser();

        return this;
    }

    async initEnrollee() {
        this.accountType = AccountType.ENROLLEE;
        await this.#generateUser();

        return this;
    }

    async initStudent({
        groupId = null,
        isActivated = false
    } = {}) {
        this.isActivated = isActivated;
        this.accountType = AccountType.STUDENT;
        await this.#generateUser();

        if (!this.groupId) {
            const group = await new GroupHelper().init();
            this.groupId = group.id;
        }

        await Student.addStudentData({
            user_id: this.id,
            group_id: this.groupId
        })

        return this;
    }

    async #generateUser() {
        this.id = await User.addUser({
            firstName: this.firstName,
            lastName: this.lastName,
            fatherName: this.fatherName,
            email: this.email,
            password: await HashHelper.hash(this.password),
            isActivated: this.isActivated,
            accountType: this.accountType,
            phone: this.phone
        });
    }
}

module.exports = UserHelper;
