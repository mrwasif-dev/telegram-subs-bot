const fs = require('fs');
const config = require('./config');

class Database {
    constructor() {
        this.users = {};
        this.plans = [];
        this.sessions = {};
        this.pendingAdminRejections = {};
        this.loadData();
    }

    loadData() {
        if (fs.existsSync(config.DATA_FILE)) {
            try {
                const data = JSON.parse(fs.readFileSync(config.DATA_FILE));
                this.users = data.users || {};
                this.plans = data.plans || config.DEFAULT_PLANS;
            } catch (error) {
                console.log('Error loading data:', error);
                this.users = {};
                this.plans = config.DEFAULT_PLANS;
            }
        } else {
            this.plans = config.DEFAULT_PLANS;
            this.saveData();
        }
    }

    saveData() {
        const data = { 
            users: this.users, 
            plans: this.plans 
        };
        fs.writeFileSync(config.DATA_FILE, JSON.stringify(data, null, 2));
    }

    getUser(userId) {
        return this.users[userId];
    }

    setUser(userId, userData) {
        this.users[userId] = userData;
        this.saveData();
    }

    deleteUser(userId) {
        delete this.users[userId];
        this.saveData();
    }

    getAllUsers() {
        return this.users;
    }

    getPlan(planId) {
        return this.plans.find(plan => plan.id === planId);
    }

    getAllPlans() {
        return this.plans.filter(plan => plan.active);
    }

    addPlan(plan) {
        this.plans.push(plan);
        this.saveData();
    }

    updatePlan(planId, updatedPlan) {
        const index = this.plans.findIndex(plan => plan.id === planId);
        if (index !== -1) {
            this.plans[index] = { ...this.plans[index], ...updatedPlan };
            this.saveData();
            return true;
        }
        return false;
    }

    deletePlan(planId) {
        const index = this.plans.findIndex(plan => plan.id === planId);
        if (index !== -1) {
            this.plans.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    getSession(userId) {
        return this.sessions[userId];
    }

    setSession(userId, sessionData) {
        this.sessions[userId] = sessionData;
    }

    deleteSession(userId) {
        delete this.sessions[userId];
    }

    setPendingRejection(userId, reason) {
        this.pendingAdminRejections[userId] = reason;
    }

    getPendingRejection(userId) {
        return this.pendingAdminRejections[userId];
    }

    deletePendingRejection(userId) {
        delete this.pendingAdminRejections[userId];
    }
}

module.exports = new Database();
