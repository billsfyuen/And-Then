import { Request, Response, Router } from "express";
import { pgClient } from '../utils/pgClient';
import { io } from "../main";
// import { Socket } from "socket.io";

export const chatRoomRouter = Router();

chatRoomRouter.get('/message/:projectId', getAllMessages);
chatRoomRouter.post('/', sendMyMessage);
chatRoomRouter.put('/', editMyMessage);

// ==================== Show Server Error ====================
export function serverError(err: any, res: Response) {
    console.log(err)
    res.status(500).json({ message: 'Server internal error.' })
}

// ==================== Show All Messages ====================

async function getGroupMembers(projectId: any) {
    return (await pgClient.query(`
    SELECT project_id, 
    user_id, 
    username,
    email,
    profile_image
    FROM users INNER JOIN user_project_relation
    ON users.id = user_id
    WHERE project_id = $1;`, [projectId])).rows
}

async function getMessagesDate(projectId: any) {
    return (await pgClient.query(`
    SELECT to_char(created_at, 'YYYY-MM-DD') AS created_date  
    FROM messages 
    WHERE project_id = $1 
    GROUP BY created_date 
    ORDER BY created_date ASC;;`, [projectId])).rows
}

async function getAllMessagesFrompgClient(projectId: any) {
    return (await pgClient.query(`
    SELECT project_id, 
    messages.id as messages_id, 
    users.id as users_id, 
    profile_image, 
    username, 
    messages.content, 
    to_char(created_at, 'YYYY-MM-DD') AS created_date,
    to_char(created_at, 'HH24:MI') AS created_time,
    edited_at
    FROM users INNER JOIN messages
    ON users.id = user_id
    WHERE project_id = $1
    ORDER BY created_at ASC  ;`, [projectId])).rows
}

async function getAllMessages(req: Request, res: Response) {
    let { projectId } = req.params;
    console.log("client got messages info by project id: ", projectId);

    let userId = req.session.userId;

    try {
        let allMessagesDate = await getMessagesDate(projectId);
        let groupMembers = await getGroupMembers(projectId);
        let allMessages = await getAllMessagesFrompgClient(projectId);


        res.status(200).json({
            userId: userId,
            projectId: projectId,
            groupMembers: groupMembers,
            allMessagesDate: allMessagesDate,
            allMessages: allMessages
        })


        // console.log(allMessages)
    } catch (err) {
        serverError(err, res);
    }
};





// ==================== Send My Message ====================

async function saveMessageTopgClient(userId: number, projectId: number, content: string) {
    return (await pgClient.query(`INSERT INTO messages (
        user_id, project_id, content, created_at )
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
        RETURNING id;`, [userId, projectId, content])).rows[0].id
}

async function pickJustSentMessage(messageId: number) {
    return (await pgClient.query(
        `SELECT project_id, 
        profile_image, 
        users.id as users_id,
        username, 
        messages.content, 
        created_at
        FROM users INNER JOIN messages
        ON users.id = user_id
        WHERE messages.id = $1`, [messageId])).rows[0]
}

async function sendMyMessage(req: Request, res: Response) {
    let { projectId, content } = req.body;
    let userId: any = req.session.userId;

    try {
        let messageId = await saveMessageTopgClient(userId, projectId, content);
        let justSentMessage = await pickJustSentMessage(messageId);

        res.status(200).json({
            userId: userId,
            message: "Your message has been sent.",
            date: justSentMessage
        })


    } catch (err) {
        serverError(err, res);
    }
}

export async function getProjectFromId(projectId: number) {
    return (await pgClient.query('SELECT * FROM projects WHERE id = $1;', [projectId])).rows[0]
}





// ==================== Edit My Message ====================

async function changeMessageTopgClient(messageId: number, content: string) {
    return (await pgClient.query(`
        UPDATE messages 
        SET content = $1, 
        edited_at = CURRENT_TIMESTAMP
        WHERE Id = $2
        RETURNING content, edited_at, project_id`, [content, messageId])).rows[0]
}

async function editMyMessage(req: Request, res: Response) {
    let { messageId, content } = req.body;
    let userId: any = req.session.userId;

    try {
        let justEditedMessage = await changeMessageTopgClient(messageId, content);

        (justEditedMessage);

        io.to(`chatroom-${1}`).emit('receive-editMessage', { userId: userId, lastEditMessageInfo: content });

        res.status(200).json({
            userId: userId,
            message: "Your message has been edited.",
            date: justEditedMessage
        })
    } catch (err) {
        serverError(err, res);
    }
}





// ==================== Get Last Message For Socket IO ====================

export async function getJustSentMessage(projectId: number) {
    return (await pgClient.query(`
      SELECT project_id, 
      messages.id as messages_id, 
      users.id as users_id, 
      profile_image, 
      username, 
      messages.content, 
      to_char(created_at, 'YYYY-MM-DD') AS created_date,
      to_char(created_at, 'HH24:MI') AS created_time,
      edited_at
      FROM users INNER JOIN messages
      ON users.id = user_id
      WHERE project_id = $1
      ORDER BY created_at DESC 
      LIMIT 1;`, [projectId])).rows[0]
}


export async function getLastEditMessage(messageId: number) {
    return (await pgClient.query(`
    SELECT project_id, 
      messages.id as messages_id, 
      users.id as users_id, 
      profile_image, 
      username, 
      messages.content, 
      to_char(created_at, 'YYYY-MM-DD') AS created_date,
      to_char(created_at, 'HH24:MI') AS created_time,
      edited_at
      FROM users INNER JOIN messages
      ON users.id = user_id
      WHERE messages.id = $1;`, [messageId])).rows[0]
}