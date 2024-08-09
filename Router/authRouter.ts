import { Request, Response, Router } from "express";
import { checkPassword, hashPassword } from "../utils/hash";
import { pgClient } from "../utils/pgClient";
import formidable from "formidable";
import { isLoggedIn } from "../utils/guard";
import { generatePassword, generateRandomNumChar } from "../utils/randomGenerator";
import UserModel from "../model/userModel";

export const authRouter = Router();

authRouter.post("/registration", userRegistration);
authRouter.post("/check-user-exist", checkUserExist);
authRouter.post("/username-login", usernameLogin);
authRouter.post("/email-login", emailLogin);
authRouter.get("/google-login", googleLogin);
authRouter.post("/logout", isLoggedIn, logout);
authRouter.get("/user", isLoggedIn, getUserInfo);
authRouter.get("/other-user", isLoggedIn, getOtherUserInfo);
authRouter.post("/inspect-password", isLoggedIn, inspectPassword);
authRouter.put("/password-update", isLoggedIn, updatePassword);
authRouter.post("/profile-image-update", updateProfileImage);
authRouter.put("/username-update", isLoggedIn, usernameUpdate);
authRouter.put("/user-profile-update", userProfileUpdate);
authRouter.put("/update-log-time", isLoggedIn, updateLogTime);
authRouter.get("/search-user", isLoggedIn, searchUser);

async function getUsername(req: Request, res: Response) {
    try {
        const userModel = new UserModel()
        const username = await userModel.getUsername(req.session.userId!)
        res.json({
            msg: username
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal sever error" });
    }
};

async function userRegistration(req: Request, res: Response) {
    try {
        //not allow profile image upload on initial registration

        const { username, email, password } = req.body;
        const userMode = new UserModel();

        let isUsernameExist = await userMode.checkUsername(username);
        let isEmailExist = await userMode.checkEmail(email);

        if (isUsernameExist || isEmailExist) {
            res.status(400).json({
                message: "user registration failed",
                error: "username and/or email already exist(s) in database"
            });
            return
        } else {

            let hashedPassword = await hashPassword(password);

            let userQueryResult = (await pgClient.query(
                "INSERT INTO users (username, email, password, registration_date) VALUES ($1, $2, $3, CURRENT_DATE) RETURNING id, username",
                [username, email, hashedPassword]
            )).rows[0];

            res.json({
                message: "user registration successful",
                data: {
                    id: userQueryResult.id,
                    username: userQueryResult.username
                }
            });
        }

        // const userModel = new UserModel() 
        // const username = await userModel.getUsername(req.session.userId!)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal sever error" });
    }
};

async function checkUserExist(req: Request, res: Response) {
    try {
        const { username, email } = req.body;

        let checkUniqueQuery = (await pgClient.query(
            "SELECT id FROM users WHERE username = $1 OR email = $2",
            [username, email]
        )).rows[0];

        let message = checkUniqueQuery ?
            "username and/or email already exist(s)" :
            "username and email does not exist";


        res.json({
            message: message,
            isExist: !!checkUniqueQuery
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal sever error" });
    }
}

async function usernameLogin(req: Request, res: Response) {
    try {
        const { username, password, isFirstLogin } = req.body;

        const userQuery = (
            await pgClient.query(
                "SELECT id, username, email, password FROM users WHERE username = $1",
                [username]
            )).rows[0];

        //check if username exist in DB
        if (!userQuery) {
            throw new Error("login failed")
        }
        let isPasswordMatched = await checkPassword({
            plainPassword: password,
            hashedPassword: userQuery.password
        });
        if (!isPasswordMatched) {
            throw new Error("login failed")
        } 
        req.session.userId = userQuery.id;
        req.session.username = userQuery.username;
        req.session.save();
        const userLoginQuery = (
            await pgClient.query(
                "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1 RETURNING last_login",
                [userQuery.id]
            )).rows[0];

        res.json({
            message: "first login successful",
            data: {
                id: userQuery.id,
                username: userQuery.username,
                last_login: !!userLoginQuery.last_login
            }
        });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

async function emailLogin(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        const userQuery = (
            await pgClient.query(
                "SELECT id, username, email, password FROM users WHERE email = $1",
                [email]
            )).rows[0];

        //check if email exist in DB
        if (!userQuery) {

            console.log(`email: ${email} does not exist in users db`);

            res.status(400).json({
                message: "login failed",
                error: "invalid credentials"
            });

        } else {

            let isPasswordMatched = await checkPassword({
                plainPassword: password,
                hashedPassword: userQuery.password
            });

            //check if password matches
            if (!isPasswordMatched) {

                console.log(`password incorrect`);

                res.status(400).json({
                    message: "login failed",
                    error: "invalid credentials"
                });

            } else {

                req.session.userId = userQuery.id;
                req.session.username = userQuery.username;

                req.session.save();

                //log last login_time
                const userLoginQuery = (
                    await pgClient.query(
                        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1 RETURNING last_login",
                        [userQuery.id]
                    )).rows[0];

                res.json({
                    message: "login successful",
                    data: {
                        id: userQuery.id,
                        username: userQuery.username,
                        last_login: userLoginQuery.last_login
                    }
                });
            };
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal sever error" });
    }
};

async function googleLogin(req: Request, res: Response) {

    try {
        const accessToken = req.session?.['grant'].response.access_token;
        const fetchRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        const result: any = await fetchRes.json();
        const email = result.email;

        //check if google email already exist in DB
        let checkUniqueQuery = (await pgClient.query(
            "SELECT id, username, email FROM users WHERE email = $1",
            [email]
        )).rows[0];

        if (checkUniqueQuery) {
            //if google email exist in DB, login with google email
            req.session.userId = checkUniqueQuery.id;
            req.session.username = checkUniqueQuery.username;

            //log last login_time
            await pgClient.query(
                "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1 RETURNING last_login",
                [checkUniqueQuery.id]
            );

        } else {

            //if google email does not exist in DB, register with google email

            //generate random password
            let password = generatePassword(10);
            let hashedPassword = await hashPassword(password);

            //handle generate unique username
            let gmail = result.email;
            let [username, domain] = gmail.split("@");
            const userModel = new UserModel();
            while (await userModel.checkUsername(username)) {
                username += `_${generateRandomNumChar(2)}`;
            }

            //get full name from Google
            let firstName = (result.given_name) ? result.given_name : "Not Specified";
            let lastName = (result.family_name) ? result.family_name : "Not Specified";

            //set unique marker to identify as new google user in frontend
            username += '@';

            //create new user account
            //username: gmail domain + random
            //password: random 10 chars
            let userQueryResult = (await pgClient.query(
                "INSERT INTO users (username, email, first_name, last_name, password, registration_date) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE) RETURNING id, username;",
                [username, email, firstName, lastName, hashedPassword]
            )).rows[0];

            //login with new user info
            req.session.userId = userQueryResult.id;
            req.session.username = userQueryResult.username;

        }
        req.session.save();
        res.redirect(`/main?id=${req.session.userId}`)

    } catch (error) {
        console.log(error);
    }
}

async function logout(req: Request, res: Response) {
    try {
        //check if user is logged in
        if (!req.session.username) {

            res.status(400).json({
                message: "logout failed",
                error: "no active login session"
            });

        } else {

            req.session.destroy((err) => {

                if (err) {
                    res.status(500).json({
                        message: "internal sever error",
                    });
                }

                res.json({ message: "logout successful" });
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal sever error" });
    }
};

async function getUserInfo(req: Request, res: Response) {
    try {
        let userId = req.session.userId!;
        const userModel = new UserModel()
        const userQueryResult = await userModel.getUserInfo(userId)
        res.json({
            message: "check user info successful",
            data: {
                id: userQueryResult.id,
                username: userQueryResult.username,
                email: userQueryResult.email,
                profile_image: userQueryResult.profile_image,
                last_login: userQueryResult.last_login,
                registration_date: userQueryResult.registration_date
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal sever error" });
    }
};

async function getOtherUserInfo(req: Request, res: Response) {
    try {
        //check if user is logged in
        if (req.session.username) {

            let userId  = req.query.userId;
            let myUserId = req.session.userId;

            const userModel = new UserModel()
            const userQueryResult = await userModel.getUserInfo(userId)

            res.json({
                message: "check other user info successful",
                myUserId: myUserId,
                data: {
                    id: userQueryResult.id,
                    username: userQueryResult.username,
                    email: userQueryResult.email,
                    full_name: userQueryResult.first_name + " " + userQueryResult.last_name,
                    location: userQueryResult.location,
                    organization: userQueryResult.organization,
                    profile_image: userQueryResult.profile_image,
                    last_login: userQueryResult.last_login,
                    registration_date: userQueryResult.registration_date
                }
            });
        } else {
            res.status(400).json({
                message: "check username failed",
                error: "no active login session"
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal sever error" });
    }
}

async function inspectPassword(req: Request, res: Response) {
    try {
        //can only update password if an user has logged in
        if (!req.session.username) {

            res.status(400).json({
                message: "update password failed",
                error: "no active login session"
            });
        } else {
            const { password } = req.body;
            let userId = req.session.userId;

            const userQuery = (
                await pgClient.query(
                    "SELECT password FROM users WHERE id = $1;",
                    [userId]
                )).rows[0];

            let isPasswordMatched = await checkPassword({
                plainPassword: password,
                hashedPassword: userQuery.password
            });

            if (isPasswordMatched) {
                res.json({
                    message: "passwordMatched",
                })

            } else {
                res.status(400).json({
                    message: "passwordNotMatched"
                })
            }
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal sever error" });
    }
}

async function updatePassword(req: Request, res: Response) {
    try {
        //can only update password if an user has logged in
        if (!req.session.username) {

            res.status(400).json({
                message: "update password failed",
                error: "no active login session"
            });

        } else {

            const { password } = req.body;
            let userId = req.session.userId;

            const userQuery = (
                await pgClient.query(
                    "SELECT password FROM users WHERE id = $1;",
                    [userId]
                )).rows[0];

            //check if input password is same as current password
            let isPasswordMatched = await checkPassword({
                plainPassword: password,
                hashedPassword: userQuery.password
            });

            if (isPasswordMatched) {
                res.status(400).json({
                    message: "password update failed",
                    error: "sameAsCurrentPassword"
                })
            } else {

                let hashedPassword = await hashPassword(password);

                const userQueryResult = (
                    await pgClient.query(
                        "UPDATE users SET password = $1 WHERE id = $2 RETURNING username, password;",
                        [hashedPassword, userId]
                    )).rows[0];

                res.json({
                    message: `${userQueryResult.username} password update successful`,
                    data: { username: userQueryResult.username }
                })
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal sever error" });
    }
};

async function updateProfileImage(req: Request, res: Response) {

    try {
        let id = req.session.userId;
        let username = req.session.username;

        //max file size = 5mb, need to remind users in front end
        const MAX_FILE_SIZE = 20 * 1024 ** 2;

        const imageForm = formidable({
            uploadDir: __dirname + "/../uploads/profile-image",
            keepExtensions: true,
            minFileSize: 0,
            maxFiles: 1,
            allowEmptyFiles: true,
            filter: part => part.mimetype?.startsWith('image/') || false,
            filename: (originalName, originalExt, part, form) => {
                let fieldName = part.name
                let timestamp = Date.now()
                let ext = part.mimetype?.split('/').pop()
                return `${username}-${fieldName}-${timestamp}.${ext}`;
            },
        });

        imageForm.parse(req, async (err, fields, files) => {
            console.log("filesfilesfilesfilesfilesfilesfilesfilesfiles")
            if (err) {
                res.status(500).json({ message: "internal server error" });
            };
            try {
                if (!Array.isArray(files) && files['profile-image']) {
                    let fileSize = (files['profile-image'][0] as formidable.File).size;
                    let filename = (files['profile-image'][0] as formidable.File).newFilename;

                    if (isEmpty(files)) {
                        //check if an image is uploaded
                        console.log("no image has been uploaded");
                        res.status(400).json({
                            message: "profile picture update failed",
                            error: "no image"
                        })

                    } else if (fileSize > MAX_FILE_SIZE) {
                        //check if image uploaded exceed max file size
                        res.status(400).json({
                            message: "profile image update failed",
                            error: "file size exceed maximum"
                        })

                    } else {

                        const userQueryResult = (
                            await pgClient.query(
                                "UPDATE users SET profile_image = $1 WHERE id = $2 RETURNING id, username, profile_image;",
                                [filename, id]
                            )).rows[0];

                        res.json({
                            message: "profile image update successful",
                            data: {
                                id: userQueryResult.id,
                                username: userQueryResult.username,
                                profile_image: userQueryResult.profile_image
                            }
                        })

                    }
                } else {
                    console.log("not and object")
                }
            } catch (e) {
                console.log(e)
                res.status(500).json({ message: "internal server error" });
            }

        })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal sever error" });
    }
};

async function usernameUpdate(req: Request, res: Response) {
    try {
        //username update can only be performed if an user has logged in
        //check if user is logged in
        if (!req.session.username) {

            res.status(400).json({
                message: "update username failed",
                error: "no active login session"
            });

        } else {

            const { username } = req.body;

            //check if username is currently being used by another user
            let checkUniqueQuery = (await pgClient.query(
                "SELECT id FROM users WHERE username = $1",
                [username]
            )).rows[0];

            if (checkUniqueQuery !== undefined) {
                res.status(400).json({
                    message: "username update failed",
                    error: "newUsernameExist"
                });
            } else {
                let id = req.session.userId;
                let updateUsernameQuery = (await pgClient.query(
                    "UPDATE users SET username = $1 WHERE id = $2 RETURNING username",
                    [username, id]
                )).rows[0];

                res.json({
                    message: "username update successful",
                    data: updateUsernameQuery
                });
            }
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal sever error" });
    }
}

//req: firstName, lastName, location, organization
//frontend to handle empty /invalid input
async function userProfileUpdate(req: Request, res: Response) {
    try {

        // username update can only be performed if an user has logged in
        // check if user is logged in
        if (!req.session.username) {

            res.status(400).json({
                message: "update username failed",
                error: "no active login session"
            });
        } else {

            const { firstName, lastName, location, organization } = req.body;

            let id = req.session.userId;

            let updateProfileQuery = (await pgClient.query(
                "UPDATE users SET first_name = $1, last_name = $2, location = $3, organization = $4 WHERE id = $5 RETURNING first_name, last_name, location, organization;",
                [firstName, lastName, location, organization, id]
            )).rows[0];

            res.json({
                message: "user profile update successful",
                data: updateProfileQuery
            })
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal sever error" });
    }

}

//for new registered users to update log time to quit config
async function updateLogTime(req: Request, res: Response) {
    try {
        if (!req.session.username) {

            res.status(400).json({
                message: "update username failed",
                error: "no active login session"
            });
        } else {
            let id = req.session.userId;

            let updateLogTimeQuery = (await pgClient.query(
                "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1 RETURNING last_login",
                [id]
            )).rows[0];

            res.json({
                message: "update last login time successful",
                data: updateLogTimeQuery
            })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal sever error" });
    }
}

function isEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
};


async function searchUser(req: Request, res: Response) {
    let { value } = req.query
    console.log(value);
    try {
        let userList = (
            await pgClient.query(
                "SELECT id, username, email, profile_image FROM users ORDER BY id ASC LIMIT 10;"
            )).rows
   
        if (value) {
            userList = (
                await pgClient.query(
                    "SELECT id, username, email, profile_image FROM users WHERE LOWER(username) || LOWER(email) LIKE LOWER('%' || $1 || '%') ORDER BY id ASC LIMIT 10;",
                    [value]
                )).rows
        }

        if(userList.length == 0) {
            res.json({ message: "no user found" })
            return
        }

        res.status(200).json({ userList: userList })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal sever error" });
    }
}