const Group = require('../../mysql/group.commands');

class GroupHelper {
    constructor() {
        this.specialtyId = 5;
        this.course = 4;
        this.subgroup = 1;
    }

    async init() {
        this.id = await Group.addGroup({
            specialtyId: this.specialtyId,
            course: this.course,
            subgroup: this.subgroup
        });

        return this;
    }
}

module.exports = GroupHelper;
