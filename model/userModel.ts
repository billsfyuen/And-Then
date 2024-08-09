import { pgClient } from "../utils/pgClient";

export default class UserModel {
    constructor() {
    }


    async getUser() {
        await pgClient.query("select * from users;");
    }

    async getUsername(id: number ) {
        await pgClient.query("select * from users where id = $1;", [id]);
    }
    async insert() {
        await pgClient.query("select * from users;");
    }

    async checkUsername(username: string) {
        let checkUniqueQuery = (await pgClient.query(
            "SELECT username FROM users WHERE username = $1",
            [username]
        )).rows[0];
    
        return checkUniqueQuery;
    }
    
    async checkEmail(email: string) {
        let checkUniqueQuery = (await pgClient.query(
            "SELECT id FROM users WHERE username = $1",
            [email]
        )).rows[0];
    
        return checkUniqueQuery;
    }

    async getUserInfo(userId: any) {
        const userQueryResult = (
            await pgClient.query(
                "SELECT id, username, email, profile_image, last_login, registration_date FROM users WHERE id = $1;",
                [userId]
            )).rows[0];
            return userQueryResult
    };

    
}


